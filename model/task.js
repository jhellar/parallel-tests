const fs = require('fs');
const Job = require('./job');
const runWithTimeout = require('../utils/run-with-timeout');

const configFile = fs.readFileSync(process.argv[2], 'utf8');
const config = JSON.parse(configFile);

const startTime = new Date().getTime() / 1000;

class Task extends Job {
  constructor(title, requires, result, run, skipReport, globalResult) {
    super(title, requires, result, run, skipReport, globalResult);

    this.execute = this.execute.bind(this);
  }

  async execute() {
    let retries = 0;
    let finished = false;
    while (!finished) {
      try {
        if (this.parent.beforeEach) {
          await runWithTimeout(this.parent.beforeEach(), config.timeout);
        }
        let error;
        try {
          this.result = await runWithTimeout(this.run(...this.resources), config.timeout);
        } catch (err) {
          error = err;
        }
        if (this.parent.afterEach) {
          await runWithTimeout(this.parent.afterEach(error), config.timeout);
        }
        if (error) {
          throw error;
        }
        finished = true;
      } catch (error) {
        if (retries >= config.retries) {
          this.status = 'ERROR';
          this.error = error;
          throw error;
        }
        retries += 1;
        this.logRetry(error, retries);
      }
    }
  }

  logRetry(error, retry) {
    if (!this.skipReport) {
      const time = Math.trunc((new Date().getTime() / 1000) - startTime);
      console.error(`${error.name}: ${error.message}`);
      console.log(`${time}: retry (${retry}/${config.retries}) - ${this.title} (${this.parentsTitles()})`);
    }
  }
}

module.exports = Task;

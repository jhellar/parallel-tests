const fs = require('fs');
const Job = require('./job');

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
          await this.parent.beforeEach();
        }
        let error;
        try {
          this.result = await Promise.race([
            this.run(...this.resources),
            new Promise((resolve, reject) => setTimeout(() => reject(new Error('Timeout')), config.timeout)),
          ]);
        } catch (err) {
          error = err;
        }
        if (this.parent.afterEach) {
          await this.parent.afterEach(error);
        }
        if (error) {
          throw error;
        }
        finished = true;
      } catch (error) {
        if (retries >= config.retries) {
          this.status = 'error';
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
      console.error(error);
      console.log(`${time}: retry (${retry}/${config.retries}) - ${this.title} (${this.parent.title})`);
    }
  }
}

module.exports = Task;

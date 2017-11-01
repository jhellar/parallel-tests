const Job = require('./job');

class Task extends Job {
  
  constructor(title, requires, result, run, skipReport, globalResult) {
    super(title, requires, result, run, skipReport, globalResult);

    this.execute = this.execute.bind(this);
    this.tryWithTimeout = this.tryWithTimeout.bind(this);
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
          this.result = await this.tryWithTimeout(() => this.run(...this.resources), 600000);
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
        if (retries >= 3) {
          this.status = 'error';
          this.error = error;
          throw error;
        }
        retries += 1;
      }
    }
  }

  tryWithTimeout(func, ms) {
    return new Promise((resolve, reject) => {
      func().then(resolve, reject);
  
      setTimeout(() => {
        reject('Timed out');
      }, ms);
    });
  }

}

module.exports = Task;

const Job = require('./job');

class Task extends Job {
  
  constructor(title, requires, result, run, skipReport) {
    super(title, requires, result, run, skipReport);

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
        this.result = await this.run(...this.resources);
        if (this.parent.afterEach) {
          await this.parent.afterEach();
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

}

module.exports = Task;

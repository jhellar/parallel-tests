const Job = require('./job');

class Task extends Job {
  
  constructor(title, requires, result, run, skipReport) {
    super(title, requires, result, run, skipReport);

    this.execute = this.execute.bind(this);
  }

  async execute() {
    let tries = 0;
    let finished = false;
    while (!finished) {
      tries += 1;
      try {
        this.result = await this.run(...this.resources);
        finished = true;
      } catch (error) {
        if (tries >= 3) {
          this.status = 'error';
          this.error = error;
          throw error;
        }
      }
    }
  }

}

module.exports = Task;

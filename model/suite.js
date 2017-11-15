const Job = require('./job');
const SuitesManager = require('./suites-manager');

class Suite extends Job {
  constructor(title, requires, result, run) {
    super(title, requires, result, run);

    this.jobs = [];
    this.suiteResources = {};
  }

  setup() {
    super.setup();
    if (this.parent.status === 'skipped') {
      this.execute();
    }
  }

  async start() {
    try {
      await super.start();
    } catch (error) {
      if (this.status === 'skipped') {
        await this.execute();
      }
      throw error;
    }
  }

  async execute() {
    SuitesManager.setCurrentSuite(this);
    this.run(...this.resources);
    SuitesManager.setCurrentSuite(this.parent);
    try {
      await Promise.all(this.jobs.map(job => job.promise.catch(e => e)));
      await Promise.all(this.jobs.map(job => job.promise));
    } catch (error) {
      this.status = 'error';
      throw error;
    }
    this.result = await this.suiteResources[this.resultName];
  }

  addJob(job) {
    this.jobs.push(job);
    if (job.resultName) {
      this.suiteResources[job.resultName] = job.promise;
    }
  }
}

module.exports = Suite;

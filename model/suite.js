const fs = require('fs');
const Job = require('./job');
const SuitesManager = require('./suites-manager');
const runWithTimeout = require('../utils/run-with-timeout');

const configFile = fs.readFileSync(process.argv[2], 'utf8');
const config = JSON.parse(configFile);

class Suite extends Job {
  constructor(title, requires, result, run, timeout) {
    super(title, requires, result, run);

    this.jobs = [];
    this.suiteResources = {};
    this.timeout = timeout;

    this.executeJobs = this.executeJobs.bind(this);
  }

  setup() {
    super.setup();
    if (this.parent.status === 'SKIPPED') {
      this.execute();
    }
  }

  async start() {
    try {
      await super.start();
    } catch (error) {
      if (this.status === 'SKIPPED') {
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
      await this.executeJobs();
    } catch (error) {
      this.status = 'ERROR';
      this.error = error;
      throw error;
    }
    this.result = await this.suiteResources[this.resultName];
  }

  async executeJobs() {
    let error;
    if (this.before && this.status === 'PENDING') {
      try {
        await runWithTimeout(this.before(), config.timeout);
      } catch (err) {
        error = err;
        this.status = 'ERROR';
        this.error = error;
      }
    }
    try {
      this.jobs.forEach(job => job.setup());
      await Promise.all(this.jobs.map(job => job.promise.catch(e => e)));
      await Promise.all(this.jobs.map(job => job.promise));
    } catch (err) {
      error = err;
    }
    if (this.after && this.status === 'PENDING') {
      await runWithTimeout(this.after(), config.timeout);
    }
    if (error) {
      throw error;
    }
  }

  addJob(job) {
    this.jobs.push(job);
    if (job.resultName) {
      this.suiteResources[job.resultName] = job.promise;
    }
  }
}

module.exports = Suite;

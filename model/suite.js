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
      if (this.timeout) {
        await runWithTimeout(this.executeJobs(), this.timeout);
      } else {
        await this.executeJobs();
      }
    } catch (error) {
      this.status = 'ERROR';
      this.error = error;
      throw error;
    }
    this.result = await this.suiteResources[this.resultName];
  }

  async executeJobs() {
    if (this.beforePromise) {
      await this.beforePromise.catch(e => e);
    }
    let error;
    try {
      await Promise.all(this.jobs.map(job => job.promise.catch(e => e)));
      await Promise.all(this.jobs.map(job => job.promise));
    } catch (err) {
      error = err;
    }
    if (this.after) {
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

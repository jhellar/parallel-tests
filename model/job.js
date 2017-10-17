const Pool = require('generic-pool').Pool;
const SuitesManager = require('./suites-manager');

const startTime = new Date().getTime() / 1000;
let id = 0;

class Job {

  constructor(title, requires, result, run, skipReport) {
    this.title = title;
    this.requires = requires;
    this.resultName = result;
    this.run = run;
    this.parent = SuitesManager.currentSuite();
    this.skipReport = skipReport;

    id += 1;
    this.id = id;
    this.resources = [];
    this.status = 'pending';

    this.start = this.start.bind(this);
    this.execute = this.execute.bind(this);
    this.acquireResources = this.acquireResources.bind(this);
    if (this.run) {
      this.run = this.run.bind(this);
    }

    this.setup();
  }

  setup() {
    if (this.parent.status === 'skipped') {
      this.status = 'skipped';
      this.log();
      this.promise = Promise.resolve();
    } else {
      this.promise = this.start();
    }
    this.parent.addJob(this);
  }

  async start() {
    try {
      await this.acquireResources();
    } catch (error) {
      this.status = 'skipped';
      this.log();
      throw error;
    }
    this.log();
    let error;
    try {
      await this.execute();
    } catch (err) {
      error = err;
    }
    this.releaseResources();
    if (error) {
      throw error;
    }
    return this.result;
  }

  log() {
    if (!this.skipReport) {
      const time = Math.trunc(new Date().getTime() / 1000 - startTime);
      console.log(`${time}: ${this.status} - ${this.title} (${this.parent.title})`);
    }
  }

  async acquireResources() {    
    if (this.requires) {
      if (!Array.isArray(this.requires)) {
        this.requires = [this.requires];
      }
      for (let resourceName of this.requires) {
        let suite = this.parent;
        while (!suite.suiteResources[resourceName] && suite.parent) {
          suite = suite.parent;
        }
        if (!suite.suiteResources[resourceName]) {
          throw new Error(`Resource ${resourceName} not defined`);
        }
        const resource = await suite.suiteResources[resourceName];
        this.resources.push(resource);
      }
      this.pools = this.resources.filter(resource => resource instanceof Pool);
      for (let pool of this.pools) {
        await pool.acquire();
      }
    }
  }

  releaseResources() {
    if (!this.pools) {
      return;
    }
    for (let pool of this.pools) {
      pool.release();
    }
  }

}

module.exports = Job;

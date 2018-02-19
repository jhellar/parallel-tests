const { Pool } = require('generic-pool');
const colors = require('colors');
const SuitesManager = require('./suites-manager');

const startTime = new Date().getTime() / 1000;
let id = 0;

class Job {
  constructor(title, requires, result, run, skipReport, globalResult) {
    this.title = title;
    this.requires = requires;
    this.resultName = result;
    this.run = run;
    this.parent = SuitesManager.currentSuite();
    this.skipReport = skipReport;
    this.globalResult = globalResult;

    id += 1;
    this.id = id;
    this.resources = [];
    this.status = 'PENDING';

    this.start = this.start.bind(this);
    this.execute = this.execute.bind(this);
    this.acquireResources = this.acquireResources.bind(this);
    if (this.run) {
      this.run = this.run.bind(this);
    }
  }

  setup() {
    if (this.parent.status !== 'PENDING') {
      this.status = 'SKIPPED';
      this.log();
      this.promise = Promise.resolve();
    } else {
      this.promise = this.start();
    }

    this.existingResult = this.getExistingResult();

    if (this.globalResult) {
      let globalSuite = this.parent;
      while (globalSuite.parent) {
        globalSuite = globalSuite.parent;
      }
      globalSuite.addResource(this);
    }
    if (this.resultName) {
      this.parent.suiteResources[this.resultName] = this.promise;
    }
  }

  async start() {
    try {
      await this.acquireResources();
    } catch (error) {
      this.status = 'SKIPPED';
      this.log();
      throw error;
    }
    this.log();
    let error;
    try {
      // If result already exists skip execution
      if (this.existingResult) {
        this.result = await this.existingResult;
      } else {
        await this.execute();
        this.status = 'DONE';
      }
    } catch (err) {
      error = err;
    }
    this.releaseResources();
    if (error) {
      if (this.existingResult) {
        this.status = 'ERROR';
        this.error = error;
      }
      this.log();
      throw error;
    }
    this.log();
    return this.result;
  }

  log() {
    if (!this.skipReport) {
      const time = Math.trunc((new Date().getTime() / 1000) - startTime);
      if (this.status === 'ERROR') {
        console.error(`${this.error.name}: ${this.error.message}`);
      }
      let color;
      switch (this.status) {
        case 'DONE': color = 'green'; break;
        case 'ERROR': color = 'red'; break;
        case 'SKIPPED': color = 'yellow'; break;
        default: color = null;
      }
      const message = `${time}: ${this.status} - ${this.title} (${this.parentsTitles()})`;
      console.log(color ? message[color] : message);
    }
  }

  parentsTitles() {
    const p = [];
    let suite = this.parent;
    while (suite.parent) {
      p.push(suite.title);
      suite = suite.parent;
    }
    return p.join(' - ');
  }

  getExistingResult() {
    let suite = this.parent;
    while (!suite.suiteResources[this.resultName] && suite.parent) {
      suite = suite.parent;
    }
    return suite.suiteResources[this.resultName];
  }

  async acquireResources() {
    if (this.requires) {
      if (!Array.isArray(this.requires)) {
        this.requires = [this.requires];
      }
      for (const resourceName of this.requires) {
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
      for (const pool of this.pools) {
        await pool.acquire();
      }
    }
  }

  releaseResources() {
    if (!this.pools) {
      return;
    }
    for (const pool of this.pools) {
      pool.release();
    }
  }
}

module.exports = Job;

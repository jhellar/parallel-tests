class GlobalSuite {
  constructor() {
    this.title = 'GLOBAL';
    this.jobs = [];
    this.suiteResources = {};
    this.status = 'PENDING';
  }

  addJob(job) {
    this.jobs.push(job);
    this.addResource(job);
  }

  addResource(job) {
    if (job.resultName) {
      this.suiteResources[job.resultName] = job.promise;
    }
  }
}

module.exports = GlobalSuite;

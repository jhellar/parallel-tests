class GlobalSuite {

  constructor() {
    this.title = 'GLOBAL'
    this.jobs = [];
    this.suiteResources = {};
  }

  addJob(job) {
    this.jobs.push(job);
    if (job.resultName) {
      this.suiteResources[job.resultName] = job.promise;
    }
  }

}

module.exports = GlobalSuite;

const builder = require('junit-report-builder');

function suiteReport(suite) {
  const suiteReport = builder.testSuite().name(suite.title);
  reportTestCases(suiteReport, suite.jobs, suite.title);
}

function reportTestCases(suiteReport, jobs, suiteTitle) {
  jobs.forEach(job => {
    if (job.jobs) {
      reportTestCases(suiteReport, job.jobs, suiteTitle)
    } else {
      if (job.skipReport) {
        return;
      }
      const report = suiteReport.testCase()
        .className(suiteTitle)
        .name(job.title);
      if (job.status === 'error') {
        report.failure(job.error);
        report.stacktrace(job.error.stack);
      }
      if (job.status === 'skipped') {
        report.skipped();
      }
    }
  });
}

function generateReport(job) {
  job.jobs.forEach(job => {
    if (job.jobs) {
      const report = suiteReport(job);
    }
  });
  builder.writeTo('report.xml');
}

module.exports = {
  report: generateReport
}
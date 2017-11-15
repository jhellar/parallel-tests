const builder = require('junit-report-builder');

function reportTestCases(sReport, jobs, suiteTitle) {
  jobs.forEach((job) => {
    if (job.jobs) {
      reportTestCases(sReport, job.jobs, suiteTitle);
    } else {
      if (job.skipReport) {
        return;
      }
      const report = sReport.testCase()
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

function suiteReport(suite) {
  const sReport = builder.testSuite().name(suite.title);
  reportTestCases(sReport, suite.jobs, suite.title);
}

function generateReport(job) {
  job.jobs.forEach((j) => {
    if (j.jobs) {
      suiteReport(j);
    }
  });
  builder.writeTo('report.xml');
}

module.exports = {
  report: generateReport,
};

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

let $;
let success;
let failure;
let skip;
let id;

function initialize() {
  const htmlFile = fs.readFileSync(path.resolve(__dirname, 'fixtures/report.html'), 'utf8');
  const templateFile = fs.readFileSync(path.resolve(__dirname, 'fixtures/template.html'), 'utf8');

  $ = cheerio.load(htmlFile);
  success = cheerio.load(templateFile);
  failure = cheerio.load(templateFile);
  skip = cheerio.load(templateFile);

  success('.oi').addClass('oi-circle-check');
  success('.oi').attr('style', 'color:green');

  failure('.oi').addClass('oi-circle-x');
  failure('.oi').attr('style', 'color:red');

  skip('.oi').addClass('oi-warning');
  skip('.oi').attr('style', 'color:blue');

  id = 0;
}

function failureReport(title, error) {
  id += 1;
  failure('a').text(title);
  failure('a').attr('href', `#collapse${id}`);
  failure('a').attr('aria-controls', `collapse${id}`);
  failure('.collapse').attr('id', `collapse${id}`);
  failure('.card').empty();
  failure('.card').append(`<p>${error}</p>`);
  failure('.card').append(`<pre>${error.stack}</pre>`);
  return failure.html();
}

function taskReport(task) {
  if (task.status === 'error') {
    return failureReport(task.title, task.error);
  }
  if (task.skipReport) {
    return '';
  }
  if (task.status === 'skipped') {
    return `<p><span class="oi oi-warning" title="icon name" aria-hidden="true" style="color:blue"></span> ${task.title}</p>`;
  }
  return `<p><span class="oi oi-circle-check" title="icon name" aria-hidden="true" style="color:green"></span> ${task.title}</p>`;
}

function suiteReport(suite) {
  const reports = suite.jobs.map(job => (job.jobs ? suiteReport(job) : taskReport(job)));
  let result;
  if (suite.status === 'error') {
    result = failure;
  } else {
    result = suite.status === 'skipped' ? skip : success;
  }
  result('a').text(suite.title);
  id += 1;
  result('a').attr('href', `#collapse${id}`);
  result('a').attr('aria-controls', `collapse${id}`);
  result('.collapse').attr('id', `collapse${id}`);
  result('.card').empty();
  reports.forEach(report => result(`#collapse${id} > .card`).append(report));
  return result.html();
}

function generateReport(job) {
  initialize();
  job.jobs.forEach((j) => {
    const report = j.jobs ? suiteReport(j) : taskReport(j);
    $('#report').append(report);
  });
  fs.writeFileSync('report.html', $.html());
}

module.exports = {
  report: generateReport,
};

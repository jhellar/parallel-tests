const pool = require('generic-pool');
const Task = require('./model/task');
const Suite = require('./model/suite');
const GlobalSuite = require('./model/global-suite');
const SuitesManager = require('./model/suites-manager');
const HTMLReporter = require('./html-reporter');
const JUnitReporter = require('./junit-reporter');

const globalSuite = new GlobalSuite();
SuitesManager.setCurrentSuite(globalSuite);

async function run() {
  try {
    await Promise.all(globalSuite.jobs.map(job => job.promise.catch(e => e)));
    await Promise.all(globalSuite.jobs.map(job => job.promise));
  } catch (error) {
    console.error(error);
  }
  HTMLReporter.report(globalSuite);
  JUnitReporter.report(globalSuite);
  // console.log(globalSuite.jobs[globalSuite.jobs.length - 1].jobs.map(job => job.title));
}

async function suite(title, params, configure) {
  new Suite(title, params.requires, params.result, configure);
}

function task(title, params, run) {
  if (typeof title !== 'string') {
    run = params;
    params = title;
    title = '';
  }
  new Task(title, params.requires, params.result, run, params.skipReport);
}

function createPool(max) {
  return pool.createPool({ create: () => Promise.resolve(), destroy: () => Promise.resolve() }, { max });
}

module.exports = {
  suite,
  task,
  run
}

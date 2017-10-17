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

function beforeEach(run) {
  const currentSuite = SuitesManager.currentSuite();
  currentSuite.beforeEach = run;
}

function afterEach(run) {
  const currentSuite = SuitesManager.currentSuite();
  currentSuite.afterEach = run;
}

function createPool(max) {
  return pool.createPool({ create: () => Promise.resolve(), destroy: () => Promise.resolve() }, { max });
}

function createGlobalPool(name, max) {
  new Task('Global pool', [], name, () => createPool(max), true);
}

function it(title, run) {
  const currentSuite = SuitesManager.currentSuite();
  if (!currentSuite.itPool) {
    currentSuite.itPool = true;
    new Task('It pool', [], 'itPool', () => createPool(1), true);
  }
  new Task(title, 'itPool', null, run);
}

module.exports = {
  suite,
  task,
  run,
  createPool,
  createGlobalPool,
  beforeEach,
  afterEach,
  it
}

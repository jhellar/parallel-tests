const pool = require('generic-pool');
const fs = require('fs');
const Task = require('./model/task');
const Suite = require('./model/suite');
const GlobalSuite = require('./model/global-suite');
const SuitesManager = require('./model/suites-manager');
const HTMLReporter = require('./html-reporter');
const JUnitReporter = require('./junit-reporter');
const runWithTimeout = require('./utils/run-with-timeout');

const configFile = fs.readFileSync(process.argv[2], 'utf8');
const config = JSON.parse(configFile);

const globalSuite = new GlobalSuite();
SuitesManager.setCurrentSuite(globalSuite);

async function run() {
  await Promise.all(globalSuite.jobs.map(job => job.promise.catch(e => e)));
  HTMLReporter.report(globalSuite);
  JUnitReporter.report(globalSuite);
  process.exit();
}

async function suite(title, params, configure) {
  new Suite(title, params.requires, params.result, configure, params.timeout);
}

function task(title, params, r) {
  if (typeof title !== 'string') {
    r = params;
    params = title;
    title = '';
  }
  new Task(title, params.requires, params.result, r, params.skipReport, params.globalResult);
}

function beforeEach(r) {
  const currentSuite = SuitesManager.currentSuite();
  currentSuite.beforeEach = r;
}

function afterEach(r) {
  const currentSuite = SuitesManager.currentSuite();
  currentSuite.afterEach = r;
}

function createPool(max) {
  return pool.createPool({
    create: () => Promise.resolve(),
    destroy: () => Promise.resolve(),
  }, { max });
}

function it(title, r, skipReport) {
  const currentSuite = SuitesManager.currentSuite();
  if (!currentSuite.itPool) {
    currentSuite.itPool = true;
    currentSuite.suiteResources.itPool = Promise.resolve(createPool(1));
  }
  new Task(title, 'itPool', null, r, skipReport);
}

function before(r) {
  const currentSuite = SuitesManager.currentSuite();
  if (currentSuite.status !== 'SKIPPED') {
    currentSuite.beforePromise = runWithTimeout(r(), config.timeout);
  }
}

function after(r) {
  const currentSuite = SuitesManager.currentSuite();
  if (currentSuite.status !== 'SKIPPED') {
    currentSuite.after = r;
  }
}

function createGlobalPool(name, max) {
  new Task('Global pool', [], name, () => createPool(max), true);
}

function createGlobalResource(name) {
  new Task('Global resource', [], name, () => Promise.resolve(), true);
}

module.exports = {
  suite,
  task,
  run,
  createPool,
  createGlobalPool,
  createGlobalResource,
  beforeEach,
  afterEach,
  it,
  before,
  after,
};

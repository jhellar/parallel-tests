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
  globalSuite.jobs.forEach(job => job.setup());
  await Promise.all(globalSuite.jobs.map(job => job.promise.catch(e => e)));
  HTMLReporter.report(globalSuite);
  JUnitReporter.report(globalSuite);
  process.exit();
}

async function suite(title, params, configure) {
  const newSuite = new Suite(title, params.requires, params.result, configure, params.timeout);
  const currentSuite = SuitesManager.currentSuite();
  currentSuite.jobs.push(newSuite);
}

function task(title, params, r) {
  if (typeof title !== 'string') {
    r = params;
    params = title;
    title = '';
  }
  const newTask = new Task(title, params.requires, params.result, r, params.skipReport, params.globalResult);
  const currentSuite = SuitesManager.currentSuite();
  currentSuite.jobs.push(newTask);
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
  const newTask = new Task(title, 'itPool', null, r, skipReport);
  currentSuite.jobs.push(newTask);
}

function before(r) {
  const currentSuite = SuitesManager.currentSuite();
  if (currentSuite.status !== 'SKIPPED') {
    currentSuite.before = r;
  }
}

function after(r) {
  const currentSuite = SuitesManager.currentSuite();
  if (currentSuite.status !== 'SKIPPED') {
    currentSuite.after = r;
  }
}

function createGlobalPool(name, max) {
  const newTask = new Task('Global pool', [], name, () => createPool(max), true);
  const currentSuite = SuitesManager.currentSuite();
  currentSuite.jobs.push(newTask);
}

function createGlobalResource(name) {
  const newTask = new Task('Global resource', [], name, () => Promise.resolve(), true);
  const currentSuite = SuitesManager.currentSuite();
  currentSuite.jobs.push(newTask);
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

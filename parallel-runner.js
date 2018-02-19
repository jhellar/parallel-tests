#!/usr/bin/env node

const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const parallel = require('./parallel-tests');

const configFile = fs.readFileSync(process.argv[2], 'utf8');
const config = JSON.parse(configFile);

Object.keys(config.pools).forEach((name) => {
  parallel.createGlobalPool(name, config.pools[name]);
});

config.resources.forEach((resource) => {
  parallel.createGlobalResource(resource);
});

// eslint-disable-next-line global-require, import/no-dynamic-require
config.testFiles.forEach(testFile => require(path.resolve(process.cwd(), testFile)));

parallel.run();

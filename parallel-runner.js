#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const parallel = require('./parallel-tests');

const configFile = fs.readFileSync(process.argv[2], 'utf8');
const config = JSON.parse(configFile);

config.testFiles.forEach(testFile => require(path.resolve(process.cwd(), testFile)));

parallel.run();
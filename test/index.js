#!/usr/bin/env node
 
var Mocha = require('mocha');
 
var mocha = new Mocha;
mocha.reporter('spec').ui('tdd');
 
mocha.addFile('test/models/directory.js');
mocha.addFile('test/models/resource.js');
mocha.addFile('test/models/access.js');

var runner = mocha.run(function(){
  process.exit(0);
});
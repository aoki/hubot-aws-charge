#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

var command = process.argv[2];
var EXTERNAL_SCRIPTS_JSON =  path.join(process.cwd(), 'external-scripts.json');
var PACKAGE_JSON = path.join(__dirname, '../package.json');
console.log('external-scripts.json: ' + EXTERNAL_SCRIPTS_JSON);
console.log('package.json: ' + PACKAGE_JSON);

try {
  if (command === 'install')        install()
  else if (command === 'uninstall') uninstall();
  else  list();
} catch (e) {
  if (e.code === 'ENOENT') {
    console.log(EXTERNAL_SCRIPTS_JSON + ' not found. Skip this phase.');
  } else if (e.name === 'SyntaxError') {
    console.error(EXTERNAL_SCRIPTS_JSON + ': Syntax Error!');
  } else {
    throw e;
  }
}

function uniq(n, index, list) {
  return list.indexOf(n) === index;
}

function list(){
  var es = JSON.parse(fs.readFileSync(EXTERNAL_SCRIPTS_JSON)).filter(uniq);
  es.sort().forEach(function(s){console.log(s);});
}

function install(){
  var es = JSON.parse(fs.readFileSync(EXTERNAL_SCRIPTS_JSON)).filter(uniq);
  es.push(JSON.parse(fs.readFileSync(PACKAGE_JSON)).name);
  fs.writeFileSync(EXTERNAL_SCRIPTS_JSON, JSON.stringify(es, null, 2));
  list(es);
}

function uninstall(){
  var es = JSON.parse(fs.readFileSync(EXTERNAL_SCRIPTS_JSON)).filter(uniq);
  var name = JSON.parse(fs.readFileSync(PACKAGE_JSON)).name;
  var es2 = es.filter(function(s){
    return s !== name;
  });
  fs.writeFileSync(EXTERNAL_SCRIPTS_JSON, JSON.stringify(es2, null, 2));
  list();
}

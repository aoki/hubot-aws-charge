var fs = require('fs');
var path = require('path');

var command = process.argv[2];
// var path = process.argv[3];
var FILE_NAME =  path.join(process.cwd(),'external-scripts.json');
console.log(path.join(process.cwd(),'external-scripts.json'));
console.log(FILE_NAME);

try {
  if (command === 'install')        install()
  else if (command === 'uninstall') uninstall();
  else  list();
} catch (e) {
  if (e.code === 'ENOENT') {
    console.log(FILE_NAME + ' not found. Skip this phase.');
  } else if (e.name === 'SyntaxError') {
    console.error(FILE_NAME + ': Syntax Error!');
  } else {
    throw e;
  }
}

function uniq(n, index, list) {
  return list.indexOf(n) === index;
}

function list(){
  var es = JSON.parse(fs.readFileSync(FILE_NAME)).filter(uniq);
  es.sort().forEach(function(s){console.log(s);});
}

function install(es){
  var es = JSON.parse(fs.readFileSync(FILE_NAME)).filter(uniq);
  es.push(JSON.parse(fs.readFileSync('./package.json')).name);
  fs.writeFileSync(FILE_NAME, JSON.stringify(es, null, 2));
  list(es);
}

function uninstall(es){
  var es = JSON.parse(fs.readFileSync(FILE_NAME)).filter(uniq);
  var name = JSON.parse(fs.readFileSync('./package.json')).name;
  var es2 = es.filter(function(s){
    return s !== name;
  });
  fs.writeFileSync(FILE_NAME, JSON.stringify(es2, null, 2));
  list(es2);
}

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports['default'] = processImport;

var _utils = require('./utils');

var babylon = require('babylon');
var traverse = require('babel-traverse');

babylon = babylon['default'] || babylon;
traverse = traverse['default'] || traverse;

function processImport(dep) {
  if ((0, _utils.startsWith)(dep, '{')) {
    var ret = [];
    var visitor = {
      noScope: 1,
      enter: function enter(path) {
        var node = path.node;

        if (node.type === 'ObjectProperty' && node.key && node.key.name) {
          var info = {
            name: node.key.name
          };
          if (node.value && node.value.name && node.value.name !== node.key.name) {
            info.as = node.value.name;
          }
          ret.push(info);
        }
      }
    };
    var ast = babylon.parse('(' + dep + ')');
    traverse(ast, visitor);
    return ret;
  }
  return dep;
}
module.exports = exports['default'];
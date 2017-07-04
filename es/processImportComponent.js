'use strict';

import { startsWith } from './utils';
var babylon = require('babylon');
var traverse = require('babel-traverse');

babylon = babylon['default'] || babylon;
traverse = traverse['default'] || traverse;

export default function processImport(dep) {
  if (startsWith(dep, '{')) {
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
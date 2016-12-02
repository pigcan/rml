'use strict';

const { startsWith } = require('./utils');
const babylon = require('babylon');
const traverse = require('babel-traverse').default;

module.exports = function processImport(dep) {
  if (startsWith(dep, '{')) {
    const ret = [];
    const visitor = {
      noScope: 1,
      enter(path) {
        const { node } = path;
        if (node.type === 'ObjectProperty') {
          const info = {
            name: node.key.name,
          };
          if (node.value.name !== node.key.name) {
            info.as = node.value.name;
          }
          ret.push(info);
        }
      },
    };
    const ast = babylon.parse(`(${dep})`);
    traverse(ast, visitor);
    return ret;
  }
  return dep;
};

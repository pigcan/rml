'use strict';

import { startsWith } from './utils';
let babylon = require('babylon');
let traverse = require('babel-traverse');

babylon = babylon.default || babylon;
traverse = traverse.default || traverse;

export default function processImport(dep) {
  if (startsWith(dep, '{')) {
    const ret = [];
    const visitor = {
      noScope: 1,
      enter(path) {
        const { node } = path;
        if (node.type === 'ObjectProperty' && node.key && node.key.name) {
          const info = {
            name: node.key.name,
          };
          if (node.value && node.value.name && node.value.name !== node.key.name) {
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
}

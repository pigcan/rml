'use strict';

// not allow {{x:{y:1}}}
// or use complex parser
// const util = require('util');
const babylon = require('babylon');
const traverse = require('babel-traverse').default;
const generate = require('babel-generator').default;
const { isNumber } = require('./utils');

const expressionTagReg = /\{\{([^}]+)\}\}/g;
const fullExpressionTagReg = /^\{\{([^}]+)\}\}$/;
const spreadReg = /^\.\.\.[\w$_]/;
const objReg = /^[\w$_](?:[\w$_\d\s]+)?:/;
const es2015ObjReg = /^[\w$_](?:[\w$_\d\s]+)?,/;

function isObject(str_) {
  const str = str_.trim();
  return str.match(spreadReg) || str.match(objReg) || str.match(es2015ObjReg);
}

const babylonConfig = {
  plugins: ['objectRestSpread'],
};

function findScope(scope, name) {
  if (scope) {
    return scope.some(s => s[name]);
  }
  return false;
}

function transformCode(code_, scope, config) {
  const visitor = {
    noScope: 1,
    enter(path) {
      const { node, parent } = path;
      if (node.type !== 'Identifier') {
        return;
      }
      const type = parent && parent.type;
      if (
        (
          type !== 'MemberExpression' ||
          parent.object === node ||
          (
            parent.property === node &&
            parent.computed
          )
        ) &&
        (
          type !== 'ObjectProperty' ||
          parent.key !== node
        ) &&
        (
          !findScope(scope, node.name)
        )
      ) {
        node.name = `state.${node.name}`;
      }
    },
  };

  let codeStr = code_;

  if (config.forceObject || isObject(codeStr)) {
    codeStr = `{${codeStr}}`;
  }

  const ast = babylon.parse(`(${codeStr})`, babylonConfig);
  traverse(ast, visitor);
  let { code } = generate(ast);
  if (code.charAt(code.length - 1) === ';') {
    code = code.slice(0, -1);
  }
  return `(${code})`;
}

function transformExpressionByPart(str_, scope, config) {
  if (typeof str_ !== 'string') {
    return [str_];
  }
  const str = str_.trim();
  if (!str.match(expressionTagReg)) {
    return [isNumber(str) ? str : `'${str_}'`];
  }
  let match = str.match(fullExpressionTagReg);
  if (match) {
    return [transformCode(match[1], scope, config)];
  }
  const totalLength = str.length;
  let lastIndex = 0;
  const gen = [];
  /* eslint no-cond-assign:0 */
  while ((match = expressionTagReg.exec(str))) {
    const code = match[1];
    if (match.index !== lastIndex) {
      gen.push(`'${str.slice(lastIndex, match.index)}'`);
    }
    gen.push(transformCode(code, scope, config));
    lastIndex = expressionTagReg.lastIndex;
  }

  if (lastIndex < totalLength) {
    gen.push(`'${str.slice(lastIndex)}'`);
  }
  return gen;
}

function transformExpression(str_, scope, config = {}) {
  return transformExpressionByPart(str_, scope, config).join(' + ');
}

transformExpression.hasExpression = function hasExpression(str) {
  return str.match(expressionTagReg);
};

transformExpression.transformExpressionByPart = transformExpressionByPart;

module.exports = transformExpression;

'use strict';

// not allow {{x:{y:1}}}
// or use complex parser
// const util = require('util');

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transformExpression = transformExpression;
exports.hasExpression = hasExpression;

var _utils = require('./utils');

var babylon = require('babylon');
var traverse = require('babel-traverse');
var generate = require('babel-generator');

babylon = babylon['default'] || babylon;
traverse = traverse['default'] || traverse;
generate = generate['default'] || generate;

var expressionTagReg = /\{\{([^}]+)\}\}/g;
var fullExpressionTagReg = /^\{\{([^}]+)\}\}$/;
var spreadReg = /^\.\.\.[\w$_]/;
var objReg = /^[\w$_](?:[\w$_\d\s]+)?:/;
var es2015ObjReg = /^[\w$_](?:[\w$_\d\s]+)?,/;

function isObject(str_) {
  var str = str_.trim();
  return str.match(spreadReg) || str.match(objReg) || str.match(es2015ObjReg);
}

var babylonConfig = {
  plugins: ['objectRestSpread']
};

function findScope(scope, name) {
  if (scope) {
    return scope.some(function (s) {
      return s[name];
    });
  }
  return false;
}

function escapeString(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function transformCode(code_, scope, config) {
  var visitor = {
    noScope: 1,
    enter: function enter(path) {
      var node = path.node,
          parent = path.parent;

      if (node.type !== 'Identifier') {
        return;
      }
      var type = parent && parent.type;
      if ((type !== 'MemberExpression' || parent.object === node || parent.property === node && parent.computed) && (type !== 'ObjectProperty' || parent.key !== node) && !findScope(scope, node.name)) {
        node.name = 'data.' + node.name;
      }
    }
  };

  var codeStr = code_;

  if (config.forceObject || isObject(codeStr)) {
    codeStr = '{' + codeStr + '}';
  }

  var ast = babylon.parse('(' + codeStr + ')', babylonConfig);
  traverse(ast, visitor);

  var _generate = generate(ast),
      code = _generate.code;

  if (code.charAt(code.length - 1) === ';') {
    code = code.slice(0, -1);
  }
  return '(' + code + ')';
}

function transformExpressionByPart(str_, scope, config) {
  if (typeof str_ !== 'string') {
    return [str_];
  }
  var str = str_.trim();
  if (!str.match(expressionTagReg)) {
    return [(0, _utils.isNumber)(str) ? str : '\'' + escapeString(str_) + '\''];
  }
  var match = str.match(fullExpressionTagReg);
  if (match) {
    return [transformCode(match[1], scope, config)];
  }
  var totalLength = str.length;
  var lastIndex = 0;
  var gen = [];
  /* eslint no-cond-assign:0 */
  while (match = expressionTagReg.exec(str)) {
    var code = match[1];
    if (match.index !== lastIndex) {
      gen.push('\'' + escapeString(str.slice(lastIndex, match.index)) + '\'');
    }
    gen.push(transformCode(code, scope, config));
    lastIndex = expressionTagReg.lastIndex;
  }

  if (lastIndex < totalLength) {
    gen.push('\'' + escapeString(str.slice(lastIndex)) + '\'');
  }
  return gen;
}

function transformExpression(str_, scope) {
  var config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  return transformExpressionByPart(str_, scope, config).join(' + ');
}

function hasExpression(str) {
  return str.match(expressionTagReg);
};
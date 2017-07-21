'use strict';

// not allow {{x:{y:1}}}
// or use complex parser
// const util = require('util');
let babylon = require('babylon');
let traverse = require('babel-traverse');
let generate = require('babel-generator');
let t = require('babel-types');

t = t.default || t;
babylon = babylon.default || babylon;
traverse = traverse.default || traverse;
generate = generate.default || generate;

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

function escapeString(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function transformCode(code_, scope, config) {
  const visitor = {
    noScope: 1,
    enter(path) {
      const { node, parent } = path;
      if (parent && parent.callee === node) {
        return;
      }
      if (node.type === 'Identifier') {
        const type = parent && parent.type;
        if (
          (
            type !== 'MemberExpression' ||
            parent.object === node ||
            (
              parent.property === node &&
              parent.computed
            )
          )
          &&
          (
            type !== 'ObjectProperty' ||
            parent.key !== node
          )
          &&
          (
            !findScope(scope, node.name)
          )
        ) {
          node.name = `data.${node.name}`;
        }
      }

      if (config.strictDataMember === false) {
        // allow {{x.y.z}} even x is undefined
        if (node.type !== 'MemberExpression') {
          return;
        }

        const members = [node];
        let root = node.object;

        while (root.type === 'MemberExpression') {
          members.push(root);
          root = root.object;
        }

        members.reverse();
        const args = [root];

        if (root.type === 'ThisExpression') {
          args.pop();
          args.push(members.shift());
        }

        if (!members.length) {
          return;
        }

        members.forEach((m) => {
          if (m.computed) {
            args.push(m.property);
          } else {
            args.push(t.stringLiteral(m.property.name));
          }
        });

        const newNode = t.callExpression(t.identifier('$getLooseDataMember'), args);

        path.replaceWith(newNode);
      }
    },
  };


  let codeStr = code_;

  if (config.forceObject || isObject(codeStr)) {
    codeStr = `{${codeStr}}`;
  }

  const ast = babylon.parse(`(${codeStr})`, babylonConfig);
  // if (ast.type === 'Identifier') {
  //   ast.name = `data.${ast.name}`;
  // } else {
  traverse(ast, visitor);
  // }
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
    return [`'${escapeString(str_)}'`];
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
      gen.push(`'${escapeString(str.slice(lastIndex, match.index))}'`);
    }
    gen.push(transformCode(code, scope, config));
    lastIndex = expressionTagReg.lastIndex;
  }

  if (lastIndex < totalLength) {
    gen.push(`'${escapeString(str.slice(lastIndex))}'`);
  }
  return gen;
}

export function transformExpression(str_, scope, config = {}) {
  return transformExpressionByPart(str_, scope, config).join(' + ');
}

export function hasExpression(str) {
  return str.match(expressionTagReg);
}

'use strict';

const path = require('path');

const numberReSnippet = '(?:NaN|-?(?:(?:\\d+|\\d*\\.\\d+)(?:[E|e][+|-]?\\d+)?|Infinity))';
const matchOnlyNumberRe = new RegExp(`^(${numberReSnippet})$`);

function isNumber(str) {
  return !!str.trim().match(matchOnlyNumberRe);
}

function padding(level, str) {
  return new Array(level + 1).join(' ') + str;
}

function startsWith(str, prefix) {
  return str.slice(0, prefix.length) === prefix;
}

function relative(from_, to) {
  const my = path.relative(path.dirname(from_), to);
  if (!startsWith(my, './') && !startsWith(my, '../')) {
    return `./${my}`;
  }
  return my;
}

function camelCase(name) {
  return name.replace(/-(\w)/g, (w, g) => g.toUpperCase());
}

function transformAbsoluteToRelative(projectRoot, filepath, absolutePath) {
  let retPath = absolutePath;
  const firstChar = retPath.charAt(0);
  if (firstChar === '.') {
    return retPath;
  }
  if (firstChar === '/') {
    const srcDir = path.dirname(filepath.slice(projectRoot.length));
    retPath = path.relative(srcDir, retPath);
  }
  if (!startsWith(retPath, './') && !startsWith(retPath, '../')) {
    return `./${retPath}`;
  }
  return retPath;
}

module.exports = {
  camelCase,
  startsWith,
  transformAbsoluteToRelative,
  relative,
  padding,
  isNumber,
};

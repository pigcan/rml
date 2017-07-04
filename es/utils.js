'use strict';

import path from 'path';

var numberReSnippet = '(?:NaN|-?(?:(?:\\d+|\\d*\\.\\d+)(?:[E|e][+|-]?\\d+)?|Infinity))';
var matchOnlyNumberRe = new RegExp('^(' + numberReSnippet + ')$');

export function isNumber(str) {
  return !!str.trim().match(matchOnlyNumberRe);
}

export function padding(level, str) {
  return new Array(level + 1).join(' ') + str;
}

export function startsWith(str, prefix) {
  return str.slice(0, prefix.length) === prefix;
}

export function relative(from_, to) {
  var my = path.relative(path.dirname(from_), to);
  if (!startsWith(my, './') && !startsWith(my, '../')) {
    return './' + my;
  }
  return my;
}

export function camelCase(name) {
  return name.replace(/-(\w)/g, function (w, g) {
    return g.toUpperCase();
  });
}

export function transformAbsoluteToRelative(projectRoot, filepath, absolutePath, allowImportModule) {
  var retPath = absolutePath;
  var firstChar = retPath.charAt(0);
  if (firstChar === '/') {
    var srcDir = path.dirname(filepath.slice(projectRoot.length));
    retPath = path.relative(srcDir, retPath);
  }
  if (allowImportModule) {
    return retPath;
  }
  if (!startsWith(retPath, './') && !startsWith(retPath, '../')) {
    return './' + retPath;
  }
  return retPath;
}
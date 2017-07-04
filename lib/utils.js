'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isNumber = isNumber;
exports.padding = padding;
exports.startsWith = startsWith;
exports.relative = relative;
exports.camelCase = camelCase;
exports.transformAbsoluteToRelative = transformAbsoluteToRelative;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var numberReSnippet = '(?:NaN|-?(?:(?:\\d+|\\d*\\.\\d+)(?:[E|e][+|-]?\\d+)?|Infinity))';
var matchOnlyNumberRe = new RegExp('^(' + numberReSnippet + ')$');

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
  var my = _path2['default'].relative(_path2['default'].dirname(from_), to);
  if (!startsWith(my, './') && !startsWith(my, '../')) {
    return './' + my;
  }
  return my;
}

function camelCase(name) {
  return name.replace(/-(\w)/g, function (w, g) {
    return g.toUpperCase();
  });
}

function transformAbsoluteToRelative(projectRoot, filepath, absolutePath, allowImportModule) {
  var retPath = absolutePath;
  var firstChar = retPath.charAt(0);
  if (firstChar === '/') {
    var srcDir = _path2['default'].dirname(filepath.slice(projectRoot.length));
    retPath = _path2['default'].relative(srcDir, retPath);
  }
  if (allowImportModule) {
    return retPath;
  }
  if (!startsWith(retPath, './') && !startsWith(retPath, '../')) {
    return './' + retPath;
  }
  return retPath;
}
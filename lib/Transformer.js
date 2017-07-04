'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _htmlparser = require('htmlparser2');

var _htmlparser2 = _interopRequireDefault(_htmlparser);

var _domhandler = require('domhandler');

var _domhandler2 = _interopRequireDefault(_domhandler);

var _expression = require('./expression');

var _utils = require('./utils');

var _processImportComponent = require('./processImportComponent');

var _processImportComponent2 = _interopRequireDefault(_processImportComponent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var IMPORT = 'import';
var cwd = process.cwd();
var TOP_LEVEL = 4;
var HEADER = 'export default function render(data) {';

function defaultImportComponent() {
  return false;
}

function notJsx(c) {
  if (c.type === 'script') {
    return true;
  }
  var tag = c.type === 'tag' && c.name;
  return tag === 'import-module' || tag === 'import';
}

function isTopLevel(level) {
  return level === 4;
}

function isRenderChildrenArray() {
  var _this = this;

  var children = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var considerFor = arguments[1];

  var totalCount = children.reduce(function (count, c) {
    if (c.type === 'script' || c.type === 'text' && !c.data.trim()) {
      return count;
    }
    var tag = c.type === 'tag' && c.name;
    if (tag) {
      var attrs = c.attribs || {};
      // for is array....
      if (considerFor && attrs[_this.FOR_ATTR_NAME]) {
        return count + 2;
      }
      // elseif else not count
      if (attrs[_this.ELIF_ATTR_NAME] || attrs[_this.ELSE_ATTR_NAME]) {
        return count;
      }
      if (tag === 'import-module' || tag === 'template' && !attrs.is || tag === 'import') {
        return count;
      }
    }
    return count + 1;
  }, 0);
  return totalCount > 1;
}

function MLTransformer(template, config_) {
  var config = config_ || {};
  this.config = config;
  var _config$templateNames = config.templateNamespace,
      templateNamespace = _config$templateNames === undefined ? 'r' : _config$templateNames;

  this.IF_ATTR_NAME = templateNamespace + ':if';
  this.ELIF_ATTR_NAME = templateNamespace + ':elif';
  this.ELSE_ATTR_NAME = templateNamespace + ':else';
  this.FOR_ATTR_NAME = templateNamespace + ':for';
  this.FOR_INDEX_ATTR_NAME = templateNamespace + ':for-index';
  this.FOR_ITEM_ATTR_NAME = templateNamespace + ':for-item';
  this.FOR_KEY_ATTR_NAME = templateNamespace + ':key';
  this.IF_ATTRS = [this.IF_ATTR_NAME, this.ELIF_ATTR_NAME, this.ELSE_ATTR_NAME];
  this.SPECIAL_ATTRS = this.IF_ATTRS.concat([this.FOR_KEY_ATTR_NAME, this.FOR_ATTR_NAME, this.FOR_INDEX_ATTR_NAME, this.FOR_ITEM_ATTR_NAME]);
  this.componentDeps = {};
  this.importTplDeps = {};
  this.includeTplDeps = {};
  this.template = template;
  this.header = ['import React from \'react\';'];
  this.subTemplatesCode = {};
  this.code = [];
  this.state = [];
  // caused by import-module
  this.rootScope = {};
  this.scope = [this.rootScope];
  this.importIncludeIndex = 1;
  this.codeDepth = [0];
}

(0, _objectAssign2['default'])(MLTransformer.prototype, {
  isStartOfCodeSection: function isStartOfCodeSection(level, preCalculate, justCheck) {
    if (justCheck) {
      return this.codeDepth[this.codeDepth.length - 1] + 1 === 1 && !isTopLevel(level);
    }
    if (preCalculate) {
      return ++this.codeDepth[this.codeDepth.length - 1] === 1 && !isTopLevel(level);
    }
    return !isTopLevel(level) && ++this.codeDepth[this.codeDepth.length - 1] === 1;
  },
  isEndOfCodeSection: function isEndOfCodeSection(level, preCalculate, justCheck) {
    if (justCheck) {
      return this.codeDepth[this.codeDepth.length - 1] - 1 === 0 && !isTopLevel(level);
    }
    if (preCalculate) {
      return --this.codeDepth[this.codeDepth.length - 1] === 0 && !isTopLevel(level);
    }
    return !isTopLevel(level) && --this.codeDepth[this.codeDepth.length - 1] === 0;
  },
  pushCodeSection: function pushCodeSection() {
    this.codeDepth.push(0);
  },
  popCodeSection: function popCodeSection() {
    this.codeDepth.pop();
  },
  pushState: function pushState() {
    this.state.push({
      code: this.code,
      scope: this.scope
    });
    this.code = [];
    this.scope = [this.rootScope];
  },
  popState: function popState() {
    var state = {
      code: this.code,
      scope: this.scope
    };
    var pop = this.state.pop();
    this.code = pop.code;
    this.scope = pop.scope;
    return state;
  },
  transform: function transform(done) {
    var _this2 = this;

    var code = this.code,
        importTplDeps = this.importTplDeps,
        componentDeps = this.componentDeps,
        subTemplatesCode = this.subTemplatesCode,
        includeTplDeps = this.includeTplDeps;
    var header = this.header;
    var _config = this.config,
        _config$importCompone = _config.importComponent,
        importComponent = _config$importCompone === undefined ? defaultImportComponent : _config$importCompone,
        pure = _config.pure;


    var handler = new _domhandler2['default'](function (error, children) {
      if (error) {
        // console.error(error);
        return done(error);
      }

      try {
        _this2.generateCodeForTags(children, TOP_LEVEL);
      } catch (e) {
        // console.error(e);
        return done(e);
      }

      if (!code.length) {
        code.push('null');
      }

      if (Object.keys(importTplDeps).length) {
        header.push('import assign from \'object-assign\';');
      }
      try {
        Object.keys(componentDeps).forEach(function (dep) {
          var importStatement = importComponent(dep);
          if (importStatement !== false) {
            header.push(importStatement);
          }
        });
      } catch (e) {
        // console.error(e);
        return done(e);
      }
      var subTemplatesName = [];
      Object.keys(importTplDeps).forEach(function (dep) {
        var index = importTplDeps[dep];
        header.push(IMPORT + ' { $ownTemplates$ as $ownTemplates$' + index + ' } ' + ('from \'' + dep + '\';'));
        subTemplatesName.push('$ownTemplates$' + index);
      });
      Object.keys(includeTplDeps).forEach(function (dep) {
        var index = includeTplDeps[dep];
        header.push(IMPORT + ' $render$' + index + ' from \'' + dep + '\';');
      });
      header.push(''); // empty line
      var needTemplate = Object.keys(subTemplatesCode).length || Object.keys(importTplDeps).length;
      if (needTemplate) {
        header.push('let $templates$ = {};');
        header.push('export const $ownTemplates$ = {};');
      }
      Object.keys(subTemplatesCode).forEach(function (name) {
        if (subTemplatesCode[name].length) {
          header.push('$ownTemplates$[\'' + name + '\'] = function (data) {');
          _this2.pushHeaderCode(2, 'return (');
          header = _this2.header = header.concat(subTemplatesCode[name]);
          _this2.pushHeaderCode(2, ');');
          header.push('};');
          if (pure) {
            var className = name.replace(/-/, '$_$');
            header.push('\nclass $ReactClass_' + className + ' extends React.PureComponent {\n  render() {\n    return $ownTemplates$[\'' + name + '\'].call(this.props.children, this.props);\n  }\n}\n');
            header.push('$ownTemplates$[\'' + name + '\'].Component = $ReactClass_' + className + ';');
          }
        }
      });
      if (Object.keys(importTplDeps).length) {
        header.push('$templates$ = assign($templates$, ' + (subTemplatesName.join(' ,') + ', $ownTemplates$);'));
      } else if (needTemplate) {
        header.push('$templates$ = $ownTemplates$;');
      }
      header.push(HEADER);
      _this2.pushHeaderCode(2, 'return (');
      _this2.pushCode(2, ');');
      code.push('};');
      _this2.code = header.concat(code);
      done(null, _this2.code.join('\n'));
    }, {
      normalizeWhitespace: true,
      withStartIndices: true,
      withEndIndices: true
    });
    var parser = new _htmlparser2['default'].Parser(handler, {
      xmlMode: true
    });
    parser.write(this.template);
    parser.done();
  },
  pushCode: function pushCode(level, str) {
    this.code.push((0, _utils.padding)(level, str));
  },
  pushHeaderCode: function pushHeaderCode(level, str) {
    this.header.push((0, _utils.padding)(level, str));
  },
  throwParseError: function throwParseError(config) {
    var node = config.node,
        text = config.text,
        attrName = config.attrName,
        reason = config.reason;

    var endIndex = node.endIndex;
    var startIndex = node.startIndex;
    if (node.children && node.children[0]) {
      endIndex = node.children[0].startIndex;
    }
    var error = void 0;
    if (attrName) {
      error = 'parse tag\'s attribute `' + attrName + '` error: ' + this.template.slice(startIndex, endIndex);
    } else if (text) {
      error = 'parse text error: ' + text;
    } else {
      error = 'parse error: ' + reason + ' : ' + this.template.slice(startIndex, endIndex);
    }
    var oe = new Error(error);
    (0, _objectAssign2['default'])(oe, config, {
      startIndex: startIndex,
      endIndex: endIndex
    });
    throw oe;
  },
  processExpression: function processExpression(exp, config) {
    try {
      return (0, _expression.transformExpression)(exp, this.scope, config);
    } catch (e) {
      console.error(e);
      this.throwParseError(config);
    }
  },
  generateCodeForTags: function generateCodeForTags(children_, level, arrayForm_) {
    var _this3 = this;

    var arrayForm = arrayForm_ === undefined ? isRenderChildrenArray.call(this, children_) : arrayForm_;
    var children = children_;
    if (children && children.length) {
      var i = 0;
      children = children.filter(function (c) {
        return !(c.type === 'text' && !c.data.trim());
      });
      var l = children.length;
      if (!l) {
        return;
      }
      var transformIf = function transformIf(c, attrName) {
        var attrs = c.attribs;
        if (attrs && attrName in attrs) {
          var ifValue = attrs[attrName];
          if (attrName === _this3.IF_ATTR_NAME && _this3.isStartOfCodeSection(level)) {
            _this3.pushCode(level, '{');
          }
          var ifExp = void 0;
          if (ifValue) {
            ifExp = _this3.processExpression(ifValue, {
              node: c,
              attrName: attrName
            });
          }
          _this3.pushCode(level, '(');
          if (ifExp) {
            _this3.pushCode(level, '(' + ifExp + ') ?');
          }
          _this3.pushCode(level, '(');
          _this3.generateCodeForTag(c, level);
          _this3.pushCode(level, ')');
          var nextChild = children[i + 1];
          var transformed = void 0;
          if (ifExp) {
            _this3.pushCode(level, ':');
          }
          if (nextChild) {
            var childAttrs = nextChild.attribs || {};
            [_this3.ELIF_ATTR_NAME, _this3.ELSE_ATTR_NAME].forEach(function (condition) {
              if (condition in childAttrs) {
                i += 1;
                transformIf(nextChild, condition);
                transformed = true;
              }
            });
          }
          if (!transformed && ifExp) {
            _this3.pushCode(level, 'null');
          }
          _this3.pushCode(level, ')');
          if (attrName === _this3.IF_ATTR_NAME && _this3.isEndOfCodeSection(level)) {
            _this3.pushCode(level, '}');
          }
          return true;
        }
        return false;
      };

      if (arrayForm) {
        if (this.isStartOfCodeSection(level, true)) {
          this.pushCode(level, '{');
        }
        this.pushCode(level, '[');
      }

      for (; i < l; i += 1) {
        var child = children[i];
        var currentCodeLength = this.code.length;
        if (!transformIf(child, this.IF_ATTR_NAME)) {
          this.generateCodeForTag(child, level);
        }
        if (arrayForm && !notJsx(child)) {
          if (this.code.length === currentCodeLength) {
            this.pushCode(level, 'null,');
          } else {
            this.pushCode(level, ',');
          }
        }
      }

      if (arrayForm) {
        this.pushCode(level, ']');
        if (this.isEndOfCodeSection(level, true)) {
          this.pushCode(level, '}');
        }
      }
    }
  },
  generateCodeForTag: function generateCodeForTag(node, level_) {
    var _this4 = this;

    var importTplDeps = this.importTplDeps,
        subTemplatesCode = this.subTemplatesCode,
        componentDeps = this.componentDeps,
        includeTplDeps = this.includeTplDeps;
    var _config2 = this.config,
        renderPath = _config2.renderPath,
        attributeProcessor = _config2.attributeProcessor,
        tagProcessor = _config2.tagProcessor,
        allowScript = _config2.allowScript,
        _config2$projectRoot = _config2.projectRoot,
        projectRoot = _config2$projectRoot === undefined ? cwd : _config2$projectRoot,
        allowImportModule = _config2.allowImportModule,
        pure = _config2.pure;


    var level = level_ || 0;
    if (node.type === 'text') {
      var text = node.data.trim();
      if (text) {
        var codeText = '' + (this.isStartOfCodeSection(level) ? '{' : '') + this.processExpression(text, {
          node: node,
          text: text
        }) + (this.isEndOfCodeSection(level) ? '}' : '');
        this.pushCode(level, codeText);
      }
      return;
    }

    if (node.type === 'script' && allowScript) {
      var children = node.children;

      children = children && children[0];
      var script = children && children.data;
      if (script) {
        this.header.push(script.trim());
      }
    }

    var tag = node.type === 'tag' && node.name;
    if (!tag) {
      return;
    }

    var attrs = node.attribs || {};

    if (tag === 'import-module') {
      if (allowImportModule) {
        var deps = void 0;
        try {
          deps = attrs.name && (0, _processImportComponent2['default'])(attrs.name);
        } catch (e) {
          console.error(e);
          this.throwParseError({
            node: node,
            attrName: 'name'
          });
        }
        var depCode = '';
        if (Array.isArray(deps)) {
          depCode = deps.map(function (d) {
            var variableName = d.as ? d.as : d.name;
            _this4.rootScope[variableName] = 1;
            return '' + d.name + (d.as ? ' as ' + d.as : '');
          }).join(', ');
          depCode = '{ ' + depCode + ' }';
        } else {
          depCode = deps;
          this.rootScope[deps] = 1;
        }
        if (depCode) {
          this.header.push('import ' + depCode + ' ' + 'from' + ' \'' + attrs.from + '\';');
        }
      }
      return;
    }

    if (tag === 'template') {
      if (attrs.is) {
        var data = attrs.data ? this.processExpression(attrs.data, {
          forceObject: true,
          node: node,
          attrName: 'data'
        }) || 'undefined' : 'undefined';
        var is = this.processExpression(attrs.is, {
          node: node,
          attrName: 'is'
        });
        this.pushCode(level, '' + (this.isStartOfCodeSection(level) ? '{ ' : '') + (pure ?
        // parent passed as children...
        'React.createElement($templates$[' + is + '].Component, ' + data + ', this)' : '$templates$[' + is + '].call(this, ' + data + ')') + (this.isEndOfCodeSection(level) ? ' }' : ''));
      } else {
        this.pushState();
        var name = attrs.name;

        if (pure && isRenderChildrenArray.call(this, node.children, true)) {
          this.throwParseError({ node: node, reason: 'template can only has one render child!' });
        }
        this.generateCodeForTags(node.children, TOP_LEVEL);
        subTemplatesCode[name] = this.popState().code;
      }
      return;
    }

    if (tag === 'import') {
      var importPath = (0, _utils.transformAbsoluteToRelative)(projectRoot, renderPath, attrs.src, allowImportModule);
      importTplDeps[importPath] = importTplDeps[importPath] || this.importIncludeIndex++;
      return;
    }

    if (tag === 'include') {
      var includePath = (0, _utils.transformAbsoluteToRelative)(projectRoot, renderPath, attrs.src, allowImportModule);
      includeTplDeps[includePath] = includeTplDeps[includePath] || this.importIncludeIndex++;
      this.pushCode(level, (this.isStartOfCodeSection(level) ? '{ ' : '') + '$render$' + includeTplDeps[includePath] + '.apply(this, arguments)' + (this.isEndOfCodeSection(level) ? ' }' : ''));
      return;
    }

    var inFor = false;
    var forKey = void 0;
    if (this.FOR_ATTR_NAME in attrs) {
      var _scope$push;

      inFor = true;
      if (this.isStartOfCodeSection(level, true)) {
        this.pushCode(level, '{');
      }
      var forExp = this.processExpression(attrs[this.FOR_ATTR_NAME], {
        node: node,
        attrName: this.FOR_ATTR_NAME
      });
      var indexName = attrs[this.FOR_INDEX_ATTR_NAME] || 'index';
      var itemName = attrs[this.FOR_ITEM_ATTR_NAME] || 'item';
      var keyName = attrs[this.FOR_KEY_ATTR_NAME];
      if (keyName) {
        forKey = keyName === '*this' ? itemName : itemName + '.' + keyName;
      }
      this.scope.push((_scope$push = {}, (0, _defineProperty3['default'])(_scope$push, indexName, 1), (0, _defineProperty3['default'])(_scope$push, itemName, 1), _scope$push));
      this.pushCode(level, '(' + forExp + ' || []).map((' + itemName + ', ' + indexName + ') => {');
      level += 2;
      this.pushCode(level, 'return (');
      level += 2;
    }

    if (tag !== 'block') {
      var transformedAttrs = {};
      if (forKey) {
        transformedAttrs.key = '{' + forKey + '}';
      }
      Object.keys(attrs).forEach(function (attrName_) {
        var attrName = attrName_;
        if (_this4.SPECIAL_ATTRS.indexOf(attrName) !== -1) {
          return;
        }
        var attrValue = attrs[attrName];
        var transformedAttrValue = attrValue;
        if (attrValue === null) {
          return;
        }
        var info = {
          attrValue: attrValue,
          attrName: attrName,
          attrKey: attrName,
          node: node,
          attrs: attrs,
          transformedAttrs: transformedAttrs,
          transformer: _this4
        };
        if (attributeProcessor && attributeProcessor(info) === false) {
          return;
        }
        if (attrValue) {
          transformedAttrValue = '{' + _this4.processExpression(attrValue, {
            node: node,
            attrName: attrName
          }) + '}';
        } else {
          transformedAttrValue = null;
        }
        if (attrName === 'class') {
          attrName = 'className';
        }
        if ((attrName === 'className' || attrName === 'style') && !transformedAttrValue) {
          return;
        }
        if (transformedAttrValue !== undefined) {
          transformedAttrs[attrName] = transformedAttrValue;
        }
      });
      var originalTag = tag;
      if (tagProcessor) {
        var tagProcessRet = tagProcessor({
          attrs: attrs,
          transformedAttrs: transformedAttrs,
          node: node,
          tag: tag
        });
        if (tagProcessRet === false) {
          return;
        }
        if (tagProcessRet) {
          tag = tagProcessRet.tag || tag;
          transformedAttrs = tagProcessRet.transformedAttrs || transformedAttrs;
        }
      }
      componentDeps[originalTag] = 1;
      var nextLevel = level + 2;
      if (Object.keys(transformedAttrs).length) {
        this.pushCode(level, '<' + tag);
        Object.keys(transformedAttrs).forEach(function (k) {
          _this4.pushCode(nextLevel, '' + ((0, _utils.startsWith)(k, 'data-') || (0, _utils.startsWith)(k, 'aria-') ? k : (0, _utils.camelCase)(k)) + (transformedAttrs[k] ? ' = ' + transformedAttrs[k] : ''));
        });
        this.pushCode(level, '>');
      } else {
        this.pushCode(level, '<' + tag + '>');
      }

      if (node.children) {
        // new code section start
        // <view>{}</view>
        this.pushCodeSection();
        this.generateCodeForTags(node.children, nextLevel, false);
        this.popCodeSection();
      }

      this.pushCode(level, '</' + tag + '>');
    } else if (node.children) {
      // block will not emit any tag, so reuse current code section
      var currentCodeLength = this.code.length;
      this.generateCodeForTags(node.children, level);
      if (inFor && this.code.length === currentCodeLength) {
        this.pushCode(level, 'null');
      }
    }

    if (inFor) {
      level -= 2;
      this.pushCode(level, ');');
      if (this.scope.length > 1) {
        this.scope.pop();
      }
      level -= 2;
      this.pushCode(level, '})');
      if (this.isEndOfCodeSection(level, true)) {
        this.pushCode(level, '}');
      }
    }
  }
});

exports['default'] = MLTransformer;
module.exports = exports['default'];
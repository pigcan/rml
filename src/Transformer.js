'use strict';

const assign = require('object-assign');
const htmlparser = require('htmlparser2');
const DomHandler = require('domhandler');
const { transformExpression, hasExpression } = require('./expression');
const utils = require('./utils');
const processImportComponent = require('./processImportComponent');

const IMPORT = 'import';
const {
  camelCase,
  padding, startsWith,
  isNumber, transformAbsoluteToRelative,
} = utils;
const cwd = process.cwd();
const TOP_LEVEL = 4;

const HEADER = `export default function render(data) {`;

function defaultImportComponent() {
  return false;
}

function isTopLevel(level) {
  return level === 4;
}

function countValidChildren(children = []) {
  return children.reduce((count, c) => {
    if (c.type === 'script' || c.type === 'text' && !c.data.trim()) {
      return count;
    }
    const tag = c.type === 'tag' && c.name;
    if (tag) {
      const attrs = c.attribs || {};
      if (tag === 'import-module' || tag === 'template' && !attrs.is || tag === 'import') {
        return count;
      }
    }
    return count + 1;
  }, 0);
}

function MLTransformer(template, config_) {
  const config = config_ || {};
  this.config = config;
  const { templateNamespace = 'r' } = config;
  this.IF_ATTR_NAME = `${templateNamespace}:if`;
  this.ELIF_ATTR_NAME = `${templateNamespace}:elif`;
  this.ELSE_ATTR_NAME = `${templateNamespace}:else`;
  this.FOR_ATTR_NAME = `${templateNamespace}:for`;
  this.FOR_INDEX_ATTR_NAME = `${templateNamespace}:for-index`;
  this.FOR_ITEM_ATTR_NAME = `${templateNamespace}:for-item`;
  this.FOR_KEY_ATTR_NAME = `${templateNamespace}:key`;
  this.IF_ATTRS = [this.IF_ATTR_NAME, this.ELIF_ATTR_NAME, this.ELSE_ATTR_NAME];
  this.SPECIAL_ATTRS = this.IF_ATTRS.concat(
    [
      this.FOR_KEY_ATTR_NAME,
      this.FOR_ATTR_NAME,
      this.FOR_INDEX_ATTR_NAME,
      this.FOR_ITEM_ATTR_NAME,
    ]
  );
  this.componentDeps = {};
  this.importTplDeps = {};
  this.includeTplDeps = {};
  this.template = template;
  this.header = [
    `import React from 'react';`,
  ];
  this.subTemplatesCode = {};
  this.code = [];
  this.state = [];
  // caused by import-module
  this.rootScope = {};
  this.scope = [this.rootScope];
  this.importIncludeIndex = 1;
  this.codeDepth = [0];
}

assign(MLTransformer.prototype, {
  isStartOfCodeSection() {
    return ++this.codeDepth[this.codeDepth.length - 1] === 1;
  },
  isEndOfCodeSection() {
    return --this.codeDepth[this.codeDepth.length - 1] === 0;
  },
  pushCodeSection() {
    this.codeDepth.push(0);
  },
  popCodeSection() {
    this.codeDepth.pop();
  },
  pushState() {
    this.state.push({
      code: this.code,
      scope: this.scope,
    });
    this.code = [];
    this.scope = [this.rootScope];
  },
  popState() {
    const state = {
      code: this.code,
      scope: this.scope,
    };
    const pop = this.state.pop();
    this.code = pop.code;
    this.scope = pop.scope;
    return state;
  },
  transform(done) {
    const {
      code, importTplDeps, componentDeps,
      subTemplatesCode, includeTplDeps,
    } = this;
    let { header } = this;
    const {
      importComponent = defaultImportComponent,
    } = this.config;

    const handler = new DomHandler((error, children) => {
      if (error) {
        done(error);
        return;
      }
      // console.log(util.inspect(children, false, null));
      this.generateCodeForTags(children, TOP_LEVEL);

      if (!code.length) {
        code.push('null');
      }

      if (Object.keys(importTplDeps).length) {
        header.push(`import assign from 'object-assign';`);
      }
      Object.keys(componentDeps).forEach((dep) => {
        const importStatement = importComponent(dep);
        if (importStatement !== false) {
          header.push(importStatement);
        }
      });
      const subTemplatesName = [];
      Object.keys(importTplDeps).forEach((dep) => {
        const index = importTplDeps[dep];
        header.push(`${IMPORT} { $ownTemplates$ as $ownTemplates$${index} } ` +
          `from '${dep}';`);
        subTemplatesName.push(`$ownTemplates$${index}`);
      });
      Object.keys(includeTplDeps).forEach((dep) => {
        const index = includeTplDeps[dep];
        header.push(`${IMPORT} $render$${index} from '${dep}';`);
      });
      header.push(''); // empty line
      const needTemplate = Object.keys(subTemplatesCode).length ||
        Object.keys(importTplDeps).length;
      if (needTemplate) {
        header.push(`let $templates$ = {};`);
        header.push(`export const $ownTemplates$ = {};`);
      }
      Object.keys(subTemplatesCode).forEach((name) => {
        if (subTemplatesCode[name].length) {
          header.push(`$ownTemplates$['${name}'] = function (data) {`);
          this.pushHeaderCode(2, 'return (');
          header = this.header = header.concat(subTemplatesCode[name]);
          this.pushHeaderCode(2, ');');
          header.push('};');
        }
      });
      if (Object.keys(importTplDeps).length) {
        header.push(`$templates$ = assign($templates$, ` +
          `${subTemplatesName.join(' ,')}, $ownTemplates$);`);
      } else if (needTemplate) {
        header.push(`$templates$ = $ownTemplates$;`);
      }
      header.push(HEADER);
      this.pushHeaderCode(2, 'return (');
      this.pushCode(2, ');');
      code.push('};');
      this.code = header.concat(code);
      done(null, this.code.join('\n'));
    }, {
      normalizeWhitespace: true,
    });
    const parser = new htmlparser.Parser(handler, {
      xmlMode: true,
    });
    parser.write(this.template);
    parser.done();
  },

  pushCode(level, str) {
    this.code.push(padding(level, str));
  },

  pushHeaderCode(level, str) {
    this.header.push(padding(level, str));
  },

  generateCodeForTags(children_, level, arrayForm_) {
    const arrayForm = arrayForm_ === undefined ? countValidChildren(children_) > 1 : arrayForm_;
    let children = children_;
    if (children) {
      let i = 0;
      children = children.filter(c => !(c.type === 'text' && !c.data.trim()));
      const l = children.length;

      const transformIf = (c, name) => {
        const attrs = c.attribs;
        if (attrs && name in attrs) {
          const ifValue = attrs[name];
          if (!isTopLevel(level) && name === this.IF_ATTR_NAME && this.isStartOfCodeSection()) {
            this.pushCode(level, '{');
          }
          let ifExp;
          if (ifValue) {
            ifExp = transformExpression(ifValue, this.scope);
          }
          this.pushCode(level, '(');
          if (ifExp) {
            this.pushCode(level, `(${ifExp}) ?`);
          }
          this.pushCode(level, '(');
          this.generateCodeForTag(c, level);
          this.pushCode(level, ')');
          const nextChild = children[i + 1];
          let transformed;
          if (ifExp) {
            this.pushCode(level, ':');
          }
          if (nextChild) {
            const childAttrs = nextChild.attribs || {};
            [this.ELIF_ATTR_NAME, this.ELSE_ATTR_NAME].forEach((condition) => {
              if (condition in childAttrs) {
                i += 1;
                transformIf(nextChild, condition);
                transformed = true;
              }
            });
          }
          if (!transformed && ifExp) {
            this.pushCode(level, 'null');
          }
          this.pushCode(level, ')');
          if (!isTopLevel(level) && name === this.IF_ATTR_NAME && this.isEndOfCodeSection()) {
            this.pushCode(level, '}');
          }
          return true;
        }
        return false;
      };

      if (arrayForm) {
        const isStartOfCodeSection = this.isStartOfCodeSection();
        if (!isTopLevel(level) && isStartOfCodeSection) {
          this.pushCode(level, '{');
        }
        this.pushCode(level, '[');
      }
      for (; i < l; i += 1) {
        const child = children[i];
        if (!transformIf(child, this.IF_ATTR_NAME)) {
          this.generateCodeForTag(child, level);
        }
        if (arrayForm) {
          this.pushCode(level, ',');
        }
      }
      if (arrayForm) {
        this.pushCode(level, ']');
        const isEndOfCodeSection = this.isEndOfCodeSection();
        if (!isTopLevel(level) && isEndOfCodeSection) {
          this.pushCode(level, '}');
        }
      }
    }
  },

  generateCodeForTag(content, level_) {
    const {
      importTplDeps, subTemplatesCode,
      componentDeps, includeTplDeps,
    } = this;

    const {
      renderPath,
      attributeProcessor,
      tagProcessor,
      allowScript,
      projectRoot = cwd,
      allowImportModule,
    } = this.config;

    let level = level_ || 0;
    if (content.type === 'text') {
      let text = content.data.trim();
      if (text) {
        const isStartOfCodeSection = this.isStartOfCodeSection();
        const isEndOfCodeSection = this.isEndOfCodeSection();
        text = `${isTopLevel(level) || !isStartOfCodeSection ?
          '' : '{'}${transformExpression(text, this.scope)}${
          isTopLevel(level) || !isEndOfCodeSection ?
            '' : '}'}`;
        this.pushCode(level, text);
      }
      return;
    }

    if (content.type === 'script' && allowScript) {
      let { children } = content;
      children = children && children[0];
      const script = children && children.data;
      if (script) {
        this.header.push(script.trim());
      }
    }

    let tag = content.type === 'tag' && content.name;
    if (!tag) {
      return;
    }

    const attrs = content.attribs || {};

    if (tag === 'import-module') {
      if (allowImportModule) {
        const deps = attrs.name && processImportComponent(attrs.name);
        let depCode = '';
        if (Array.isArray(deps)) {
          depCode = deps.map(d => {
            const variableName = d.as ? d.as : d.name;
            this.rootScope[variableName] = 1;
            return `${d.name}${d.as ? ` as ${d.as}` : ''}`;
          }).join(', ');
          depCode = `{ ${depCode} }`;
        } else {
          depCode = deps;
          this.rootScope[deps] = 1;
        }
        if (depCode) {
          this.header.push(`import ${depCode} ${'from'} '${attrs.from}';`);
        }
      }
      return;
    }

    if (tag === 'template') {
      if (attrs.is) {
        const data = attrs.data ?
          transformExpression(attrs.data, this.scope, { forceObject: true }) || 'undefined' :
          'undefined';
        const is = transformExpression(attrs.is, this.scope);
        this.pushCode(level,
          `${
            this.isStartOfCodeSection() ? '{' : ''
            } $templates$[${is}].call(this, ${data}) ${
            this.isEndOfCodeSection() ? '}' : ''
            }`);
      } else {
        this.pushState();
        const { name } = attrs;
        this.generateCodeForTags(content.children, TOP_LEVEL);
        subTemplatesCode[name] = this.popState().code;
      }
      return;
    }

    if (tag === 'import') {
      const importPath = transformAbsoluteToRelative(projectRoot, renderPath, attrs.src);
      importTplDeps[importPath] = importTplDeps[importPath] ||
        (this.importIncludeIndex++);
      return;
    }

    if (tag === 'include') {
      const includePath = transformAbsoluteToRelative(projectRoot, renderPath, attrs.src);
      includeTplDeps[includePath] = includeTplDeps[includePath] ||
        (this.importIncludeIndex++);
      this.pushCode(level, `${
        this.isStartOfCodeSection() ? '{' : ''
        } $render$${includeTplDeps[includePath]}.apply(this, arguments) ${
        this.isEndOfCodeSection() ? '}' : ''
        }`);
      return;
    }

    let inFor = false;
    let forKey;
    if (this.FOR_ATTR_NAME in attrs) {
      inFor = true;
      const isStartOfCodeSection = this.isStartOfCodeSection();
      if (isStartOfCodeSection && !isTopLevel(level)) {
        this.pushCode(level, '{');
      }
      const forExp = transformExpression(attrs[this.FOR_ATTR_NAME], this.scope);
      const indexName = attrs[this.FOR_INDEX_ATTR_NAME] || 'index';
      const itemName = attrs[this.FOR_ITEM_ATTR_NAME] || 'item';
      const keyName = attrs[this.FOR_KEY_ATTR_NAME];
      if (keyName) {
        forKey = keyName === '*this' ? itemName : `${itemName}.${keyName}`;
      }
      this.scope.push({
        [indexName]: 1,
        [itemName]: 1,
      });
      this.pushCode(level, `(${forExp} || []).map((${itemName}, ${indexName}) => {`);
      level += 2;
      this.pushCode(level, 'return (');
      level += 2;
    }

    if (tag !== 'block') {
      let transformedAttrs = {};
      if (forKey) {
        transformedAttrs.key = `{${forKey}}`;
      }
      Object.keys(attrs).forEach((attrKey_) => {
        let attrKey = attrKey_;
        if (this.SPECIAL_ATTRS.indexOf(attrKey) !== -1) {
          return;
        }
        const attrValue = attrs[attrKey];
        let transformedAttrValue = attrValue;
        if (attrValue === null) {
          return;
        }
        const info = {
          attrValue,
          attrKey,
          tag,
          attrs,
          transformedAttrs,
          transformer: this,
        };
        if (attributeProcessor && attributeProcessor(info) === false) {
          return;
        }
        if (attrKey === 'class') {
          attrKey = 'className';
        }
        if (hasExpression(attrValue)) {
          transformedAttrValue = `{${transformExpression(attrValue, this.scope)}}`;
        } else if (attrValue) {
          transformedAttrValue = isNumber(attrValue) ? `{${attrValue}}` : `"${attrValue}"`;
        } else {
          transformedAttrValue = null;
        }
        if (transformedAttrValue !== undefined) {
          transformedAttrs[attrKey] = transformedAttrValue;
        }
      });
      const originalTag = tag;
      if (tagProcessor) {
        const tagProcessRet = tagProcessor({
          attrs,
          transformedAttrs,
          tag,
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
      const nextLevel = level + 2;
      if (Object.keys(transformedAttrs).length) {
        this.pushCode(level, `<${tag}`);
        Object.keys(transformedAttrs).forEach((k) => {
          this.pushCode(nextLevel, `${startsWith(k, 'data-') ?
            k :
            camelCase(k)}${transformedAttrs[k] ? ` = ${transformedAttrs[k]}` : ''}`);
        });
        this.pushCode(level, `>`);
      } else {
        this.pushCode(level, `<${tag}>`);
      }

      if (content.children) {
        // new code section start
        // <view>{}</view>
        this.pushCodeSection();
        this.generateCodeForTags(content.children, nextLevel, false);
        this.popCodeSection();
      }

      this.pushCode(level, `</${tag}>`);
    } else if (content.children) {
      // block will not emit any tag, so reuse current code section
      this.generateCodeForTags(content.children, level);
    }

    if (inFor) {
      level -= 2;
      this.pushCode(level, ');');
      if (this.scope.length > 1) {
        this.scope.pop();
      }
      level -= 2;
      this.pushCode(level, '})');
      const isEndOfCodeSection = this.isEndOfCodeSection();
      if (isEndOfCodeSection && !isTopLevel(level)) {
        this.pushCode(level, '}');
      }
    }
  },
})
;


module.exports = MLTransformer;

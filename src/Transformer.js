/* eslint no-console:0 */

'use strict';

import assign from 'object-assign';
import htmlparser from 'htmlparser2';
import DomHandler from 'domhandler';
import { transformExpression } from './expression';
import {
  camelCase,
  padding, startsWith,
  transformAbsoluteToRelative,
} from './utils';
import processImportComponent from './processImportComponent';

const IMPORT = 'import';
const cwd = process.cwd();
const TOP_LEVEL = 4;
const HEADER = `export default function render(data) {`;

function defaultImportComponent() {
  return false;
}

function notJsx(c) {
  if (c.type === 'script') {
    return true;
  }
  const tag = c.type === 'tag' && c.name;
  return tag === 'import-module' || tag === 'import';
}

function isTopLevel(level) {
  return level === 4;
}

function isRenderChildrenArray(children = [], considerFor) {
  const totalCount = children.reduce((count, c) => {
    if (c.type === 'script' || c.type === 'text' && !c.data.trim() || c.type === 'comment') {
      return count;
    }
    const tag = c.type === 'tag' && c.name;
    if (tag) {
      const attrs = c.attribs || {};
      // for is array....
      if (considerFor && attrs[this.FOR_ATTR_NAME]) {
        return count + 2;
      }
      // elseif else not count
      if (attrs[this.ELIF_ATTR_NAME] || this.ELSE_ATTR_NAME in attrs) {
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
  isStartOfCodeSection(level, preCalculate, justCheck) {
    if (justCheck) {
      return (this.codeDepth[this.codeDepth.length - 1] + 1) === 1 && !isTopLevel(level);
    }
    if (preCalculate) {
      return ++this.codeDepth[this.codeDepth.length - 1] === 1 && !isTopLevel(level);
    }
    return !isTopLevel(level) && ++this.codeDepth[this.codeDepth.length - 1] === 1;
  },
  isEndOfCodeSection(level, preCalculate, justCheck) {
    if (justCheck) {
      return (this.codeDepth[this.codeDepth.length - 1] - 1) === 0 && !isTopLevel(level);
    }
    if (preCalculate) {
      return --this.codeDepth[this.codeDepth.length - 1] === 0 && !isTopLevel(level);
    }
    return !isTopLevel(level) && --this.codeDepth[this.codeDepth.length - 1] === 0;
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
      pure,
    } = this.config;

    const handler = new DomHandler((error, children) => {
      if (error) {
        if (this.config.consoleError) {
          console.error(error);
        }
        return done(error);
      }

      try {
        this.generateCodeForTags(children, TOP_LEVEL);
      } catch (e) {
        if (this.config.consoleError) {
          console.error(e);
        }
        return done(e);
      }

      if (!code.length) {
        code.push('null');
      }
      try {
        Object.keys(componentDeps).forEach((dep) => {
          const importStatement = importComponent(dep);
          if (importStatement !== false) {
            header.push(importStatement);
          }
        });
      } catch (e) {
        if (this.config.consoleError) {
          console.error(e);
        }
        return done(e);
      }
      if (this.config.strictDataMember === false) {
        header.push(`
function $getLooseDataMember(target, ...args) {
  let ret = target;
  for(let i=0; i<args.length; i++){
    if(ret == null){
      return ret;
    }
    ret = ret[args[i]];
  }
  return ret;
}
  `);
      }
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
          if (pure) {
            const className = name.replace(/-/, '$_$');
            header.push(`
class $ReactClass_${className} extends React.PureComponent {
  render() {
    const children = $ownTemplates$['${name}'].call(this.props.children, this.props);
    if(React.Children.count(children) > 1) {
      throw new Error('template \`${name}\` can only has one render child!');
    }
    return children;
  }
}
`);
            header.push(`$ownTemplates$['${name}'].Component = $ReactClass_${className};`);
          }
        }
      });
      if (Object.keys(importTplDeps).length) {
        header.push(`$templates$ = Object.assign($templates$, ` +
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
      withStartIndices: true,
      withEndIndices: true,
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

  throwParseError(config, originalError) {
    const { node, text, attrName, reason } = config;
    let endIndex = node.endIndex;
    const startIndex = node.startIndex;
    if (node.children && node.children[0]) {
      endIndex = node.children[0].startIndex;
    }
    let error;
    if (attrName) {
      error = `parse tag's attribute \`${attrName}\` error: \
${this.template.slice(startIndex, endIndex)}`;
    } else if (text) {
      error = `parse text error: ${text}`;
    } else {
      error = `parse error: ${reason} : \
${this.template.slice(startIndex, endIndex)}`;
    }
    const oe = new Error(error);
    assign(oe, config, {
      startIndex,
      endIndex,
      originalError,
    });
    throw oe;
  },

  processExpression(exp, config) {
    try {
      return transformExpression(
        exp,
        this.scope,
        assign({
          strictDataMember: this.config.strictDataMember,
        }, config)
      );
    } catch (e) {
      if (this.config.consoleError) {
        console.error(e);
      }
      this.throwParseError(config, e);
    }
  },

  generateCodeForTags(children_, level, arrayForm_) {
    const arrayForm = arrayForm_ === undefined ?
      isRenderChildrenArray.call(this, children_) : arrayForm_;
    let children = children_;
    if (children && children.length) {
      let i = 0;
      children = children
        .filter(c => !(c.type === 'text' && !c.data.trim() || c.type === 'comment'));
      const l = children.length;
      if (!l) {
        return;
      }
      const transformIf = (c, attrName) => {
        const attrs = c.attribs;
        if (attrs && attrName in attrs) {
          const ifValue = attrs[attrName];
          if (attrName === this.IF_ATTR_NAME && this.isStartOfCodeSection(level)) {
            this.pushCode(level, '{');
          }
          let ifExp;
          if (ifValue) {
            ifExp = this.processExpression(ifValue, {
              node: c,
              attrName,
            });
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
          if (attrName === this.IF_ATTR_NAME && this.isEndOfCodeSection(level)) {
            this.pushCode(level, '}');
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
        const child = children[i];
        const currentCodeLength = this.code.length;
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

  generateCodeForTag(node, level_) {
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
      pure,
    } = this.config;

    let level = level_ || 0;
    if (node.type === 'text') {
      const text = node.data.trim();
      if (text) {
        const codeText = `${this.isStartOfCodeSection(level) ?
          '{' : ''}${
          this.processExpression(text, {
            node,
            text,
          })}${
          this.isEndOfCodeSection(level) ?
            '}' : ''}`;
        this.pushCode(level, codeText);
      }
      return;
    }

    if (node.type === 'script' && allowScript) {
      let { children } = node;
      children = children && children[0];
      const script = children && children.data;
      if (script) {
        this.header.push(script.trim());
      }
    }

    let tag = node.type === 'tag' && node.name;
    if (!tag) {
      return;
    }

    const attrs = node.attribs || {};

    if (tag === 'import-module') {
      if (allowImportModule) {
        let deps;
        try {
          deps = attrs.name && processImportComponent(attrs.name);
        } catch (e) {
          if (this.config.consoleError) {
            console.error(e);
          }
          this.throwParseError({
            node,
            attrName: 'name',
          }, e);
        }
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
          this.processExpression(attrs.data, {
            forceObject: true,
            node,
            attrName: 'data',
          }) || 'undefined' :
          'undefined';
        const is = this.processExpression(attrs.is, {
          node,
          attrName: 'is',
        });
        this.pushCode(level,
          `${
            this.isStartOfCodeSection(level) ? '{ ' : ''
            }${pure ?
            // parent passed as children...
            `React.createElement($templates$[${is}].Component, ${data}, this)` :
            `$templates$[${is}].call(this, ${data})`}${
            this.isEndOfCodeSection(level) ? ' }' : ''
            }`);
      } else {
        this.pushState();
        const { name } = attrs;
        this.generateCodeForTags(node.children, TOP_LEVEL);
        subTemplatesCode[name] = this.popState().code;
      }
      return;
    }

    if (tag === 'import') {
      const importPath = transformAbsoluteToRelative(projectRoot,
        renderPath, attrs.src, allowImportModule);
      importTplDeps[importPath] = importTplDeps[importPath] ||
        (this.importIncludeIndex++);
      return;
    }

    if (tag === 'include') {
      const includePath = transformAbsoluteToRelative(projectRoot,
        renderPath, attrs.src, allowImportModule);
      includeTplDeps[includePath] = includeTplDeps[includePath] ||
        (this.importIncludeIndex++);
      this.pushCode(level, `${
        this.isStartOfCodeSection(level) ? '{ ' : ''
        }$render$${includeTplDeps[includePath]}.apply(this, arguments)${
        this.isEndOfCodeSection(level) ? ' }' : ''
        }`);
      return;
    }

    let inFor = false;
    let forKey;
    if (this.FOR_ATTR_NAME in attrs) {
      inFor = true;
      if (this.isStartOfCodeSection(level, true)) {
        this.pushCode(level, '{');
      }
      const forExp = this.processExpression(attrs[this.FOR_ATTR_NAME], {
        node,
        attrName: this.FOR_ATTR_NAME,
      });
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
      Object.keys(attrs).forEach((attrName_) => {
        let attrName = attrName_;
        if (this.SPECIAL_ATTRS.indexOf(attrName) !== -1) {
          return;
        }
        const attrValue = attrs[attrName];
        let transformedAttrValue = attrValue;
        if (attrValue === null) {
          return;
        }
        const info = {
          attrValue,
          attrName,
          attrKey: attrName,
          node,
          attrs,
          transformedAttrs,
          transformer: this,
        };
        if (attributeProcessor && attributeProcessor(info) === false) {
          return;
        }
        if (attrValue) {
          transformedAttrValue = `{${this.processExpression(attrValue, {
            node,
            attrName,
          })}}`;
        } else {
          transformedAttrValue = null;
        }
        if (attrName === 'class') {
          attrName = 'className';
        }
        if ((attrName === 'className' || attrName === 'style') &&
          !transformedAttrValue) {
          return;
        }
        if (transformedAttrValue !== undefined) {
          transformedAttrs[attrName] = transformedAttrValue;
        }
      });
      const originalTag = tag;
      if (tagProcessor) {
        const tagProcessRet = tagProcessor({
          attrs,
          transformedAttrs,
          node,
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
          this.pushCode(nextLevel, `${startsWith(k, 'data-') || startsWith(k, 'aria-') ?
            k :
            camelCase(k)}${transformedAttrs[k] ? ` = ${transformedAttrs[k]}` : ''}`);
        });
        this.pushCode(level, `>`);
      } else {
        this.pushCode(level, `<${tag}>`);
      }

      if (node.children) {
        // new code section start
        // <view>{}</view>
        this.pushCodeSection();
        this.generateCodeForTags(node.children, nextLevel, false);
        this.popCodeSection();
      }

      this.pushCode(level, `</${tag}>`);
    } else if (node.children) {
      // block will not emit any tag, so reuse current code section
      const currentCodeLength = this.code.length;
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
  },
});

export default MLTransformer;

'use strict';

const expect = require('expect.js');
const MLTransformer = require('../../src/Transformer');

describe('MLTransformer', () => {
  describe('template', () => {
    it('support simple', (done) => {
      new MLTransformer([
        `<template name="t">`,
        `<div>{{z}}</div>`,
        `</template>`,
        `<div>`,
        `<template is="{{x%2?'t':'z'}}" data="{{...o}}" />`,
        `</div>`,
      ].join('\n')).transform((err, code) => {
        expect(code).to.eql([
          `const React = require('react');`,
          `let $templates$ = {};`,
          `const $ownTemplates$ = {};`,
          `$ownTemplates$['t'] = function (state) {`,
          `  return (`,
          `    <div>`,
          `      {(state.z)}`,
          `    </div>`,
          `  );`,
          `};`,
          `$templates$ = $ownTemplates$;`,
          `module.exports = function render({ state }) {`,
          `  return (`,
          `    <div>`,
          `      { $templates$[(state.x % 2 ? 't' : 'z')].call(this, (({ ...state.o }))) }`,
          `    </div>`,
          `  );`,
          `};`,
          `module.exports.$ownTemplates$ = $ownTemplates$;`,
        ].join('\n'));
        done();
      });
    });

    it('support import', (done) => {
      new MLTransformer([
        `<import src="a.html" />`,
        `<template name="t">`,
        `<div>{{z}}</div>`,
        `</template>`,
        `<div>`,
        `<template is="t" data="{{o}}" />`,
        `</div>`,
      ].join('\n')).transform((err, code) => {
        expect(code).to.eql([
          `const React = require('react');`,
          `const assign = require('object-assign');`,
          `const { $ownTemplates$: $ownTemplates$1 } = require('./a$Render');`,
          `let $templates$ = {};`,
          `const $ownTemplates$ = {};`,
          `$ownTemplates$['t'] = function (state) {`,
          `  return (`,
          `    <div>`,
          `      {(state.z)}`,
          `    </div>`,
          `  );`,
          `};`,
          `$templates$ = assign($templates$, $ownTemplates$1, $ownTemplates$);`,
          `module.exports = function render({ state }) {`,
          `  return (`,
          `    <div>`,
          `      { $templates$['t'].call(this, (({ o: state.o }))) }`,
          `    </div>`,
          `  );`,
          `};`,
          `module.exports.$ownTemplates$ = $ownTemplates$;`,
        ].join('\n'));
        done();
      });
    });

    it('support import absolute', (done) => {
      new MLTransformer([
        `<import src="/a.html" />`,
      ].join('\n'), {
        projectRoot: process.cwd(),
        renderPath: __filename,
      }).transform((err, code) => {
        expect(code).to.eql([
          `const React = require('react');`,
          `const assign = require('object-assign');`,
          `const { $ownTemplates$: $ownTemplates$1 } = require('../../a$Render');`,
          `let $templates$ = {};`,
          `const $ownTemplates$ = {};`,
          `$templates$ = assign($templates$, $ownTemplates$1, $ownTemplates$);`,
          `module.exports = function render({ state }) {`,
          `  return (`,
          `null`,
          `  );`,
          `};`,
          `module.exports.$ownTemplates$ = $ownTemplates$;`,
        ].join('\n'));
        done();
      });
    });
  });

  describe('include', () => {
    it('support simple', (done) => {
      new MLTransformer([
        `<div>`,
        `<include src="a.html" />`,
        `</div>`,
      ].join('\n')).transform((err, code) => {
        expect(code).to.eql([
          `const React = require('react');`,

          `const $render$1 = require('./a$Render');`,
          `module.exports = function render({ state }) {`,
          `  return (`,
          `    <div>`,
          `      { $render$1.apply(this, arguments) }`,
          `    </div>`,
          `  );`,
          `};`,
        ].join('\n'));
        done();
      });
    });
  });
});

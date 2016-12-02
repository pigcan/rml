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
          `import React from 'react';`,
          `let $templates$ = {};`,
          `export const $ownTemplates$ = {};`,
          `$ownTemplates$['t'] = function (state) {`,
          `  return (`,
          `    <div>`,
          `      {(state.z)}`,
          `    </div>`,
          `  );`,
          `};`,
          `$templates$ = $ownTemplates$;`,
          `export default function render({ state }) {`,
          `  return (`,
          `    <div>`,
          `      { $templates$[(state.x % 2 ? 't' : 'z')].call(this, (({ ...state.o }))) }`,
          `    </div>`,
          `  );`,
          `};`,
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
          `import React from 'react';`,
          `import assign from 'object-assign';`,
          `import { $ownTemplates$: $ownTemplates$1 } from './a$Render';`,
          `let $templates$ = {};`,
          `export const $ownTemplates$ = {};`,
          `$ownTemplates$['t'] = function (state) {`,
          `  return (`,
          `    <div>`,
          `      {(state.z)}`,
          `    </div>`,
          `  );`,
          `};`,
          `$templates$ = assign($templates$, $ownTemplates$1, $ownTemplates$);`,
          `export default function render({ state }) {`,
          `  return (`,
          `    <div>`,
          `      { $templates$['t'].call(this, (({ o: state.o }))) }`,
          `    </div>`,
          `  );`,
          `};`,
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
          `import React from 'react';`,
          `import assign from 'object-assign';`,
          `import { $ownTemplates$: $ownTemplates$1 } from '../../a$Render';`,
          `let $templates$ = {};`,
          `export const $ownTemplates$ = {};`,
          `$templates$ = assign($templates$, $ownTemplates$1, $ownTemplates$);`,
          `export default function render({ state }) {`,
          `  return (`,
          `null`,
          `  );`,
          `};`,
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
          `import React from 'react';`,
          `import $render$1 from './a$Render';`,
          `export default function render({ state }) {`,
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

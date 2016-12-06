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
          ``,
          `let $templates$ = {};`,
          `export const $ownTemplates$ = {};`,
          `$ownTemplates$['t'] = function (data) {`,
          `  return (`,
          `    <div>`,
          `      {(data.z)}`,
          `    </div>`,
          `  );`,
          `};`,
          `$templates$ = $ownTemplates$;`,
          `export default function render(data) {`,
          `  return (`,
          `    <div>`,
          `      { $templates$[(data.x % 2 ? 't' : 'z')].call(this, (({ ...data.o }))) }`,
          `    </div>`,
          `  );`,
          `};`,
        ].join('\n'));
        done();
      });
    });

    it('support import', (done) => {
      new MLTransformer([
        `<import src="a.rml" />`,
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
          `import { $ownTemplates$ as $ownTemplates$1 } from './a.rml';`,
          ``,
          `let $templates$ = {};`,
          `export const $ownTemplates$ = {};`,
          `$ownTemplates$['t'] = function (data) {`,
          `  return (`,
          `    <div>`,
          `      {(data.z)}`,
          `    </div>`,
          `  );`,
          `};`,
          `$templates$ = assign($templates$, $ownTemplates$1, $ownTemplates$);`,
          `export default function render(data) {`,
          `  return (`,
          `    <div>`,
          `      { $templates$['t'].call(this, (({ o: data.o }))) }`,
          `    </div>`,
          `  );`,
          `};`,
        ].join('\n'));
        done();
      });
    });

    it('support import absolute', (done) => {
      new MLTransformer([
        `<import src="/a.rml" />`,
      ].join('\n'), {
        projectRoot: process.cwd(),
        renderPath: __filename,
      }).transform((err, code) => {
        expect(code).to.eql([
          `import React from 'react';`,
          `import assign from 'object-assign';`,
          `import { $ownTemplates$ as $ownTemplates$1 } from '../../a.rml';`,
          ``,
          `let $templates$ = {};`,
          `export const $ownTemplates$ = {};`,
          `$templates$ = assign($templates$, $ownTemplates$1, $ownTemplates$);`,
          `export default function render(data) {`,
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
        `<include src="a.rml" />`,
        `</div>`,
      ].join('\n')).transform((err, code) => {
        expect(code).to.eql([
          `import React from 'react';`,
          `import $render$1 from './a.rml';`,
          ``,
          `export default function render(data) {`,
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

'use strict';

const expect = require('expect.js');
const MLTransformer = require('../../src/Transformer');

describe('MLTransformer', () => {
  describe('template', () => {
    it('support standalone', (done) => {
      new MLTransformer(
        `
<import src='q' />
<import-module name="x" from="y" />
<template is="z" />
`.trim()
      ).transform((err, code) => {
        expect(code).to.be(`
import React from 'react';
import assign from 'object-assign';
import { $ownTemplates$ as $ownTemplates$1 } from './q';

let $templates$ = {};
export const $ownTemplates$ = {};
$templates$ = assign($templates$, $ownTemplates$1, $ownTemplates$);
export default function render(data) {
  return (
    $templates$['z'].call(this, undefined)
  );
};

`.trim());
        done();
      });
    });

    it('support pure', (done) => {
      new MLTransformer(
        [
          `<template name="t">`,
          `<div>{{z}}</div>`,
          `</template>`,
          `<div>`,
          `<template is="{{x%2?'t':'z'}}" data="{{...o}}" />`,
          `</div>`,
        ].join('\n'), { pure: true }
      ).transform((err, code) => {
        expect(code).to.be(`
import React from 'react';

import $shallowequal from "shallowequal";

const $ownTemplatesCache$ = {};
const $ownTemplatesContextCache$ = {};
const $ownTemplatesDataCache$ = {};
let $templates$ = {};
export const $ownTemplates$ = {};
$ownTemplates$['t'] = function (data) {
  if ($ownTemplatesCache$['t'] && \
this === $ownTemplatesContextCache$['t'] && \
$shallowequal(data, $ownTemplatesDataCache$['t'])) {
    return $ownTemplatesCache$['t'];
  }
  const $ret = (
    <div>
      {(data.z)}
    </div>
  );
  $ownTemplatesContextCache$['t'] = this;
  $ownTemplatesDataCache$['t'] = data;
  $ownTemplatesCache$['t'] = $ret;
  return $ret;
};
$templates$ = $ownTemplates$;
export default function render(data) {
  return (
    <div>
      { $templates$[(data.x % 2 ? 't' : 'z')].call(this, (({ ...data.o }))) }
    </div>
  );
};
`.trim());
        done();
      });
    });


    it('support standalone array', (done) => {
      new MLTransformer(
        `
<import src='q' />
<import-module name="x" from="y" />
<template is="z" />
<view/>
`.trim()
      ).transform((err, code) => {
        expect(code).to.be(`
import React from 'react';
import assign from 'object-assign';
import { $ownTemplates$ as $ownTemplates$1 } from './q';

let $templates$ = {};
export const $ownTemplates$ = {};
$templates$ = assign($templates$, $ownTemplates$1, $ownTemplates$);
export default function render(data) {
  return (
    [
    $templates$['z'].call(this, undefined)
    ,
    <view>
    </view>
    ,
    ]
  );
};
`.trim());
        done();
      });
    });

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
    it('support standalone', (done) => {
      new MLTransformer(
        `
<import-module name="x" from="y" />
<include src="z" />
`.trim()
      ).transform((err, code) => {
        expect(code).to.be(`
import React from 'react';
import $render$1 from './z';

export default function render(data) {
  return (
    $render$1.apply(this, arguments)
  );
};
`.trim());
        done();
      });
    });

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

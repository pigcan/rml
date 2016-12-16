'use strict';

const expect = require('expect.js');
const MLTransformer = require('../../src/Transformer');

describe('MLTransformer', () => {
  it('support simple', (done) => {
    new MLTransformer([
      '<div prop="{{a+b}}" x="1" onClick="{{this.onClick}}">',
      '<div>',
      '1{{a[0].b}}2',
      '</div>',
      '<div>',
      '1',
      '</div>',
      '<div>',
      '1',
      '</div>',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <div`,
        `      prop = {(data.a + data.b)}`,
        `      x = {1}`,
        `      onClick = {(this.onClick)}`,
        `    >`,
        `      <div>`,
        `        {'1' + (data.a[0].b) + '2'}`,
        `      </div>`,
        `      <div>`,
        `        1`,
        `      </div>`,
        `      <div>`,
        `        1`,
        `      </div>`,
        `    </div>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });

  it('support ignore attr value', (done) => {
    new MLTransformer([
      `<div checked>`,
      `</div>`,
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <div`,
        `      checked`,
        `    >`,
        `    </div>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });

  it('support bool attr value', (done) => {
    new MLTransformer([
      `<div checked="{{false}}">`,
      `</div>`,
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <div`,
        `      checked = {(false)}`,
        `    >`,
        `    </div>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });

  it('allowImportComponent', (done) => {
    new MLTransformer([
      `<import-module name="X" from="y" />`,
      `<import-module name="{Z, Q:Y}" from="y" />`,
      `<X value="{{Y}}"><Y/><Z/></X>`,
    ].join('\n'), {
      allowImportModule: true,
    }).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        `import X from 'y';`,
        `import { Z, Q as Y } from 'y';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <X`,
        `      value = {(Y)}`,
        `    >`,
        `      <Y>`,
        `      </Y>`,
        `      <Z>`,
        `      </Z>`,
        `    </X>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });

  it('allowScript', (done) => {
    new MLTransformer([
      `<script>var x = 1;</script>`,
      `<X/>`,
    ].join('\n'), {
      allowScript: true,
    }).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        `var x = 1;`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <X>`,
        `    </X>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });
});

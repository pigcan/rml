'use strict';

const expect = require('expect.js');
const MLTransformer = require('../../src/Transformer');

describe('block', () => {
  it('support simple', (done) => {
    new MLTransformer([
      `<div>`,
      `<block>`,
      `<div></div>`,
      `</block>`,
      `</div>`,
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <div>`,
        `      {`,
        `      [`,
        `      <div>`,
        `      </div>`,
        `      ,`,
        `      ]`,
        `      }`,
        `    </div>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });

  it('support simple multiple', (done) => {
    new MLTransformer([
      `<div>`,
      `<block>`,
      `<div></div>`,
      `<div></div>`,
      `</block>`,
      `</div>`,
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <div>`,
        `      {`,
        `      [`,
        `      <div>`,
        `      </div>`,
        `      ,`,
        `      <div>`,
        `      </div>`,
        `      ,`,
        `      ]`,
        `      }`,
        `    </div>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });

  it('support block if', (done) => {
    new MLTransformer([
      `<div>`,
      `<block r:if="{{a>b}}">`,
      `<div></div>`,
      `</block>`,
      `</div>`,
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <div>`,
        `      {`,
        `      (`,
        `      ((data.a > data.b)) ?`,
        `      (`,
        `      [`,
        `      <div>`,
        `      </div>`,
        `      ,`,
        `      ]`,
        `      )`,
        `      :`,
        `      null`,
        `      )`,
        `      }`,
        `    </div>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });

  it('support if nested', (done) => {
    new MLTransformer([
      `<div>`,
      `<block r:if="{{c>d}}">`,
      `<div r:if="{{a>b}}"></div>`,
      `</block>`,
      `</div>`,
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <div>`,
        `      {`,
        `      (`,
        `      ((data.c > data.d)) ?`,
        `      (`,
        `      [`,
        `      (`,
        `      ((data.a > data.b)) ?`,
        `      (`,
        `      <div>`,
        `      </div>`,
        `      )`,
        `      :`,
        `      null`,
        `      )`,
        `      ]`,
        `      )`,
        `      :`,
        `      null`,
        `      )`,
        `      }`,

        `    </div>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });

  it('support block if multiple', (done) => {
    new MLTransformer([
      `<div>`,
      `<block r:if="{{a>b}}">`,
      `<div></div>`,
      `<div></div>`,
      `</block>`,
      `</div>`,
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <div>`,
        `      {`,
        `      (`,
        `      ((data.a > data.b)) ?`,
        `      (`,
        `      [`,
        `      <div>`,
        `      </div>`,
        `      ,`,
        `      <div>`,
        `      </div>`,
        `      ,`,
        `      ]`,
        `      )`,
        `      :`,
        `      null`,
        `      )`,
        `      }`,
        `    </div>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });

  it('support block for', (done) => {
    new MLTransformer([
      `<div>`,
      `<block r:for="{{a}}">`,
      `<div></div>`,
      `</block>`,
      `</div>`,
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <div>`,
        `      {`,
        `      ((data.a) || []).map((item, index) => {`,
        `        return (`,
        `          [`,
        `          <div>`,
        `          </div>`,
        `          ,`,
        `          ]`,
        `        );`,
        `      })`,
        `      }`,
        `    </div>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });
});

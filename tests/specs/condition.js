'use strict';

const expect = require('expect.js');
const MLTransformer = require('../../src/Transformer');

describe('conditional render', () => {
  it('support simple', (done) => {
    new MLTransformer([
      '<div>',
      '<div r:if="{{l>1}}">',
      '</div>',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <div>`,
        `      {`,
        `      (`,
        `      ((data.l > 1)) ?`,
        `      (`,
        `      <div>`,
        `      </div>`,
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

  it('support ifs', (done) => {
    new MLTransformer([
      '<div>',
      '<div r:if="{{l>1}}">',
      '</div>',
      '<div r:if="{{t>1}}">',
      '</div>',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <div>`,
        `      {`,
        `      (`,
        `      ((data.l > 1)) ?`,
        `      (`,
        `      <div>`,
        `      </div>`,
        `      )`,
        `      :`,
        `      null`,
        `      )`,
        `      }`,
        `      {`,
        `      (`,
        `      ((data.t > 1)) ?`,
        `      (`,
        `      <div>`,
        `      </div>`,
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

  it('support simple nested', (done) => {
    new MLTransformer([
      '<div>',
      '<div r:if="{{l>1}}">',
      '<template is="x" r:if="{{t>1}}" />',
      '</div>',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <div>`,
        `      {`,
        `      (`,
        `      ((data.l > 1)) ?`,
        `      (`,
        `      <div>`,
        `        {`,
        `        (`,
        `        ((data.t > 1)) ?`,
        `        (`,
        `         $templates$['x'].call(this, undefined) `,
        `        )`,
        `        :`,
        `        null`,
        `        )`,
        `        }`,
        `      </div>`,
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

  it('support full nested', (done) => {
    new MLTransformer([
      '<div>',
      '<div r:if="{{l>1}}">',
      '</div>',
      '<div r:elif="{{l>2}}">',
      '</div>',
      '<div r:else="{{l>3}}">',
      '</div>' +
      '<div></div>',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <div>`,
        `      {`,
        `      (`,
        `      ((data.l > 1)) ?`,
        `      (`,
        `      <div>`,
        `      </div>`,
        `      )`,
        `      :`,
        `      (`,
        `      ((data.l > 2)) ?`,
        `      (`,
        `      <div>`,
        `      </div>`,
        `      )`,
        `      :`,
        `      (`,
        `      ((data.l > 3)) ?`,
        `      (`,
        `      <div>`,
        `      </div>`,
        `      )`,
        `      :`,
        `      null`,
        `      )`,
        `      )`,
        `      )`,
        `      }`,
        `      <div>`,
        `      </div>`,
        `    </div>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });

  it('support empy else', (done) => {
    new MLTransformer([
      '<div>',
      '<div r:if="{{l>1}}">',
      '</div>',
      '<div r:else>',
      '</div>',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `import React from 'react';`,
        ``,
        `export default function render(data) {`,
        `  return (`,
        `    <div>`,
        `      {`,
        `      (`,
        `      ((data.l > 1)) ?`,
        `      (`,
        `      <div>`,
        `      </div>`,
        `      )`,
        `      :`,
        `      (`,
        `      (`,
        `      <div>`,
        `      </div>`,
        `      )`,
        `      )`,
        `      )`,
        `      }`,
        `    </div>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });
});

'use strict';

const expect = require('expect.js');
const MLTransformer = require('../../src/Transformer');

describe('loop', () => {
  it('support simple', (done) => {
    new MLTransformer([
      '<div>',
      '<div r:for="{{items}}">',
      '{{item}}',
      '</div>',
      '<div>{{i}}</div>',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `const React = require('react');`,
        `module.exports = function render({ state }) {`,
        `  return (`,
        `    <div>`,
        `      {`,
        `      ((state.items) || []).map((item, index) => {`,
        `        return (`,
        `          <div>`,
        `            {(item)}`,
        `          </div>`,
        `        );`,
        `      })`,
        `      }`,
        `      <div>`,
        `        {(state.i)}`,
        `      </div>`,
        `    </div>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });

  it('support nested', (done) => {
    new MLTransformer([
      '<div>',
      '<div r:for="{{items}}" r:for-item="outer">',
      '<div r:for="{{outer}}">',
      '{{item}}',
      '</div>',
      '</div>',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `const React = require('react');`,

        `module.exports = function render({ state }) {`,
        `  return (`,
        `    <div>`,
        `      {`,
        `      ((state.items) || []).map((outer, index) => {`,
        `        return (`,
        `          <div>`,
        `            {`,
        `            ((outer) || []).map((item, index) => {`,
        `              return (`,
        `                <div>`,
        `                  {(item)}`,
        `                </div>`,
        `              );`,
        `            })`,
        `            }`,
        `          </div>`,
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

  it('support simple', (done) => {
    new MLTransformer([
      '<div>',
      '<div r:for="{{items}}" r:for-index="i" r:for-item="t" r:key="u">',
      '{{i}} - {{t}} - {{z}}',
      '</div>',
      '<div>{{i}}</div>',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `const React = require('react');`,

        `module.exports = function render({ state }) {`,
        `  return (`,
        `    <div>`,
        `      {`,
        `      ((state.items) || []).map((t, i) => {`,
        `        return (`,
        `          <div`,
        `            key = {t.u}`,
        `          >`,
        `            {(i) + ' - ' + (t) + ' - ' + (state.z)}`,
        `          </div>`,
        `        );`,
        `      })`,
        `      }`,
        `      <div>`,
        `        {(state.i)}`,
        `      </div>`,
        `    </div>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });
});

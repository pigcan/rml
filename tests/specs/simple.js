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
        `const React = require('react');`,
        `module.exports = function render({ state }) {`,
        `  return (`,
        `    <div`,
        `      prop = {(state.a + state.b)}`,
        `      x = {1}`,
        `      onClick = {(this.onClick)}`,
        `    >`,
        `      <div>`,
        `        {'1' + (state.a[0].b) + '2'}`,
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
        `const React = require('react');`,

        `module.exports = function render({ state }) {`,
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
        `const React = require('react');`,
        `module.exports = function render({ state }) {`,
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

  it('support inline style', (done) => {
    new MLTransformer([
      '<div style="display:flex;flex:1">',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).to.eql([
        `const React = require('react');`,
        `module.exports = function render({ state }) {`,
        `  return (`,
        `    <div`,
        `      style = "display:flex;flex:1"`,
        `    >`,
        `    </div>`,
        `  );`,
        `};`,
      ].join('\n'));
      done();
    });
  });
});

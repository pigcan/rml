'use strict';

const expect = require('expect.js');
const MLTransformer = require('../../src/Transformer');

describe('MLTransformer error', () => {
  it('report on attribute', (done) => {
    new MLTransformer([
      '<div prop="{{var}}" x="1">',
      '<div>',
      '1',
      '</div>',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).to.be(undefined);
      expect(err.message).to.be(`parse tag's attribute prop error: <div prop="{{var}}" x="1">`);
      done();
    });
  });

  it('report on attribute with text as child', (done) => {
    new MLTransformer([
      '<div prop="{{var}}" x="1">',
      '1',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).to.be(undefined);
      expect(err.startIndex).to.be(0);
      expect(err.message).to.be(`parse tag's attribute prop error: <div prop="{{var}}" x="1">`);
      done();
    });
  });

  it('report on text node', (done) => {
    new MLTransformer([
      '<div prop="{{1}}" x="1">',
      '12{{var}}34',
      '<div>',
      '1',
      '</div>',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).to.be(undefined);
      expect(err.message).to.be('parse text error: 12{{var}}34');
      done();
    });
  });
});

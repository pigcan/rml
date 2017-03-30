
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
      expect(code).toEqual(undefined);
      expect(err.message).toMatchSnapshot();
      done();
    });
  });

  it('report on attribute with text as child', (done) => {
    new MLTransformer([
      '<div prop="{{var}}" x="1">',
      '1',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).toEqual(undefined);
      expect(err.startIndex).toEqual(0);
      expect(err.message).toMatchSnapshot();
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
      expect(code).toEqual(undefined);
      expect(err.message).toMatchSnapshot();
      done();
    });
  });
});

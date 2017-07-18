
const MLTransformer = require('../../src/Transformer');

describe('conditional render', () => {
  it('support simple', (done) => {
    new MLTransformer([
      '<div>',
      '<div r:if="{{l>1}}">',
      '</div>',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).toMatchSnapshot();
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
      expect(code).toMatchSnapshot();
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
      expect(code).toMatchSnapshot();
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
      expect(code).toMatchSnapshot();
      done();
    });
  });

  it('support empty else', (done) => {
    new MLTransformer([
      '<div>',
      '<div r:if="{{l>1}}">',
      '</div>',
      '<div r:else>',
      '</div>',
      '</div>',
    ].join('\n')).transform((err, code) => {
      expect(code).toMatchSnapshot();
      done();
    });
  });

  it('support multiple roots', (done) => {
    new MLTransformer(`
<block r:if="a">1</block>
<view/>
`.trim())
      .transform((err, code) => {
        expect(code).toMatchSnapshot();
        done();
      });
  });

  it('skip comment', (done) => {
    new MLTransformer(`
<!--1-->
<block r:if="a">1</block>
<!--1-->
<block r:elif="a">1</block>
<!--1-->
<view r:else>1</view>
`.trim())
      .transform((err, code) => {
        expect(code).toMatchSnapshot();
        done();
      });
  });
});

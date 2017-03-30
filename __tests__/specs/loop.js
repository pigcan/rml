
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
      expect(code).toMatchSnapshot();
      done();
    });
  });

  it('support root simple', (done) => {
    new MLTransformer(`
<view r:for="z">
<block>1</block>
</view>
`.trim())
      .transform((err, code) => {
        expect(code).toMatchSnapshot();
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
    ].join('\n'))
      .transform((err, code) => {
        expect(code).toMatchSnapshot();
        done();
      });
  });

  it('support item', (done) => {
    new MLTransformer([
      '<div>',
      '<div r:for="{{items}}" r:for-index="i" r:for-item="t" r:key="u">',
      '{{i}} - {{t}} - {{z}}',
      '</div>',
      '<div>{{i}}</div>',
      '</div>',
    ].join('\n'))
      .transform((err, code) => {
        expect(code).toMatchSnapshot();
        done();
      });
  });
});

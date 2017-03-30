
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
      expect(code).toMatchSnapshot();
      done();
    });
  });

  it('support text', (done) => {
    new MLTransformer([
      `<block>`,
      `{{x}}`,
      `</block>`,
    ].join('\n')).transform((err, code) => {
      expect(code).toMatchSnapshot();
      done();
    });
  });


  it('support nested block', (done) => {
    new MLTransformer(`
      <view r:if="{{z}}">
        <block>
          {{ z }}
        </block>
      </view>
`.trim())
      .transform((err, code) => {
        expect(code).toMatchSnapshot();
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
      expect(code).toMatchSnapshot();
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
      expect(code).toMatchSnapshot();
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
      expect(code).toMatchSnapshot();
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
      expect(code).toMatchSnapshot();
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
      expect(code).toMatchSnapshot();
      done();
    });
  });

  it('support root block for', (done) => {
    new MLTransformer(`
<block r:for="{{z}}">
          z'\\
        </block>
`.trim())
      .transform((err, code) => {
        expect(code).toMatchSnapshot();
        done();
      });
  });
});

const MLTransformer = require('../../src/Transformer');

describe('MLTransformer', () => {
  it('style/className/class can not be bool', (done) => {
    new MLTransformer(
      `
<a style/>
<a class/>
<a className/>
`.trim()
    ).transform((err, code) => {
      expect(code).toMatchSnapshot();
      done();
    });
  });

  it('escape attribute', (done) => {
    new MLTransformer(
      `
<a x='"\`'>"'\`</a>
`.trim()
    ).transform((err, code) => {
      expect(code).toMatchSnapshot();
      done();
    });
  });

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
      expect(code).toMatchSnapshot();
      done();
    });
  });

  it('support ignore attr value', (done) => {
    new MLTransformer([
      `<div checked>`,
      `</div>`,
    ].join('\n')).transform((err, code) => {
      expect(code).toMatchSnapshot();
      done();
    });
  });

  it('support bool attr value', (done) => {
    new MLTransformer([
      `<div checked="{{false}}">`,
      `</div>`,
    ].join('\n')).transform((err, code) => {
      expect(code).toMatchSnapshot();
      done();
    });
  });

  it('allowImportModule', (done) => {
    new MLTransformer([
      `<import-module name="X" from="y" />`,
      `<import-module name="{Z, Q:Y}" from="y" />`,
      `<X value="{{Y}}"><Y/><Z/></X>`,
    ].join('\n'), {
      allowImportModule: true,
    }).transform((err, code) => {
      expect(code).toMatchSnapshot();
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
      expect(code).toMatchSnapshot();
      done();
    });
  });

  it('skip comment', (done) => {
    new MLTransformer(
      `
<!-- 1 -->
<a />
<!-- 2 -->
`.trim()
    ).transform((err, code) => {
      expect(code).toMatchSnapshot();
      done();
    });
  });
});

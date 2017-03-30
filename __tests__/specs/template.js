const MLTransformer = require('../../src/Transformer');

describe('MLTransformer', () => {
  describe('template', () => {
    it('support standalone', (done) => {
      new MLTransformer(
        `
<import src='q' />
<import-module name="x" from="y" />
<template is="z" />
`.trim()
      ).transform((err, code) => {
        expect(code).toMatchSnapshot();
        done();
      });
    });

    it('support pure', (done) => {
      new MLTransformer(
        [
          `<template name="t">`,
          `<div>{{z}}</div>`,
          `</template>`,
          `<div>`,
          `<template is="{{x%2?'t':'z'}}" data="{{...o}}" />`,
          `</div>`,
        ].join('\n'), { pure: true }
      ).transform((err, code) => {
        expect(code).toMatchSnapshot();
        done();
      });
    });

    it('pure only allow one child', (done) => {
      new MLTransformer(
        [
          `<template name="t">`,
          `<div>{{z}}</div>`,
          `<div>{{z}}</div>`,
          `</template>`,
          `<div>`,
          `<template is="{{x%2?'t':'z'}}" data="{{...o}}" />`,
          `</div>`,
        ].join('\n'), { pure: true }
      ).transform((err) => {
        expect(err.message).toMatchSnapshot();
        done();
      });
    });

    it('support standalone array', (done) => {
      new MLTransformer(
        `
<import src='q' />
<import-module name="x" from="y" />
<template is="z" />
<view/>
`.trim()
      ).transform((err, code) => {
        expect(code).toMatchSnapshot();
        done();
      });
    });

    it('support simple', (done) => {
      new MLTransformer([
        `<template name="t">`,
        `<div>{{z}}</div>`,
        `</template>`,
        `<div>`,
        `<template is="{{x%2?'t':'z'}}" data="{{...o}}" />`,
        `</div>`,
      ].join('\n')).transform((err, code) => {
        expect(code).toMatchSnapshot();
        done();
      });
    });

    it('support import', (done) => {
      new MLTransformer([
        `<import src="a.rml" />`,
        `<template name="t">`,
        `<div>{{z}}</div>`,
        `</template>`,
        `<div>`,
        `<template is="t" data="{{o}}" />`,
        `</div>`,
      ].join('\n')).transform((err, code) => {
        expect(code).toMatchSnapshot();
        done();
      });
    });

    it('support import absolute', (done) => {
      new MLTransformer([
        `<import src="/a.rml" />`,
      ].join('\n'), {
        projectRoot: process.cwd(),
        renderPath: __filename,
      }).transform((err, code) => {
        expect(code).toMatchSnapshot();
        done();
      });
    });
  });

  describe('include', () => {
    it('support standalone', (done) => {
      new MLTransformer(
        `
<import-module name="x" from="y" />
<include src="z" />
`.trim()
      ).transform((err, code) => {
        expect(code).toMatchSnapshot();
        done();
      });
    });

    it('support simple', (done) => {
      new MLTransformer([
        `<div>`,
        `<include src="a.rml" />`,
        `</div>`,
      ].join('\n')).transform((err, code) => {
        expect(code).toMatchSnapshot();
        done();
      });
    });
  });
});

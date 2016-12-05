'use strict';

const expect = require('expect.js');
const { transformExpression } = require('../../src/expression');

describe('transformExpression', () => {
  it('keep this', () => {
    expect(transformExpression('{{this.x}}')).to.eql(`(this.x)`);
  });
  it('support literal', () => {
    expect(transformExpression('x')).to.eql(`'x'`);
  });
  it('support simple', () => {
    expect(transformExpression('{{x}}')).to.eql(`(data.x)`);
  });
  it('support forceObject', () => {
    expect(transformExpression('{{x}}', null, { forceObject: 1 })).to.eql(`(({ x: data.x }))`);
  });
  it('support spread', () => {
    expect(transformExpression('{{ ...x }}')).to.eql(`(({ ...data.x }))`);
  });
  it('support interpolate', () => {
    expect(transformExpression('1-{{x + y}}-2')).to.eql(`'1-' + (data.x + data.y) + '-2'`);
  });
  it('support interpolate 2', () => {
    expect(transformExpression('{{x + y}}-2')).to.eql(`(data.x + data.y) + '-2'`);
  });
  it('support ternary', () => {
    expect(transformExpression('{{flag ? true : false}}')).to.eql(`(data.flag ? true : false)`);
  });
  it('support logic', () => {
    expect(transformExpression('{{x>5}}')).to.eql(`(data.x > 5)`);
  });
  it('support string', () => {
    expect(transformExpression('{{"hello"+x}}')).to.eql(`("hello" + data.x)`);
  });
  it('support array', () => {
    expect(transformExpression('{{[x,2]}}')).to.eql(`([data.x, 2])`);
  });
  describe('object', () => {
    it('support simple', () => {
      expect(transformExpression('{{x:y}}')).to.eql(`(({ x: data.y }))`);
    });
    it('support shorthand', () => {
      expect(transformExpression('{{x,y}}')).to.eql(`(({ x: data.x, y: data.y }))`);
    });
    it('support spread', () => {
      expect(transformExpression('{{...x,y}}')).to.eql(`(({ ...data.x, y: data.y }))`);
    });
  });
  describe('member expression', () => {
    it('support simple', () => {
      expect(transformExpression('{{x.a}}')).to.eql(`(data.x.a)`);
    });

    it('support []', () => {
      expect(transformExpression('{{x[a].b}}')).to.eql(`(data.x[data.a].b)`);
    });
    it('support interpolate', () => {
      expect(transformExpression('1{{x[a].b}}2')).to.eql(`'1' + (data.x[data.a].b) + '2'`);
    });
  });
});

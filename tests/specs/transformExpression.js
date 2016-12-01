'use strict';

const expect = require('expect.js');
const transformExpression = require('../../src/transformExpression');

describe('transformExpression', () => {
  it('keep this', () => {
    expect(transformExpression('{{this.x}}')).to.eql(`(this.x)`);
  });
  it('support literal', () => {
    expect(transformExpression('x')).to.eql(`'x'`);
  });
  it('support simple', () => {
    expect(transformExpression('{{x}}')).to.eql(`(state.x)`);
  });
  it('support forceObject', () => {
    expect(transformExpression('{{x}}', null, { forceObject: 1 })).to.eql(`(({ x: state.x }))`);
  });
  it('support spread', () => {
    expect(transformExpression('{{ ...x }}')).to.eql(`(({ ...state.x }))`);
  });
  it('support interpolate', () => {
    expect(transformExpression('1-{{x + y}}-2')).to.eql(`'1-' + (state.x + state.y) + '-2'`);
  });
  it('support interpolate 2', () => {
    expect(transformExpression('{{x + y}}-2')).to.eql(`(state.x + state.y) + '-2'`);
  });
  it('support ternary', () => {
    expect(transformExpression('{{flag ? true : false}}')).to.eql(`(state.flag ? true : false)`);
  });
  it('support logic', () => {
    expect(transformExpression('{{x>5}}')).to.eql(`(state.x > 5)`);
  });
  it('support string', () => {
    expect(transformExpression('{{"hello"+x}}')).to.eql(`("hello" + state.x)`);
  });
  it('support array', () => {
    expect(transformExpression('{{[x,2]}}')).to.eql(`([state.x, 2])`);
  });
  describe('object', () => {
    it('support simple', () => {
      expect(transformExpression('{{x:y}}')).to.eql(`(({ x: state.y }))`);
    });
    it('support shorthand', () => {
      expect(transformExpression('{{x,y}}')).to.eql(`(({ x: state.x, y: state.y }))`);
    });
    it('support spread', () => {
      expect(transformExpression('{{...x,y}}')).to.eql(`(({ ...state.x, y: state.y }))`);
    });
  });
  describe('member expression', () => {
    it('support simple', () => {
      expect(transformExpression('{{x.a}}')).to.eql(`(state.x.a)`);
    });

    it('support []', () => {
      expect(transformExpression('{{x[a].b}}')).to.eql(`(state.x[state.a].b)`);
    });
    it('support interpolate', () => {
      expect(transformExpression('1{{x[a].b}}2')).to.eql(`'1' + (state.x[state.a].b) + '2'`);
    });
  });
});

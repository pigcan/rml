const { transformExpression } = require('../../src/expression');

describe('transformExpression', () => {
  it('keep this', () => {
    expect(transformExpression('{{this.x}}')).toEqual(`(this.x)`);
  });
  it('support literal', () => {
    expect(transformExpression('x')).toEqual(`'x'`);
  });
  it('support simple', () => {
    expect(transformExpression('{{x}}')).toEqual(`(data.x)`);
  });
  it('support forceObject', () => {
    expect(transformExpression('{{x}}', null, { forceObject: 1 })).toEqual(`(({ x: data.x }))`);
  });
  it('support spread', () => {
    expect(transformExpression('{{ ...x }}')).toEqual(`(({ ...data.x }))`);
  });
  it('support interpolate', () => {
    expect(transformExpression('1-{{x + y}}-2')).toEqual(`'1-' + (data.x + data.y) + '-2'`);
  });
  it('support interpolate 2', () => {
    expect(transformExpression('{{x + y}}-2')).toEqual(`(data.x + data.y) + '-2'`);
  });
  it('support ternary', () => {
    expect(transformExpression('{{flag ? true : false}}')).toEqual(`(data.flag ? true : false)`);
  });
  it('support logic', () => {
    expect(transformExpression('{{x>5}}')).toEqual(`(data.x > 5)`);
  });
  it('support string', () => {
    expect(transformExpression('{{"hello"+x}}')).toEqual(`("hello" + data.x)`);
  });
  it('support array', () => {
    expect(transformExpression('{{[x,2]}}')).toEqual(`([data.x, 2])`);
  });
  describe('object', () => {
    it('support simple', () => {
      expect(transformExpression('{{x:y}}')).toEqual(`(({ x: data.y }))`);
    });
    it('support shorthand', () => {
      expect(transformExpression('{{x,y}}')).toEqual(`(({ x: data.x, y: data.y }))`);
    });
    it('support spread', () => {
      expect(transformExpression('{{...x,y}}')).toEqual(`(({ ...data.x, y: data.y }))`);
    });
  });
  describe('member expression', () => {
    it('support simple', () => {
      expect(transformExpression('{{x.a}}')).toEqual(`(data.x.a)`);
    });
    it('support []', () => {
      expect(transformExpression('{{x[a].b}}')).toEqual(`(data.x[data.a].b)`);
    });
    it('support interpolate', () => {
      expect(transformExpression('1{{x[a].b}}2')).toEqual(`'1' + (data.x[data.a].b) + '2'`);
    });
  });

  describe('loose data member', () => {
    const args = [null, {
      strictDataMember: false,
    }];
    it('support simple', () => {
      expect(transformExpression('{{x}}', ...args)).toMatchSnapshot();
    });
    it('support simple member', () => {
      expect(transformExpression('{{x.a}}', ...args)).toMatchSnapshot();
    });
    it('support expression member', () => {
      expect(transformExpression('{{x.a + x[b]}}', ...args)).toMatchSnapshot();
    });
    it('support [] member', () => {
      expect(transformExpression('{{x[a].b}}', ...args)).toMatchSnapshot();
    });
    it('support interpolate member', () => {
      expect(transformExpression('1{{x[a].b}}2', ...args)).toMatchSnapshot();
    });
  });
});

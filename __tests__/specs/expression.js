const { transformExpression } = require('../../src/expression');

describe('transformExpression', () => {
  it('keep this', () => {
    expect(transformExpression('{{this.x}}')).toMatchSnapshot();
  });
  it('support literal', () => {
    expect(transformExpression('x')).toMatchSnapshot();
  });
  it('support simple', () => {
    expect(transformExpression('{{x}}')).toMatchSnapshot();
  });
  it('support forceObject', () => {
    expect(transformExpression('{{x}}', null, { forceObject: 1 })).toMatchSnapshot();
  });
  it('support spread', () => {
    expect(transformExpression('{{ ...x }}')).toMatchSnapshot();
  });
  it('support interpolate', () => {
    expect(transformExpression('1-{{x + y}}-2')).toMatchSnapshot();
  });
  it('support interpolate 2', () => {
    expect(transformExpression('{{x + y}}-2')).toMatchSnapshot();
  });
  it('support ternary', () => {
    expect(transformExpression('{{flag ? true : false}}')).toMatchSnapshot();
  });
  it('support logic', () => {
    expect(transformExpression('{{x>5}}')).toMatchSnapshot();
  });
  it('support string', () => {
    expect(transformExpression('{{"hello"+x}}')).toMatchSnapshot();
  });
  it('support array', () => {
    expect(transformExpression('{{[x,2]}}')).toMatchSnapshot();
  });
  describe('object', () => {
    it('support simple', () => {
      expect(transformExpression('{{x:y}}')).toMatchSnapshot();
    });
    it('support shorthand', () => {
      expect(transformExpression('{{x,y}}')).toMatchSnapshot();
    });
    it('support spread', () => {
      expect(transformExpression('{{...x,y}}')).toMatchSnapshot();
    });
  });
  describe('member expression', () => {
    it('support member function', () => {
      expect(transformExpression('{{x.y.join(",")}}')).toMatchSnapshot();
    });
    it('support simple', () => {
      expect(transformExpression('{{x.a}}')).toMatchSnapshot();
    });
    it('support []', () => {
      expect(transformExpression('{{x[a].b}}')).toMatchSnapshot();
    });
    it('support interpolate', () => {
      expect(transformExpression('1{{x[a].b}}2')).toMatchSnapshot();
    });
  });

  describe('loose data member', () => {
    const args = [null, {
      strictDataMember: false,
    }];
    it('support member function', () => {
      expect(transformExpression('{{x.y.join(",")}}', ...args)).toMatchSnapshot();
    });
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

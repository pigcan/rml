import React from 'react';
const { PureComponent } = React;

function Noop() {
}
Noop.prototype = PureComponent.prototype;

export default function (name, elementFactory) {
  function RMLTemplate() {
    PureComponent.apply(this, arguments);
  }
  RMLTemplate.displayName = name;
  const proto = RMLTemplate.prototype = new Noop();
  proto.render = function () {
    const children = elementFactory.call(this.props.children, this.props);
    if (React.Children.count(children) > 1) {
      throw new Error(`template ${name} can only has one render child!`);
    }
    return children;
  };
  return RMLTemplate;
}

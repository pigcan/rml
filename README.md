# rml
---

An alternate markup language to react jsx. inspired by [wxml](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/view/wxml).

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![gemnasium deps][gemnasium-image]][gemnasium-url]
[![npm download][download-image]][download-url]

[npm-image]: http://img.shields.io/npm/v/rml.svg?style=flat-square
[npm-url]: http://npmjs.org/package/rml
[travis-image]: https://img.shields.io/travis/yiminghe/rml.svg?style=flat-square
[travis-url]: https://travis-ci.org/yiminghe/rml
[coveralls-image]: https://img.shields.io/coveralls/yiminghe/rml.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/yiminghe/rml?branch=master
[gemnasium-image]: http://img.shields.io/gemnasium/yiminghe/rml.svg?style=flat-square
[gemnasium-url]: https://gemnasium.com/yiminghe/rml
[node-image]: https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/rml.svg?style=flat-square
[download-url]: https://npmjs.org/package/rml

## preview

http://yiminghe.github.io/rml/examples/playground.html


```html
<div r:for="{{items}}" r:key="key">
    <div r:if="{{item.value > 1}}" onClick="{{this.onClick}}">
       {{item.value}} more than one
    </div>
</div>
```

## webpack-loader

https://github.com/yiminghe/rml-loader

## syntax

for details checkout: https://github.com/yiminghe/rml/blob/master/tests/specs

### data binding

```
{{x}}
```

### loop

```html
<tag r:for="{{items}}" r:key="key" r:for-item="item" r:for-index="index">
    {{item.value}} at {{index}}
</tag>
```

### condition

```html
<tag r:if="{{x>3}}">
</tag>
<tag r:elif="{{x>2}}">
</tag>
<tag r:else="{{x>1}}">
</tag>
```

### block

will render no actual jsx

```html
<block r:if="{{x>1}}">
    <tag />
</block>
```

### template

```html
<template name="t">
    <div>{{z}}</div> <!-- from data attribute-->
</template>
<div>
    <template is="{{x%2 ? 't' : 'z'}}" data="{{...o}}" />
</div>
```

import

```html
<import src="./a.rml" /> <!-- will define template t and z-->
<div>
    <template is="{{x%2 ? 't' : 'z'}}" data="{{...o}}" />
</div>
```

include

```html
<div>
    <include src="./a.rml" /> <!-- embed-->
</div>
```

## Development

```
npm start
```

http://localhost:8011/examples/playground.html

## Test Case

```
npm test
npm run coverage
```

## License

rml is released under the MIT license.

/* eslint no-console:0 */
/* eslint no-alert:0 */

import { Transformer } from 'rml';
import React from 'react';
import ReactDOM from 'react-dom';

const defaultValue = `
<import-module name="ReactNative" from="react-native" />
<import-module name="{View, X:Y}" from="react-native" />
<View>
  <ReactNative.Text /> {{x.y.z[q + 1]}} {{x}} {{x.y}}
  <Y />
  <div r:for="{{items}}" r:key="key" r:for-index="i">
      <div r:if="{{item.value > 1}}" onClick="{{this.onClick}}">
         {{item.value}} more than one at {{i}}
      </div>
  </div>
</View>
`;

const Page = React.createClass({
  componentDidMount() {
    this.transform();
  },

  transformRml(rml) {
    let ret;
    new Transformer(rml, {
      allowImportModule: true,
      strictDataMember: !!this.refs.strictDataMember.checked,
    }).transform((err, code) => {
      if (err) {
        alert(err);
        console.log(err);
      }
      ret = code;
    });
    return ret;
  },

  transform() {
    const rml = this.refs.rml.value;
    this.setState({
      code: this.transformRml(rml),
    });
  },

  render() {
    return (
      <div style={{ margin: 50 }}>
        <h2>rml</h2>
        <textarea ref="rml" defaultValue={defaultValue} style={{ width: '100%', height: 200 }}/>
        <p>
          <button onClick={this.transform}>transform</button>
          &nbsp;
          <label>strictDataMember:
            <input type="checkbox" ref="strictDataMember" defaultChecked/></label>
        </p>
        <h2>jsx</h2>
        <pre>{this.state && this.state.code}</pre>
      </div>
    );
  },
});

ReactDOM.render(<Page />, document.getElementById('__react-content'));

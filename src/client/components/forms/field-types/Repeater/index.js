import React, { Component } from 'react';
import Section from '../../../layout/Section';

class Repeater extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="field-repeater">
        <Section heading={this.props.label}>
          {this.props.initialValue.map((item, i) =>
            React.Children.map(this.props.children, child =>
              React.cloneElement(child, {
                initialValue: item[child.props.name],
                name: `${this.props.name}[${i}]${child.props.name}`
              })
            )
          )}
        </Section>
      </div>
    )
  }
}

export default Repeater;

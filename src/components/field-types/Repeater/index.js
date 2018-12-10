import React, { Component } from 'react';
import { Section } from 'payload/components';

class Repeater extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="field-repeater">
        <Section heading={this.props.label}>
        </Section>
      </div>
    )
  }
}

export default Repeater;

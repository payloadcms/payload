import React from 'react';
import { Section } from 'payload/components';

const Group = props => {
  return (
    <Section heading={props.label} className="field-group">
      {props.children}
    </Section>
  );
};

export default Group;

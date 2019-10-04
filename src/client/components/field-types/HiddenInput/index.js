import React from 'react';
import { fieldType } from 'payload/components';

const HiddenInput = props => <input type="hidden" value={props.value || ''}
  onChange={props.onChange} id={props.id ? props.id : props.name} name={props.name} />;

export default fieldType(HiddenInput, 'hiddenInput');

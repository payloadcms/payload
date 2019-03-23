import React from 'react';
import { fieldType } from 'payload/components';

import './index.scss';

const error = 'There was a problem uploading your file.';

const validate = () => true;

const File = props => {
  return (
    <div className="props.className" style={{
      width: props.width ? `${props.width}%` : null,
      ...props.style
    }}>
      <input
        value={props.value || ''}
        onChange={props.onChange}
        disabled={props.disabled}
        placeholder={props.placeholder}
        type="text"
        id={props.id ? props.id : props.name}
        name={props.name} />
    </div>
  )
}

export default fieldType(File, 'file', validate, error);

import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import useFieldType from '../../useFieldType';

import './index.scss';

const baseClass = 'editable-block-title';

const EditableBlockTitle = (props) => {
  const { fieldName: name } = props;
  const inputRef = useRef(null);
  const inputCloneRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(0);

  const {
    value,
    setValue,
  } = useFieldType({
    name,
  });

  useEffect(() => {
    setInputWidth(inputCloneRef.current.offsetWidth);
  }, [value]);

  const onKeyDown = (e) => {
    const blurKeys = [13, 27];
    if (blurKeys.indexOf(e.keyCode) !== -1) inputRef.current.blur();
  };

  return (
    <>
      <div className={baseClass}>
        <input
          ref={inputRef}
          id={name}
          value={value || ''}
          placeholder="Untitled"
          type="text"
          name={name}
          onChange={setValue}
          onKeyDown={onKeyDown}
          style={{
            width: `${inputWidth}px`,
          }}
        />
      </div>
      <span
        ref={inputCloneRef}
        className={`${baseClass}__input-clone`}
      >
        {value || 'Untitled'}
      </span>
    </>
  );
};

EditableBlockTitle.propTypes = {
  fieldName: PropTypes.string.isRequired,
};

export default EditableBlockTitle;

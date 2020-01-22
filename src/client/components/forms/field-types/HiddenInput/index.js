import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';

const HiddenInput = (props) => {
  const {
    name,
    required,
    defaultValue,
    valueOverride,
  } = props;

  const { value, onChange } = useFieldType({
    name,
    required,
    defaultValue,
    valueOverride,
  });

  return (
    <input
      type="hidden"
      value={value || ''}
      onChange={onChange}
      id={name}
      name={name}
    />
  );
};

HiddenInput.defaultProps = {
  required: false,
  defaultValue: null,
  valueOverride: null,
};

HiddenInput.propTypes = {
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  defaultValue: PropTypes.string,
  valueOverride: PropTypes.string,
};

export default HiddenInput;

import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';

const HiddenInput = (props) => {
  const {
    path,
    required,
    defaultValue,
  } = props;

  const { value, onChange } = useFieldType({
    path,
    required,
    defaultValue,
  });

  return (
    <input
      type="hidden"
      value={value || ''}
      onChange={onChange}
      id={path}
      name={path}
    />
  );
};

HiddenInput.defaultProps = {
  required: false,
  defaultValue: null,
};

HiddenInput.propTypes = {
  path: PropTypes.string.isRequired,
  required: PropTypes.bool,
  defaultValue: PropTypes.string,
};

export default withCondition(HiddenInput);

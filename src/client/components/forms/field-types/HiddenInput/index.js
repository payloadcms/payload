import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';

const HiddenInput = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    defaultValue,
  } = props;

  const path = pathFromProps || name;

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
  path: '',
};

HiddenInput.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  defaultValue: PropTypes.string,
};

export default withCondition(HiddenInput);

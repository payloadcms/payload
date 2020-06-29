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
    initialData,
  } = props;

  const path = pathFromProps || name;

  const { value, setValue } = useFieldType({
    path,
    required,
    initialData,
    defaultValue,
  });

  return (
    <input
      type="hidden"
      value={value || ''}
      onChange={setValue}
      name={path}
    />
  );
};

HiddenInput.defaultProps = {
  required: false,
  defaultValue: undefined,
  initialData: undefined,
  path: '',
};

HiddenInput.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  defaultValue: PropTypes.string,
  initialData: PropTypes.string,
};

export default withCondition(HiddenInput);

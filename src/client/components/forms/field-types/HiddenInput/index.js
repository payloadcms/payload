import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';

const HiddenInput = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
  } = props;

  const path = pathFromProps || name;

  const { value, setValue } = useFieldType({
    path,
    required,
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
  path: '',
};

HiddenInput.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
};

export default withCondition(HiddenInput);

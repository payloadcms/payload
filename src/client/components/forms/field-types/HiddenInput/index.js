import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';

const HiddenInput = (props) => {
  const {
    name,
    path: pathFromProps,
    value: valueFromProps,
  } = props;

  const path = pathFromProps || name;

  const { value, setValue } = useFieldType({
    path,
  });

  useEffect(() => {
    if (valueFromProps !== undefined) {
      setValue(valueFromProps);
    }
  }, [valueFromProps, setValue]);

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
  path: '',
  value: undefined,
};

HiddenInput.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  value: PropTypes.string,
};

export default withCondition(HiddenInput);

import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import FormProvider from '../FormProvider';
import { useFormFields } from '../FormProvider/context';
import useDebounce from '../../../hooks/useDebounce';

const SendValue = ({ sendValuesToParent }) => {
  const { getFields } = useFormFields();
  const fields = getFields();

  const debouncedFields = useDebounce(fields, 500);

  useEffect(() => {
    sendValuesToParent(debouncedFields);
  }, [sendValuesToParent, debouncedFields]);

  return null;
};

const SubForm = (props) => {
  const { path: pathFromProps, name, children } = props;
  const path = pathFromProps || name;

  const { dispatchFields } = useFormFields();

  const sendValuesToParent = useCallback((fields) => {
    dispatchFields({ type: 'REPLACE_ALL_BY_PATH', value: fields, path });
  }, [dispatchFields, path]);

  return (
    <FormProvider>
      {children}
      <SendValue sendValuesToParent={sendValuesToParent} />
    </FormProvider>
  );
};

SubForm.defaultProps = {
  path: '',
};

SubForm.propTypes = {
  path: PropTypes.string,
  name: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default SubForm;

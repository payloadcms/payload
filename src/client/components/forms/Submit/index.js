import React from 'react';
import PropTypes from 'prop-types';
import { useForm, useFormProcessing } from '../Form/context';
import Button from '../../elements/Button';

import './index.scss';

const baseClass = 'form-submit';

const FormSubmit = ({ children }) => {
  const processing = useFormProcessing();
  const { disabled } = useForm();

  return (
    <div className={baseClass}>
      <Button
        type="submit"
        disabled={processing || disabled ? true : undefined}
      >
        {children}
      </Button>
    </div>
  );
};

FormSubmit.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export default FormSubmit;

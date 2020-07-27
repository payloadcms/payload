import React from 'react';
import PropTypes from 'prop-types';
import { useFormProcessing } from '../Form/context';
import Button from '../../elements/Button';

import './index.scss';

const baseClass = 'form-submit';

const FormSubmit = ({ children }) => {
  const processing = useFormProcessing();

  return (
    <div className={baseClass}>
      <Button
        type="submit"
        disabled={processing ? true : undefined}
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

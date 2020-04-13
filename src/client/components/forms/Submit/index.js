import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import FormContext from '../Form/Context';
import Button from '../../controls/Button';

import './index.scss';

const baseClass = 'form-submit';

const FormSubmit = ({ children }) => {
  const formContext = useContext(FormContext);
  return (
    <div className={baseClass}>
      <Button
        disabled={formContext.processing ? true : undefined}
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

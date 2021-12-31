import React from 'react';
import { useForm, useFormProcessing } from '../Form/context';
import Button from '../../elements/Button';
import { Props } from '../../elements/Button/types';

import './index.scss';

const baseClass = 'form-submit';

const FormSubmit: React.FC<Props> = ({ children, type = 'submit', disabled: disabledFromProps, buttonStyle }) => {
  const processing = useFormProcessing();
  const { disabled } = useForm();

  return (
    <div className={baseClass}>
      <Button
        type={type}
        buttonStyle={buttonStyle}
        disabled={disabledFromProps || processing || disabled ? true : undefined}
      >
        {children}
      </Button>
    </div>
  );
};

export default FormSubmit;

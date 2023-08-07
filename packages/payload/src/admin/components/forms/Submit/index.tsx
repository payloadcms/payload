import React from 'react';
import { useForm, useFormProcessing } from '../Form/context';
import Button from '../../elements/Button';
import { Props } from '../../elements/Button/types';

import './index.scss';

const baseClass = 'form-submit';

const FormSubmit: React.FC<Props> = (props) => {
  const { children, buttonId: id, disabled: disabledFromProps, type = 'submit' } = props;
  const processing = useFormProcessing();
  const { disabled } = useForm();

  return (
    <div className={baseClass}>
      <Button
        {...props}
        id={id}
        type={type}
        disabled={disabledFromProps || processing || disabled ? true : undefined}
      >
        {children}
      </Button>
    </div>
  );
};

export default FormSubmit;

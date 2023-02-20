import React, { forwardRef } from 'react';
import { useForm, useFormProcessing } from '../Form/context';
import Button from '../../elements/Button';
import { Props } from '../../elements/Button/types';

import './index.scss';

const baseClass = 'form-submit';

const FormSubmit = forwardRef<HTMLButtonElement, Props>((props, ref) => {
  const { children, buttonId: id, disabled: disabledFromProps, type = 'submit' } = props;
  const processing = useFormProcessing();
  const { disabled } = useForm();
  const canSave = !(disabledFromProps || processing || disabled);

  return (
    <div className={baseClass}>
      <Button
        ref={ref}
        {...props}
        id={id}
        type={type}
        disabled={canSave ? undefined : true}
      >
        {children}
      </Button>
    </div>
  );
});

export default FormSubmit;

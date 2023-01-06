import React from 'react';
import { useForm, useFormProcessing } from '../Form/context';
import useHotkey from '../../../hooks/useHotkey';
import Button from '../../elements/Button';
import { Props } from '../../elements/Button/types';

import './index.scss';

const baseClass = 'form-submit';

const FormSubmit: React.FC<Props> = (props) => {
  const { children, buttonId: id, disabled: disabledFromProps, type = 'submit' } = props;
  const processing = useFormProcessing();
  const { disabled, submit } = useForm();
  const canSave = !(disabledFromProps || processing || disabled)

  // Hotkeys
  useHotkey({ keyCodes: ['s'], cmdCtrlKey: true }, (e) => {
    e.preventDefault();
    if (canSave) {
      submit({}, e)
    }
  });

  return (
    <div className={baseClass}>
      <Button
        {...props}
        id={id}
        type={type}
        disabled={canSave ? undefined : true}
      >
        {children}
      </Button>
    </div>
  );
};

export default FormSubmit;

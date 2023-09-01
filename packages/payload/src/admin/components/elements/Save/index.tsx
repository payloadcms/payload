import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import useHotkey from '../../../hooks/useHotkey';
import { useForm } from '../../forms/Form/context';
import FormSubmit from '../../forms/Submit';
import { useEditDepth } from '../../utilities/EditDepth';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';

export type CustomSaveButtonProps = React.ComponentType<DefaultSaveButtonProps & {
  DefaultButton: React.ComponentType<DefaultSaveButtonProps>;
}>
type DefaultSaveButtonProps = {
  label: string;
  save: () => void;
};

const DefaultSaveButton: React.FC<DefaultSaveButtonProps> = ({ label, save }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const editDepth = useEditDepth();

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (ref?.current) {
      ref.current.click();
    }
  });

  return (
    <FormSubmit
      buttonId="action-save"
      onClick={save}
      ref={ref}
      type="button"
    >
      {label}
    </FormSubmit>
  );
};

type Props = {
  CustomComponent?: CustomSaveButtonProps;
}
export const Save: React.FC<Props> = ({ CustomComponent }) => {
  const { t } = useTranslation('general');
  const { submit } = useForm();

  return (
    <RenderCustomComponent
      componentProps={{
        DefaultButton: DefaultSaveButton,
        label: t('save'),
        save: submit,
      }}
      CustomComponent={CustomComponent}
      DefaultComponent={DefaultSaveButton}
    />
  );
};

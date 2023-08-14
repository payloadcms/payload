import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FormSubmit from '../../forms/Submit';
import useHotkey from '../../../hooks/useHotkey';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import { useEditDepth } from '../../utilities/EditDepth';
import { useForm } from '../../forms/Form/context';

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

  useHotkey({ keyCodes: ['s'], cmdCtrlKey: true, editDepth }, (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (ref?.current) {
      ref.current.click();
    }
  });

  return (
    <FormSubmit
      type="button"
      buttonId="action-save"
      onClick={save}
      ref={ref}
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
      CustomComponent={CustomComponent}
      DefaultComponent={DefaultSaveButton}
      componentProps={{
        save: submit,
        label: t('save'),
        DefaultButton: DefaultSaveButton,
      }}
    />
  );
};

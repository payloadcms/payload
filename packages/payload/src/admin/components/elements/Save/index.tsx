import React from 'react';
import { useTranslation } from 'react-i18next';
import FormSubmit from '../../forms/Submit';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import { useForm } from '../../forms/Form/context';

export type CustomSaveButtonProps = React.ComponentType<DefaultSaveButtonProps & {
  DefaultButton: React.ComponentType<DefaultSaveButtonProps>;
}>
type DefaultSaveButtonProps = {
  label: string;
  save: () => void;
};
const DefaultSaveButton: React.FC<DefaultSaveButtonProps> = ({ label, save }) => {
  return (
    <FormSubmit
      type="button"
      buttonId="action-save"
      onClick={save}
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

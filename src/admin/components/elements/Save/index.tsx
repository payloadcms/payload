import React from 'react';
import { useTranslation } from 'react-i18next';
import FormSubmit from '../../forms/Submit';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';

export type CustomSaveButtonProps = React.ComponentType<DefaultSaveButtonProps & {
  DefaultButton: React.ComponentType<DefaultSaveButtonProps>;
}>
type DefaultSaveButtonProps = {
  label: string;
};
const DefaultSaveButton: React.FC<DefaultSaveButtonProps> = ({ label }) => {
  return (
    <FormSubmit buttonId="action-save">{label}</FormSubmit>
  );
};

type Props = {
  CustomComponent?: CustomSaveButtonProps;
}
export const Save: React.FC<Props> = ({ CustomComponent }) => {
  const { t } = useTranslation('general');

  return (
    <RenderCustomComponent
      CustomComponent={CustomComponent}
      DefaultComponent={DefaultSaveButton}
      componentProps={{
        label: t('save'),
        DefaultButton: DefaultSaveButton,
      }}
    />
  );
};

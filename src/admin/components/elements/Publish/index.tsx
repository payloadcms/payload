import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import FormSubmit from '../../forms/Submit';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { useForm, useFormModified } from '../../forms/Form/context';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';

export type CustomPublishButtonProps = React.ComponentType<DefaultPublishButtonProps & {
  DefaultButton: React.ComponentType<DefaultPublishButtonProps>;
}>
export type DefaultPublishButtonProps = {
  publish: () => void;
  disabled: boolean;
  label: string;
};
const DefaultPublishButton: React.FC<DefaultPublishButtonProps> = ({ disabled, publish, label }) => {
  return (
    <FormSubmit
      type="button"
      onClick={publish}
      disabled={disabled}
    >
      {label}
    </FormSubmit>
  );
};

type Props = {
  CustomComponent?: CustomPublishButtonProps
}
export const Publish: React.FC<Props> = ({ CustomComponent }) => {
  const { unpublishedVersions, publishedDoc } = useDocumentInfo();
  const { submit } = useForm();
  const modified = useFormModified();
  const { t } = useTranslation('version');

  const hasNewerVersions = unpublishedVersions?.totalDocs > 0;
  const canPublish = modified || hasNewerVersions || !publishedDoc;

  const publish = useCallback(() => {
    submit({
      overrides: {
        _status: 'published',
      },
    });
  }, [submit]);

  return (
    <RenderCustomComponent
      CustomComponent={CustomComponent}
      DefaultComponent={DefaultPublishButton}
      componentProps={{
        publish,
        disabled: !canPublish,
        label: t('publishChanges'),
        DefaultButton: DefaultPublishButton,
      }}
    />
  );
};

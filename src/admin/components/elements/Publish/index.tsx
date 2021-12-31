import React, { useCallback } from 'react';
import FormSubmit from '../../forms/Submit';
import { Props } from './types';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { useForm, useFormModified } from '../../forms/Form/context';

const Publish: React.FC<Props> = () => {
  const { unpublishedVersions, publishedDoc, getVersions } = useDocumentInfo();
  const { submit } = useForm();
  const modified = useFormModified();

  const hasNewerVersions = unpublishedVersions?.totalDocs > 0;
  const canPublish = modified || hasNewerVersions || !publishedDoc;

  const publish = useCallback(async () => {
    await submit({
      overrides: {
        _status: 'published',
      },
    });
    getVersions();
  }, [submit, getVersions]);

  return (
    <FormSubmit
      type="button"
      onClick={publish}
      disabled={!canPublish}
    >
      Publish changes
    </FormSubmit>
  );
};

export default Publish;

import React from 'react';
import FormSubmit from '../../../../forms/Submit';
import { Props } from './types';
import { useDocumentInfo } from '../../../../utilities/DocumentInfo';

const Publish: React.FC<Props> = () => {
  const { unpublishedVersions, publishedDoc } = useDocumentInfo();
  const hasNewerVersions = unpublishedVersions?.totalDocs > 0;

  const canPublish = hasNewerVersions || !publishedDoc;

  return (
    <FormSubmit
      type="button"
      disabled={!canPublish}
    >
      {canPublish === true && (
        <React.Fragment>
          Publish changes
        </React.Fragment>
      )}
    </FormSubmit>
  );
};

export default Publish;

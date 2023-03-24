import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import FormSubmit from '../../forms/Submit';
import { Props } from './types';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { useForm, useFormModified, useWatchForm } from '../../forms/Form/context';

// --- imported
import { publishButton } from '../../forms/Form/compareStates';
// --- by eustachio

const Publish: React.FC<Props> = () => {
  const { unpublishedVersions, publishedDoc } = useDocumentInfo();
  const { submit } = useForm();
  const modified = useFormModified();
  const { t } = useTranslation('version');
  
  // --- line added
  const { getFields } = useWatchForm();
  // --- by eustachio

  const hasNewerVersions = unpublishedVersions?.totalDocs > 0;
  // --- modified
  // original code // const canPublish = stateHasChanged(getFields()) || modified || hasNewerVersions || !publishedDoc;
  const canPublish = () => {
    if (publishButton(getFields()) === false) {
      return false;
    }
    else {
      if (modified || hasNewerVersions || !publishedDoc) {
        return true;
      }
    }
  }
  // --- by eustachio
  
  
  const publish = useCallback(() => {
    submit({
      overrides: {
        _status: 'published',
      },
    });
  }, [submit]);

  return (
    <FormSubmit
      type="button"
      onClick={publish}
      disabled={!canPublish()}
    >
      {t('publishChanges')}
    </FormSubmit>
  );
};

export default Publish;
import React, { useCallback } from 'react';
import { useConfig } from '@payloadcms/config-provider';
import FormSubmit from '../../forms/Submit';
import { useForm, useFormModified } from '../../forms/Form/context';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { useLocale } from '../../utilities/Locale';

import './index.scss';

const baseClass = 'save-draft';

const SaveDraft: React.FC = () => {
  const { serverURL, routes: { api } } = useConfig();
  const { submit } = useForm();
  const { collection, global, id, getVersions } = useDocumentInfo();
  const modified = useFormModified();
  const locale = useLocale();

  const canSaveDraft = modified;

  console.log({ modified });

  const saveDraft = useCallback(() => {
    const search = `?locale=${locale}&depth=0&fallback-locale=null&draft=true`;
    let action;
    let method = 'POST';

    if (collection) {
      action = `${serverURL}${api}/${collection.slug}${id ? `/${id}` : ''}${search}`;
      if (id) method = 'PUT';
    }

    if (global) {
      action = `${serverURL}${api}/globals/${global.slug}${search}`;
    }

    submit({
      action,
      method,
      overrides: {
        _status: 'draft',
      },
    });

    getVersions();
  }, [submit, collection, global, serverURL, api, locale, id, getVersions]);

  return (
    <FormSubmit
      className={baseClass}
      type="button"
      buttonStyle="secondary"
      onClick={saveDraft}
      disabled={!canSaveDraft}
    >
      Save draft
    </FormSubmit>
  );
};

export default SaveDraft;

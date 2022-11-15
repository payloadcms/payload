import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import FormSubmit from '../../forms/Submit';
import { useForm, useFormModified } from '../../forms/Form/context';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { useLocale } from '../../utilities/Locale';

import './index.scss';

const baseClass = 'save-draft';

const SaveDraft: React.FC = () => {
  const { serverURL, routes: { api } } = useConfig();
  const { submit } = useForm();
  const { collection, global, id } = useDocumentInfo();
  const modified = useFormModified();
  const locale = useLocale();
  const { t } = useTranslation('version');

  const canSaveDraft = modified;

  const saveDraft = useCallback(() => {
    const search = `?locale=${locale}&depth=0&fallback-locale=null&draft=true`;
    let action;
    let method = 'POST';

    if (collection) {
      action = `${serverURL}${api}/${collection.slug}${id ? `/${id}` : ''}${search}`;
      if (id) method = 'PATCH';
    }

    if (global) {
      action = `${serverURL}${api}/globals/${global.slug}${search}`;
    }

    submit({
      action,
      method,
      skipValidation: true,
      overrides: {
        _status: 'draft',
      },
    });
  }, [submit, collection, global, serverURL, api, locale, id]);

  return (
    <FormSubmit
      className={baseClass}
      type="button"
      buttonStyle="secondary"
      onClick={saveDraft}
      disabled={!canSaveDraft}
    >
      {t('saveDraft')}
    </FormSubmit>
  );
};

export default SaveDraft;

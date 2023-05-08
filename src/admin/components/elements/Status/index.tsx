import React, { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { Modal, useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import { Props } from './types';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import Button from '../Button';
import { MinimalTemplate } from '../..';
import { requests } from '../../../api';
import { useForm } from '../../forms/Form/context';
import { Field } from '../../../../fields/config/types';
import { useLocale } from '../../utilities/Locale';

import './index.scss';

const baseClass = 'status';

const Status: React.FC<Props> = () => {
  const {
    publishedDoc,
    unpublishedVersions,
    collection,
    global,
    id,
    getVersions,
    docPermissions,
  } = useDocumentInfo();
  const { toggleModal } = useModal();
  const {
    serverURL,
    routes: { api },
  } = useConfig();
  const [processing, setProcessing] = useState(false);
  const { reset: resetForm } = useForm();
  const locale = useLocale();
  const { t, i18n } = useTranslation('version');

  const unPublishModalSlug = `confirm-un-publish-${id}`;
  const revertModalSlug = `confirm-revert-${id}`;

  let statusToRender;

  if (unpublishedVersions?.docs?.length > 0 && publishedDoc) {
    statusToRender = 'changed';
  } else if (!publishedDoc) {
    statusToRender = 'draft';
  } else if (publishedDoc && unpublishedVersions?.docs?.length <= 1) {
    statusToRender = 'published';
  }

  const performAction = useCallback(async (action: 'revert' | 'unpublish') => {
    let url;
    let method;
    let body;

    setProcessing(true);

    if (action === 'unpublish') {
      body = {
        _status: 'draft',
      };
    }

    if (action === 'revert') {
      body = publishedDoc;
    }

    if (collection) {
      url = `${serverURL}${api}/${collection.slug}/${id}?depth=0&locale=${locale}&fallback-locale=null`;
      method = 'patch';
    }
    if (global) {
      url = `${serverURL}${api}/globals/${global.slug}?depth=0&locale=${locale}&fallback-locale=null`;
      method = 'post';
    }

    const res = await requests[method](url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': i18n.language,
      },
      body: JSON.stringify(body),
    });

    if (res.status === 200) {
      let data;
      let fields: Field[];
      const json = await res.json();

      if (global) {
        data = json.result;
        fields = global.fields;
      }

      if (collection) {
        data = json.doc;
        fields = collection.fields;
      }

      resetForm(fields, data);
      toast.success(json.message);
      getVersions();
    } else {
      toast.error(t('error:unPublishingDocument'));
    }

    setProcessing(false);
    if (action === 'revert') {
      toggleModal(revertModalSlug);
    }

    if (action === 'unpublish') {
      toggleModal(unPublishModalSlug);
    }
  }, [collection, global, publishedDoc, serverURL, api, id, i18n, locale, resetForm, getVersions, t, toggleModal, revertModalSlug, unPublishModalSlug]);

  const canUpdate = docPermissions?.update?.permission;

  if (statusToRender) {
    return (
      <div className={baseClass}>
        <div className={`${baseClass}__value-wrap`}>
          <span className={`${baseClass}__value`}>{t(statusToRender)}</span>
          {canUpdate && statusToRender === 'published' && (
            <React.Fragment>
              &nbsp;&mdash;&nbsp;
              <Button
                onClick={() => toggleModal(unPublishModalSlug)}
                className={`${baseClass}__action`}
                buttonStyle="none"
              >
                {t('unpublish')}
              </Button>
              <Modal
                slug={unPublishModalSlug}
                className={`${baseClass}__modal`}
              >
                <MinimalTemplate className={`${baseClass}__modal-template`}>
                  <h1>{t('confirmUnpublish')}</h1>
                  <p>{t('aboutToUnpublish')}</p>
                  <Button
                    buttonStyle="secondary"
                    type="button"
                    onClick={processing ? undefined : () => toggleModal(unPublishModalSlug)}
                  >
                    {t('general:cancel')}
                  </Button>
                  <Button
                    onClick={processing ? undefined : () => performAction('unpublish')}
                  >
                    {t(processing ? 'unpublishing' : 'general:confirm')}
                  </Button>
                </MinimalTemplate>
              </Modal>
            </React.Fragment>
          )}
          {canUpdate && statusToRender === 'changed' && (
            <React.Fragment>
              &nbsp;&mdash;&nbsp;
              <Button
                onClick={() => toggleModal(revertModalSlug)}
                className={`${baseClass}__action`}
                buttonStyle="none"
              >
                {t('revertToPublished')}
              </Button>
              <Modal
                slug={revertModalSlug}
                className={`${baseClass}__modal`}
              >
                <MinimalTemplate className={`${baseClass}__modal-template`}>
                  <h1>{t('confirmRevertToSaved')}</h1>
                  <p>{t('aboutToRevertToPublished')}</p>
                  <Button
                    buttonStyle="secondary"
                    type="button"
                    onClick={processing ? undefined : () => toggleModal(revertModalSlug)}
                  >
                    {t('general:cancel')}
                  </Button>
                  <Button
                    onClick={processing ? undefined : () => performAction('revert')}
                  >
                    {t(processing ? 'reverting' : 'general:confirm')}
                  </Button>
                </MinimalTemplate>
              </Modal>
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default Status;

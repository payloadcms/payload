import React, { useCallback, useState } from 'react';
import { useConfig } from '@payloadcms/config-provider';
import { toast } from 'react-toastify';
import { Modal, useModal } from '@faceless-ui/modal';
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

const unPublishModalSlug = 'confirm-un-publish';
const revertModalSlug = 'confirm-revert';

const Status: React.FC<Props> = () => {
  const { publishedDoc, unpublishedVersions, collection, global, id, getVersions } = useDocumentInfo();
  const { toggle, closeAll: closeAllModals } = useModal();
  const { serverURL, routes: { api } } = useConfig();
  const [processing, setProcessing] = useState(false);
  const { reset: resetForm } = useForm();
  const locale = useLocale();

  let statusToRender;

  if (unpublishedVersions?.docs?.length > 0 && publishedDoc) {
    statusToRender = 'Changed';
  } else if (!publishedDoc) {
    statusToRender = 'Draft';
  } else if (publishedDoc && unpublishedVersions?.docs?.length <= 1) {
    statusToRender = 'Published';
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
      method = 'put';
    }
    if (global) {
      url = `${serverURL}${api}/globals/${global.slug}?depth=0&locale=${locale}&fallback-locale=null`;
      method = 'post';
    }

    const res = await requests[method](url, {
      headers: {
        'Content-Type': 'application/json',
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
      toast.error('There was a problem while un-publishing this document.');
    }

    setProcessing(false);
    closeAllModals();
  }, [closeAllModals, collection, global, serverURL, api, resetForm, id, locale, getVersions, publishedDoc]);

  if (statusToRender) {
    return (
      <div className={baseClass}>
        <div className={`${baseClass}__value-wrap`}>
          <span className={`${baseClass}__value`}>{statusToRender}</span>
          {statusToRender === 'Published' && (
            <React.Fragment>
              &nbsp;&mdash;&nbsp;
              <Button
                onClick={() => toggle(unPublishModalSlug)}
                className={`${baseClass}__action`}
                buttonStyle="none"
              >
                Unpublish
              </Button>
              <Modal
                slug={unPublishModalSlug}
                className={`${baseClass}__modal`}
              >
                <MinimalTemplate>
                  <h1>Confirm unpublish</h1>
                  <p>You are about to unpublish this document. Are you sure?</p>
                  <Button
                    buttonStyle="secondary"
                    type="button"
                    onClick={processing ? undefined : () => toggle(unPublishModalSlug)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={processing ? undefined : () => performAction('unpublish')}
                  >
                    {processing ? 'Unpublishing...' : 'Confirm'}
                  </Button>
                </MinimalTemplate>
              </Modal>
            </React.Fragment>
          )}
          {statusToRender === 'Changed' && (
            <React.Fragment>
              &nbsp;&mdash;&nbsp;
              <Button
                onClick={() => toggle(revertModalSlug)}
                className={`${baseClass}__action`}
                buttonStyle="none"
              >
                Revert to published
              </Button>
              <Modal
                slug={revertModalSlug}
                className={`${baseClass}__modal`}
              >
                <MinimalTemplate>
                  <h1>Confirm revert to saved</h1>
                  <p>You are about to revert this document&apos;s changes to its published state. Are you sure?</p>
                  <Button
                    buttonStyle="secondary"
                    type="button"
                    onClick={processing ? undefined : () => toggle(revertModalSlug)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={processing ? undefined : () => performAction('revert')}
                  >
                    {processing ? 'Reverting...' : 'Confirm'}
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

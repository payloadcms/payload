import React, { Fragment, useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { Modal, useModal } from '@faceless-ui/modal';
import { useConfig } from '@payloadcms/config-provider';
import { useHistory } from 'react-router-dom';
import { Button, MinimalTemplate, Pill } from '../../..';
import { Props } from './types';
import { requests } from '../../../../api';

import './index.scss';

const baseClass = 'restore-revision';
const modalSlug = 'restore-revision';

const Restore: React.FC<Props> = ({ collection, global, className, revisionID, originalDocID, revisionDate }) => {
  const { serverURL, routes: { api, admin } } = useConfig();
  const history = useHistory();
  const { toggle } = useModal();
  const [processing, setProcessing] = useState(false);

  let fetchURL = `${serverURL}${api}`;
  let redirectURL = `${serverURL}${admin}`;
  let restoreMessage: string;

  if (collection) {
    fetchURL += `/${collection.slug}/revisions/${revisionID}`;
    redirectURL += `/collections/${collection.slug}/${originalDocID}`;
    restoreMessage = `You are about to restore this ${collection.labels.singular} document to the state that it was in on ${revisionDate}.`;
  }

  if (global) {
    fetchURL += `/globals/${global.slug}/revisions/${revisionID}`;
    redirectURL += `/globals/${global.slug}`;
    restoreMessage = `You are about to restore the global ${global.label} to the state that it was in on ${revisionDate}.`;
  }

  const handleRestore = useCallback(async () => {
    setProcessing(true);

    const res = await requests.post(fetchURL);

    if (res.status === 200) {
      const json = await res.json();
      history.push({
        pathname: redirectURL,
        state: {
          status: {
            message: json.message,
          },
        },
      });
    } else {
      toast.error('There was a problem while restoring this revision.');
    }
  }, [history, fetchURL, redirectURL]);

  return (
    <Fragment>
      <Pill
        onClick={() => toggle(modalSlug)}
        className={[baseClass, className].filter(Boolean).join(' ')}
      >
        Restore this revision
      </Pill>
      <Modal
        slug={modalSlug}
        className={`${baseClass}__modal`}
      >
        <MinimalTemplate>
          <h1>Confirm revision restoration</h1>
          <p>{restoreMessage}</p>
          <Button
            buttonStyle="secondary"
            type="button"
            onClick={processing ? undefined : () => toggle(modalSlug)}
          >
            Cancel
          </Button>
          <Button
            onClick={processing ? undefined : handleRestore}
          >
            {processing ? 'Restoring...' : 'Confirm'}
          </Button>
        </MinimalTemplate>
      </Modal>
    </Fragment>
  );
};

export default Restore;

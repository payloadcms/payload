import React, { Fragment, useCallback, useState } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { useConfig } from '@payloadcms/config-provider';
import { Button, MinimalTemplate, Pill } from '../../..';
import { Props } from './types';
import { requests } from '../../../../api';

import './index.scss';

const baseClass = 'restore-revision';
const modalSlug = 'restore-revision';

const Restore: React.FC<Props> = ({ collection, global, className }) => {
  const { serverURL, routes: { api } } = useConfig();
  const { toggle } = useModal();
  const [processing, setProcessing] = useState(false);

  const handleRestore = useCallback(async () => {
    console.log(collection, global);
    setProcessing(true);

    // await requests.post(``)
  }, [collection, global]);

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
          <p>
            You are about to restore this document. Are you sure?
          </p>
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

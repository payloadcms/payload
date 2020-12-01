import React from 'react';
import { toast } from 'react-toastify';
import { Modal, useModal } from '@faceless-ui/modal';
import Button from '../Button';
import MinimalTemplate from '../../templates/Minimal';
import { Props } from './types';

import './index.scss';

const baseClass = 'generate-confirmation';

const GenerateConfirmation: React.FC<Props> = (props) => {
  const {
    setKey,
    highlightField,
  } = props;

  const { toggle } = useModal();

  const modalSlug = 'generate-confirmation';

  const handleGenerate = () => {
    setKey();
    toggle(modalSlug);
    toast.success('New API Key Generated.', { autoClose: 3000 });
    highlightField(true);
  };

  return (
    <React.Fragment>
      <Button
        size="small"
        buttonStyle="secondary"
        onClick={() => {
          toggle(modalSlug);
        }}
      >
        Generate new API key
      </Button>
      <Modal
        slug={modalSlug}
        className={baseClass}
      >
        <MinimalTemplate>
          <h1>Confirm Generation</h1>
          <p>
            Generating a new API key will
            {' '}
            <strong>invalidate</strong>
            {' '}
            the previous key.
            {' '}
            Are you sure you wish to continue?
          </p>

          <Button
            buttonStyle="secondary"
            type="button"
            onClick={() => {
              toggle(modalSlug);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
          >
            Generate
          </Button>
        </MinimalTemplate>
      </Modal>
    </React.Fragment>
  );
};

export default GenerateConfirmation;

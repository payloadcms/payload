import React from 'react';
import { toast } from 'react-toastify';
import { Modal, useModal } from '@faceless-ui/modal';
import Button from '../Button';
import MinimalTemplate from '../../templates/Minimal';
import { Props } from './types';
import { useDocumentInfo } from '../../utilities/DocumentInfo';

import './index.scss';

const baseClass = 'generate-confirmation';

const GenerateConfirmation: React.FC<Props> = (props) => {
  const {
    setKey,
    highlightField,
  } = props;

  const { id } = useDocumentInfo();
  const { toggleModal } = useModal();

  const modalSlug = `generate-confirmation-${id}`;

  const handleGenerate = () => {
    setKey();
    toggleModal(modalSlug);
    toast.success('New API Key Generated.', { autoClose: 3000 });
    highlightField(true);
  };

  return (
    <React.Fragment>
      <Button
        size="small"
        buttonStyle="secondary"
        onClick={() => {
          toggleModal(modalSlug);
        }}
      >
        Generate new API key
      </Button>
      <Modal
        slug={modalSlug}
        className={baseClass}
      >
        <MinimalTemplate className={`${baseClass}__template`}>
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
              toggleModal(modalSlug);
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

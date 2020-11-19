import React from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { Modal, useModal } from '@faceless-ui/modal';
import Button from '../Button';
import MinimalTemplate from '../../templates/Minimal';

import './index.scss';

const baseClass = 'generate-confirmation';

const GenerateConfirmation = (props) => {
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
        slug={modalSlug}
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

GenerateConfirmation.propTypes = {
  setKey: PropTypes.func.isRequired,
  highlightField: PropTypes.func.isRequired,
};

export default GenerateConfirmation;

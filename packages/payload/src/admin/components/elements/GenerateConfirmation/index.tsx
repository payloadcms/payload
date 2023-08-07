import React from 'react';
import { toast } from 'react-toastify';
import { Modal, useModal } from '@faceless-ui/modal';
import { Trans, useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('authentication');

  const modalSlug = `generate-confirmation-${id}`;

  const handleGenerate = () => {
    setKey();
    toggleModal(modalSlug);
    toast.success(t('newAPIKeyGenerated'), { autoClose: 3000 });
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
        {t('generateNewAPIKey')}
      </Button>
      <Modal
        slug={modalSlug}
        className={baseClass}
      >
        <MinimalTemplate className={`${baseClass}__template`}>
          <h1>{t('confirmGeneration')}</h1>
          <p>
            <Trans
              i18nKey="generatingNewAPIKeyWillInvalidate"
              t={t}
            >
              generatingNewAPIKeyWillInvalidate
              <strong>invalidate</strong>
            </Trans>
          </p>

          <Button
            buttonStyle="secondary"
            type="button"
            onClick={() => {
              toggleModal(modalSlug);
            }}
          >
            {t('general:cancel')}
          </Button>
          <Button
            onClick={handleGenerate}
          >
            {t('generate')}
          </Button>
        </MinimalTemplate>
      </Modal>
    </React.Fragment>
  );
};

export default GenerateConfirmation;

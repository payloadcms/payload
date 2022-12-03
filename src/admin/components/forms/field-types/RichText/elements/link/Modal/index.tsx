import { Modal } from '@faceless-ui/modal';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MinimalTemplate } from '../../../../../..';
import Button from '../../../../../../elements/Button';
import X from '../../../../../../icons/X';
import Form from '../../../../../Form';
import FormSubmit from '../../../../../Submit';
import { Props } from './types';
import fieldTypes from '../../../..';
import RenderFields from '../../../../../RenderFields';

import './index.scss';

const baseClass = 'rich-text-link-edit-modal';

export const EditModal: React.FC<Props> = ({
  close,
  handleModalSubmit,
  initialState,
  fieldSchema,
  modalSlug,
}) => {
  const { t } = useTranslation('fields');

  return (
    <Modal
      slug={modalSlug}
      className={baseClass}
    >
      <MinimalTemplate className={`${baseClass}__template`}>
        <header className={`${baseClass}__header`}>
          <h3>{t('editLink')}</h3>
          <Button
            buttonStyle="none"
            onClick={close}
          >
            <X />
          </Button>
        </header>
        <Form
          onSubmit={handleModalSubmit}
          initialState={initialState}
        >
          <RenderFields
            fieldTypes={fieldTypes}
            readOnly={false}
            fieldSchema={fieldSchema}
            forceRender
          />
          <FormSubmit>
            {t('general:submit')}
          </FormSubmit>
        </Form>
      </MinimalTemplate>
    </Modal>
  );
};

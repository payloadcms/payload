import { Modal } from '@faceless-ui/modal';
import React from 'react';
import { MinimalTemplate } from '../../../../../..';
import Button from '../../../../../../elements/Button';
import X from '../../../../../../icons/X';
import Form from '../../../../../Form';
import FormSubmit from '../../../../../Submit';
import { Props } from './types';
import { modalSlug } from '../shared';
import fieldTypes from '../../../..';
import RenderFields from '../../../../../RenderFields';

import './index.scss';

const baseClass = modalSlug;

export const EditModal: React.FC<Props> = ({
  close,
  handleModalSubmit,
  initialState,
  fieldSchema,
}) => {
  return (
    <Modal
      slug={modalSlug}
      className={baseClass}
    >
      <MinimalTemplate className={`${baseClass}__template`}>
        <header className={`${baseClass}__header`}>
          <h3>Edit Link</h3>
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
          />
          <FormSubmit>
            Confirm
          </FormSubmit>
        </Form>
      </MinimalTemplate>
    </Modal>
  );
};

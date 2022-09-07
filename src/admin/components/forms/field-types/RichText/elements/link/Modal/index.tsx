import { Modal } from '@faceless-ui/modal';
import React, { useEffect, useRef } from 'react';
import { MinimalTemplate } from '../../../../../..';
import Button from '../../../../../../elements/Button';
import X from '../../../../../../icons/X';
import Form from '../../../../../Form';
import FormSubmit from '../../../../../Submit';
import Checkbox from '../../../../Checkbox';
import Text from '../../../../Text';
import { Props } from './types';
import { modalSlug } from '../shared';

import './index.scss';

const baseClass = modalSlug;

export const EditModal: React.FC<Props> = ({ close, handleModalSubmit, initialData }) => {
  const inputRef = useRef<HTMLInputElement>();

  useEffect(() => {
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  }, []);

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
          initialData={initialData}
        >
          <Text
            inputRef={inputRef}
            required
            name="text"
            label="Text to display"
            admin={{
              className: `${baseClass}__input`,
            }}
          />
          <Text
            required
            name="url"
            label="Enter a URL"
            admin={{
              className: `${baseClass}__input`,
            }}
          />
          <Checkbox
            label="Open in new tab"
            name="newTab"
          />
          <FormSubmit>
            Confirm
          </FormSubmit>
        </Form>
      </MinimalTemplate>
    </Modal>
  );
};

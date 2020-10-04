import React, { Fragment, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Modal, useModal } from '@faceless-ui/modal';
import { Transforms } from 'slate';
import { useSlate } from 'slate-react';
import { MinimalTemplate } from '../../../../../../../admin/components';
import { ElementButton } from '../../../../../../../admin/rich-text';
import { X } from '../../../../../../../admin/icons';
import { Button } from '../../../../../../../admin/elements';
import { Form, Text, Checkbox, Select, Submit, reduceFieldsToValues } from '../../../../../../../admin/forms';

import './index.scss';

const baseClass = 'button-rich-text-button';

const initialFormData = {
  style: 'primary',
};

const insertButton = (editor, { href, label, style, newTab = false }) => {
  const text = { text: ' ' };
  const button = {
    type: 'button',
    href,
    style,
    newTab,
    label,
    children: [
      text,
    ],
  };

  const nodes = [button, { children: [{ text: '' }] }];

  Transforms.insertNodes(editor, nodes);
};

const ToolbarButton = ({ path }) => {
  const { open, closeAll } = useModal();
  const editor = useSlate();

  const handleAddButton = useCallback((fields) => {
    const data = reduceFieldsToValues(fields);
    insertButton(editor, data);
    closeAll();
  }, [editor, closeAll]);

  const modalSlug = `${path}-add-button`;

  return (
    <Fragment>
      <ElementButton
        className={baseClass}
        format="button"
        onClick={() => open(modalSlug)}
      >
        Button
      </ElementButton>
      <Modal
        slug={modalSlug}
        className={`${baseClass}__modal`}
      >
        <MinimalTemplate>
          <header className={`${baseClass}__header`}>
            <h3>Add button</h3>
            <Button
              buttonStyle="none"
              onClick={closeAll}
            >
              <X />
            </Button>
          </header>
          <Form
            onSubmit={handleAddButton}
            initialData={initialFormData}
          >
            <Text
              label="Label"
              name="label"
              required
            />
            <Text
              label="URL"
              name="href"
              required
            />
            <Select
              label="Style"
              name="style"
              options={[
                {
                  label: 'Primary',
                  value: 'primary',
                },
                {
                  label: 'Secondary',
                  value: 'secondary',
                },
              ]}
            />
            <Checkbox
              label="Open in new tab"
              name="newTab"
            />
            <Submit>
              Add button
            </Submit>
          </Form>
        </MinimalTemplate>
      </Modal>
    </Fragment>
  );
};

ToolbarButton.propTypes = {
  path: PropTypes.string.isRequired,
};

export default ToolbarButton;

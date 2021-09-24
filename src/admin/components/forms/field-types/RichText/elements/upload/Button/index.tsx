import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';
import { useConfig } from '@payloadcms/config-provider';
import ElementButton from '../../Button';
import UploadIcon from '../../../../../../icons/Upload';
import Form from '../../../../../Form';
import MinimalTemplate from '../../../../../../templates/Minimal';
import Button from '../../../../../../elements/Button';
import Submit from '../../../../../Submit';
import X from '../../../../../../icons/X';
import Fields from './Fields';
import { requests } from '../../../../../../../api';

import './index.scss';

const initialFormData = {};

const baseClass = 'upload-rich-text-button';

const insertUpload = (editor, { value, relationTo }) => {
  const text = { text: ' ' };

  const upload = {
    type: 'upload',
    value,
    relationTo,
    children: [
      text,
    ],
  };

  const nodes = [upload, { children: [{ text: '' }] }];

  if (editor.blurSelection) {
    Transforms.select(editor, editor.blurSelection);
  }

  Transforms.insertNodes(editor, nodes);

  const currentPath = editor.selection.anchor.path[0];
  const newSelection = { anchor: { path: [currentPath + 1, 0], offset: 0 }, focus: { path: [currentPath + 1, 0], offset: 0 } };

  Transforms.select(editor, newSelection);
  ReactEditor.focus(editor);
};

const UploadButton: React.FC<{path: string}> = ({ path }) => {
  const { open, closeAll } = useModal();
  const editor = useSlate();
  const { serverURL, routes: { api }, collections } = useConfig();
  const [renderModal, setRenderModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasEnabledCollections] = useState(() => collections.find(({ upload, admin: { enableRichTextRelationship } }) => upload && enableRichTextRelationship));
  const modalSlug = `${path}-add-upload`;

  const handleAddUpload = useCallback(async (_, { relationTo, value }) => {
    setLoading(true);

    const res = await requests.get(`${serverURL}${api}/${relationTo}/${value}?depth=0`);
    const json = await res.json();

    insertUpload(editor, { value: { id: json.id }, relationTo });
    closeAll();
    setRenderModal(false);
    setLoading(false);
  }, [editor, closeAll, api, serverURL]);

  useEffect(() => {
    if (renderModal) {
      open(modalSlug);
    }
  }, [renderModal, open, modalSlug]);

  if (!hasEnabledCollections) return null;

  return (
    <Fragment>
      <ElementButton
        className={baseClass}
        format="upload"
        onClick={() => setRenderModal(true)}
      >
        <UploadIcon />
      </ElementButton>
      {renderModal && (
        <Modal
          slug={modalSlug}
          className={`${baseClass}__modal`}
        >
          <MinimalTemplate>
            <header className={`${baseClass}__header`}>
              <h3>Add Upload</h3>
              <Button
                buttonStyle="none"
                onClick={() => {
                  closeAll();
                  setRenderModal(false);
                }}
              >
                <X />
              </Button>
            </header>
            <Form
              onSubmit={handleAddUpload}
              initialData={initialFormData}
              disabled={loading}
            >
              <Fields />
              <Submit>
                Add upload
              </Submit>
            </Form>
          </MinimalTemplate>
        </Modal>
      )}
    </Fragment>
  );
};

export default UploadButton;

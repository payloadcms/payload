import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactEditor, useSlate } from 'slate-react';
import ElementButton from '../../Button';
import UploadIcon from '../../../../../../icons/Upload';
import { useUploadsDrawer } from '../../../../../../elements/UploadsDrawer';
import { injectVoidElement } from '../../injectVoid';

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

  injectVoidElement(editor, upload);

  ReactEditor.focus(editor);
};

const UploadButton: React.FC<{ path: string }> = ({ path }) => {
  const { t } = useTranslation(['upload', 'general']);
  const editor = useSlate();

  const [
    UploadsDrawer,
    UploadsDrawerToggler,
  ] = useUploadsDrawer();

  return (
    <Fragment>
      <UploadsDrawerToggler>
        <ElementButton
          format="upload"
          tooltip={t('fields:addLabel', { label: '' })}
          el="div"
          onClick={() => {
            // do nothing
          }}
        >
          <UploadIcon />
        </ElementButton>
      </UploadsDrawerToggler>
      <UploadsDrawer
        onSave={({ doc, collectionConfig }) => {
          insertUpload(editor, {
            value: {
              id: doc.id,
            },
            relationTo: collectionConfig.slug,
          });
        }}
      />
    </Fragment>
  );
};

export default UploadButton;

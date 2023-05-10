import React, { Fragment, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactEditor, useSlate } from 'slate-react';
import ElementButton from '../../Button';
import UploadIcon from '../../../../../../icons/Upload';
import { useListDrawer } from '../../../../../../elements/ListDrawer';
import { injectVoidElement } from '../../injectVoid';
import { EnabledRelationshipsCondition } from '../../EnabledRelationshipsCondition';

import './index.scss';

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

  injectVoidElement(editor, upload);

  ReactEditor.focus(editor);
};

type ButtonProps = {
  path: string
  enabledCollectionSlugs: string[]
}

const UploadButton: React.FC<ButtonProps> = ({ enabledCollectionSlugs }) => {
  const { t } = useTranslation(['upload', 'general']);
  const editor = useSlate();

  const [
    ListDrawer,
    ListDrawerToggler,
    {
      closeDrawer,
    },
  ] = useListDrawer({
    uploads: true,
    collectionSlugs: enabledCollectionSlugs,
  });

  const onSelect = useCallback(({ docID, collectionConfig }) => {
    insertUpload(editor, {
      value: {
        id: docID,
      },
      relationTo: collectionConfig.slug,
    });
    closeDrawer();
  }, [editor, closeDrawer]);

  return (
    <Fragment>
      <ListDrawerToggler>
        <ElementButton
          className={baseClass}
          format="upload"
          tooltip={t('fields:addUpload')}
          el="div"
          onClick={() => {
            // do nothing
          }}
        >
          <UploadIcon />
        </ElementButton>
      </ListDrawerToggler>
      <ListDrawer onSelect={onSelect} />
    </Fragment>
  );
};

export default (props: ButtonProps): React.ReactNode => {
  return (
    <EnabledRelationshipsCondition
      {...props}
      uploads
    >
      <UploadButton {...props} />
    </EnabledRelationshipsCondition>
  );
};

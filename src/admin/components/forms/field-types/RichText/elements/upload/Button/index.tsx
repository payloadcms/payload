import React, { Fragment, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactEditor, useSlate } from 'slate-react';
import ElementButton from '../../Button';
import UploadIcon from '../../../../../../icons/Upload';
import { useListDrawer } from '../../../../../../elements/ListDrawer';
import { injectVoidElement } from '../../injectVoid';

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

const UploadButton: React.FC<{
  path: string
}> = () => {
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

export default UploadButton;

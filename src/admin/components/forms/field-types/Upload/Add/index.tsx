import React, { useCallback } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { useConfig, useAuth } from '@payloadcms/config-provider';
import MinimalTemplate from '../../../../templates/Minimal';
import Form from '../../../Form';
import Button from '../../../../elements/Button';
import RenderFields from '../../../RenderFields';
import FormSubmit from '../../../Submit';
import Upload from '../../../../views/collections/Edit/Upload';
import { NegativeFieldGutterProvider } from '../../../FieldTypeGutter/context';
import { Props } from './types';

import './index.scss';

const baseClass = 'add-upload-modal';

const AddUploadModal: React.FC<Props> = (props) => {
  const {
    collection,
    collection: {
      admin: {
        description,
      } = {},
    } = {},
    slug,
    fieldTypes,
    setValue,
  } = props;

  const { permissions } = useAuth();
  const { serverURL, routes: { api } } = useConfig();
  const { closeAll } = useModal();

  const onSuccess = useCallback((json) => {
    closeAll();
    setValue(json.doc);
  }, [closeAll, setValue]);

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  const collectionPermissions = permissions?.collections?.[collection.slug]?.fields;

  return (
    <Modal
      className={classes}
      slug={slug}
    >
      <MinimalTemplate width="wide">
        <Form
          method="post"
          action={`${serverURL}${api}/${collection.slug}`}
          onSuccess={onSuccess}
          disableSuccessStatus
        >
          <header className={`${baseClass}__header`}>
            <div>
              <h1>
                New
                {' '}
                {collection.labels.singular}
              </h1>
              <FormSubmit>Save</FormSubmit>
              <Button
                icon="x"
                round
                buttonStyle="icon-label"
                iconStyle="with-border"
                onClick={closeAll}
              />
            </div>
            {description && (
              <div className={`${baseClass}__sub-header`}>{description}</div>
            )}
          </header>
          <Upload
            collection={collection}
          />
          <NegativeFieldGutterProvider allow>
            <RenderFields
              permissions={collectionPermissions}
              readOnly={false}
              fieldTypes={fieldTypes}
              fieldSchema={collection.fields}
            />
          </NegativeFieldGutterProvider>
        </Form>
      </MinimalTemplate>
    </Modal>
  );
};

export default AddUploadModal;

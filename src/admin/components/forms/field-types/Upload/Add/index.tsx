import React, { useCallback } from 'react';
import { Modal, useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../../utilities/Config';
import { useAuth } from '../../../../utilities/Auth';
import MinimalTemplate from '../../../../templates/Minimal';
import Form from '../../../Form';
import Button from '../../../../elements/Button';
import RenderFields from '../../../RenderFields';
import FormSubmit from '../../../Submit';
import Upload from '../../../../views/collections/Edit/Upload';
import ViewDescription from '../../../../elements/ViewDescription';
import { getTranslation } from '../../../../../../utilities/getTranslation';
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
  const { toggleModal } = useModal();
  const { t, i18n } = useTranslation('fields');

  const onSuccess = useCallback((json) => {
    toggleModal(slug);
    setValue(json.doc);
  }, [toggleModal, slug, setValue]);

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
          validationOperation="create"
        >
          <header className={`${baseClass}__header`}>
            <div>
              <h1>
                {t('newLabel', { label: getTranslation(collection.labels.singular, i18n) })}
              </h1>
              <FormSubmit>{t('general:save')}</FormSubmit>
              <Button
                icon="x"
                round
                buttonStyle="icon-label"
                iconStyle="with-border"
                onClick={() => toggleModal(slug)}
              />
            </div>
            {description && (
              <div className={`${baseClass}__sub-header`}>
                <ViewDescription description={description} />
              </div>
            )}
          </header>
          <Upload
            collection={collection}
          />
          <RenderFields
            permissions={collectionPermissions}
            readOnly={false}
            fieldTypes={fieldTypes}
            fieldSchema={collection.fields}
          />
        </Form>
      </MinimalTemplate>
    </Modal>
  );
};

export default AddUploadModal;

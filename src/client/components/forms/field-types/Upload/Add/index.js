import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Modal, useModal } from '@faceless-ui/modal';
import config from '../../../../../config';
import MinimalTemplate from '../../../../templates/Minimal';
import Form from '../../../Form';
import Button from '../../../../elements/Button';
import RenderFields from '../../../RenderFields';
import FormSubmit from '../../../Submit';
import Upload from '../../../../views/collections/Edit/Upload';

import './index.scss';

const { serverURL, routes: { api } } = config;

const baseClass = 'add-upload-modal';

const AddUploadModal = (props) => {
  const {
    collection,
    slug,
    fieldTypes,
    setValue,
  } = props;

  const { closeAll } = useModal();

  const onSuccess = useCallback((json) => {
    closeAll();
    setValue(json.doc);
  }, [closeAll, setValue]);

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

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
          </header>
          <Upload
            {...collection.upload}
            fieldTypes={fieldTypes}
          />
          <RenderFields
            filter={(field) => (!field.position || (field.position && field.position !== 'sidebar'))}
            fieldTypes={fieldTypes}
            fieldSchema={collection.fields}
            customComponentsPath={`${collection.slug}.fields.`}
          />
        </Form>
      </MinimalTemplate>
    </Modal>
  );
};

AddUploadModal.propTypes = {
  setValue: PropTypes.func.isRequired,
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      singular: PropTypes.string,
    }),
    slug: PropTypes.string,
    fields: PropTypes.arrayOf(
      PropTypes.shape({}),
    ),
    upload: PropTypes.shape({}),
  }).isRequired,
  slug: PropTypes.string.isRequired,
  fieldTypes: PropTypes.shape({}).isRequired,
};

export default AddUploadModal;

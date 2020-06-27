import React from 'react';
import PropTypes from 'prop-types';
import { useModal } from '@trbl/react-modal';
import config from '../../../../config';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import Label from '../../Label';
import Error from '../../Error';
import { upload } from '../../../../../fields/validations';
import SelectedUpload from './Selected';
import AddModal from './Add';
import SelectExistingModal from './SelectExisting';

import './index.scss';

const { collections } = config;

const baseClass = 'upload';

const Upload = (props) => {
  const { closeAll, toggle } = useModal();

  const {
    path: pathFromProps,
    name,
    required,
    defaultValue,
    initialData,
    style,
    width,
    label,
    readOnly,
    validate,
    relationTo,
  } = props;

  const collection = collections.find(coll => coll.slug === relationTo);

  const path = pathFromProps || name;
  const addModalSlug = `${path}-add`;
  const selectExistingModalSlug = `${path}-select-existing`;

  const fieldType = useFieldType({
    path,
    required,
    initialData,
    defaultValue,
    validate,
  });

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = fieldType;

  const classes = [
    'field-type',
    baseClass,
    showError && 'error',
    readOnly && 'read-only',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <Error
        showError={showError}
        message={errorMessage}
      />
      <Label
        htmlFor={path}
        label={label}
        required={required}
      />
      {collection && (
        <>
          {value && (
            <SelectedUpload
              collection={collection}
              value={value}
            />
          )}
          {!value && (
            <div className={`${baseClass}__wrap`}>
              <Button
                buttonStyle="secondary"
                onClick={() => {
                  toggle(addModalSlug);
                }}
              >
                Upload new
                {' '}
                {collection.labels.singular}
              </Button>
              <Button
                buttonStyle="secondary"
                onClick={() => {
                  toggle(selectExistingModalSlug);
                }}
              >
                Choose from existing
              </Button>
            </div>
          )}
          <AddModal {...{
            collection, slug: addModalSlug, setValue,
          }}
          />
          <SelectExistingModal {...{
            collection, slug: selectExistingModalSlug, setValue, addModalSlug,
          }}
          />
        </>
      )}
    </div>
  );
};

Upload.defaultProps = {
  label: null,
  required: false,
  readOnly: false,
  defaultValue: undefined,
  initialData: undefined,
  width: undefined,
  style: {},
  validate: upload,
  path: '',
};

Upload.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  defaultValue: PropTypes.string,
  initialData: PropTypes.string,
  validate: PropTypes.func,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  relationTo: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
  ]),
};

export default withCondition(Upload);

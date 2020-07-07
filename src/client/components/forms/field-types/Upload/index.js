import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useModal } from '@trbl/react-modal';
import config from '../../../../config';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import Label from '../../Label';
import Error from '../../Error';
import { upload } from '../../../../../fields/validations';
import FileDetails from '../../../elements/FileDetails';
import AddModal from './Add';
import SelectExistingModal from './SelectExisting';

import './index.scss';

const { collections, serverURL, routes: { api } } = config;

const baseClass = 'upload';

const Upload = (props) => {
  const { toggle } = useModal();
  const [internalValue, setInternalValue] = useState(undefined);

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
    fieldTypes,
  } = props;

  const collection = collections.find(coll => coll.slug === relationTo);

  const path = pathFromProps || name;
  const addModalSlug = `${path}-add`;
  const selectExistingModalSlug = `${path}-select-existing`;

  const dataToInitialize = (typeof initialData === 'object' && initialData.id) ? initialData.id : initialData;

  const fieldType = useFieldType({
    path,
    required,
    initialData: dataToInitialize,
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

  useEffect(() => {
    if (typeof initialData === 'object' && initialData?.id) {
      setInternalValue(initialData);
    }

    if (typeof initialData === 'string') {
      const fetchFile = async () => {
        const response = await fetch(`${serverURL}${api}/${relationTo}/${initialData}`);

        if (response.ok) {
          const json = await response.json();
          setInternalValue(json);
        }
      };

      fetchFile();
    }
  }, [initialData, setInternalValue, relationTo]);

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
      {collection?.upload && (
        <>
          {internalValue && (
            <FileDetails
              {...collection.upload}
              {...internalValue}
              handleRemove={() => {
                setInternalValue(undefined);
                setValue(null);
              }}
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
            collection,
            slug: addModalSlug,
            fieldTypes,
            setValue: (val) => {
              setValue(val.id);
              setInternalValue(val);
            },
          }}
          />
          <SelectExistingModal {...{
            collection,
            slug: selectExistingModalSlug,
            setValue: (val) => {
              setValue(val.id);
              setInternalValue(val);
            },
            addModalSlug,
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
  initialData: PropTypes.oneOfType([
    PropTypes.shape({
      id: PropTypes.string,
    }),
    PropTypes.string,
  ]),
  validate: PropTypes.func,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  relationTo: PropTypes.string.isRequired,
  fieldTypes: PropTypes.shape({}).isRequired,
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
  ]),
};

export default withCondition(Upload);

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useModal } from '@faceless-ui/modal';
import { useConfig } from '../../../providers/Config';
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

const baseClass = 'upload';

const Upload = (props) => {
  const { toggle } = useModal();
  const [internalValue, setInternalValue] = useState(undefined);
  const { collections, serverURL, routes: { api } } = useConfig();

  const {
    path: pathFromProps,
    name,
    required,
    admin: {
      readOnly,
      style,
      width,
    } = {},
    label,
    validate,
    relationTo,
    fieldTypes,
  } = props;

  const collection = collections.find((coll) => coll.slug === relationTo);

  const path = pathFromProps || name;
  const addModalSlug = `${path}-add`;
  const selectExistingModalSlug = `${path}-select-existing`;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);

  const fieldType = useFieldType({
    path,
    required,
    validate: memoizedValidate,
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
    if (typeof value === 'string') {
      const fetchFile = async () => {
        const response = await fetch(`${serverURL}${api}/${relationTo}/${value}`);

        if (response.ok) {
          const json = await response.json();
          setInternalValue(json);
        }
      };

      fetchFile();
    }
  }, [value, setInternalValue, relationTo]);

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
        <React.Fragment>
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
        </React.Fragment>
      )}
    </div>
  );
};

Upload.defaultProps = {
  label: null,
  required: false,
  admin: {},
  validate: upload,
  path: '',
};

Upload.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  validate: PropTypes.func,
  admin: PropTypes.shape({
    readOnly: PropTypes.bool,
    style: PropTypes.shape({}),
    width: PropTypes.string,
  }),
  relationTo: PropTypes.string.isRequired,
  fieldTypes: PropTypes.shape({}).isRequired,
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
  ]),
};

export default withCondition(Upload);

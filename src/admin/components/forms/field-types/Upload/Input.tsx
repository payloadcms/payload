import React, { useEffect, useState } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import Button from '../../../elements/Button';
import Label from '../../Label';
import Error from '../../Error';
import FileDetails from '../../../elements/FileDetails';
import FieldDescription from '../../FieldDescription';
import { FilterOptions, UploadField } from '../../../../../fields/config/types';
import { Description } from '../../FieldDescription/types';
import { FieldTypes } from '..';
import AddModal from './Add';
import SelectExistingModal from './SelectExisting';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { useEditDepth, EditDepthContext } from '../../../utilities/EditDepth';
import { getTranslation } from '../../../../../utilities/getTranslation';

import './index.scss';

const baseClass = 'upload';

export type UploadInputProps = Omit<UploadField, 'type'> & {
  showError?: boolean
  errorMessage?: string
  readOnly?: boolean
  path: string
  required?: boolean
  value?: string
  description?: Description
  onChange?: (e) => void
  placeholder?: string
  style?: React.CSSProperties
  className?: string
  width?: string
  fieldTypes?: FieldTypes
  collection?: SanitizedCollectionConfig
  serverURL?: string
  api?: string
  filterOptions: FilterOptions
}

const UploadInput: React.FC<UploadInputProps> = (props) => {
  const {
    path,
    required,
    readOnly,
    style,
    className,
    width,
    description,
    label,
    relationTo,
    fieldTypes,
    value,
    onChange,
    showError,
    serverURL = 'http://localhost:3000',
    api = '/api',
    collection,
    errorMessage,
    filterOptions,
  } = props;

  const { toggleModal, modalState } = useModal();
  const { t, i18n } = useTranslation('fields');
  const editDepth = useEditDepth();

  const addModalSlug = `${path}-add-depth-${editDepth}`;
  const selectExistingModalSlug = `${path}-select-existing-depth-${editDepth}`;

  const [file, setFile] = useState(undefined);
  const [missingFile, setMissingFile] = useState(false);
  const [modalToRender, setModalToRender] = useState<string>();

  const classes = [
    'field-type',
    baseClass,
    className,
    showError && 'error',
    readOnly && 'read-only',
  ].filter(Boolean).join(' ');

  useEffect(() => {
    if (typeof value === 'string' && value !== '') {
      const fetchFile = async () => {
        const response = await fetch(`${serverURL}${api}/${relationTo}/${value}`, {
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
          },
        });
        if (response.ok) {
          const json = await response.json();
          setFile(json);
        } else {
          setMissingFile(true);
          setFile(undefined);
        }
      };

      fetchFile();
    } else {
      setFile(undefined);
    }
  }, [
    value,
    relationTo,
    api,
    serverURL,
    i18n,
  ]);

  useEffect(() => {
    if (!modalState[addModalSlug]?.isOpen && !modalState[selectExistingModalSlug]?.isOpen) {
      setModalToRender(undefined);
    }
  }, [modalState, addModalSlug, selectExistingModalSlug]);

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
        htmlFor={`field-${path.replace(/\./gi, '__')}`}
        label={label}
        required={required}
      />
      {collection?.upload && (
        <React.Fragment>
          {(file && !missingFile) && (
            <FileDetails
              collection={collection}
              doc={file}
              handleRemove={() => {
                onChange(null);
              }}
            />
          )}
          {(!file || missingFile) && (
            <div className={`${baseClass}__wrap`}>
              <Button
                buttonStyle="secondary"
                onClick={() => {
                  toggleModal(addModalSlug);
                  setModalToRender(addModalSlug);
                }}
              >
                {t('uploadNewLabel', { label: getTranslation(collection.labels.singular, i18n) })}
              </Button>
              <Button
                buttonStyle="secondary"
                onClick={() => {
                  toggleModal(selectExistingModalSlug);
                  setModalToRender(selectExistingModalSlug);
                }}
              >
                {t('chooseFromExisting')}
              </Button>
            </div>
          )}
          <EditDepthContext.Provider value={editDepth + 1}>
            {modalToRender === addModalSlug && (
              <AddModal
                {...{
                  collection,
                  slug: addModalSlug,
                  fieldTypes,
                  setValue: (e) => {
                    setMissingFile(false);
                    onChange(e);
                  },
                }}
              />
            )}
            {modalToRender === selectExistingModalSlug && (
              <SelectExistingModal
                {...{
                  collection,
                  slug: selectExistingModalSlug,
                  setValue: onChange,
                  addModalSlug,
                  filterOptions,
                  path,
                }}
              />
            )}
          </EditDepthContext.Provider>
          <FieldDescription
            value={file}
            description={description}
          />
        </React.Fragment>
      )}
    </div>
  );
};

export default UploadInput;

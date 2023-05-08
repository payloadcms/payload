import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Label from '../../Label';
import Error from '../../Error';
import FileDetails from '../../../elements/FileDetails';
import FieldDescription from '../../FieldDescription';
import { FilterOptions, UploadField } from '../../../../../fields/config/types';
import { Description } from '../../FieldDescription/types';
import { FieldTypes } from '..';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { getTranslation } from '../../../../../utilities/getTranslation';
import { useDocumentDrawer } from '../../../elements/DocumentDrawer';
import { useListDrawer } from '../../../elements/ListDrawer';
import Button from '../../../elements/Button';
import { DocumentDrawerProps } from '../../../elements/DocumentDrawer/types';
import { ListDrawerProps } from '../../../elements/ListDrawer/types';
import { GetFilterOptions } from '../../../utilities/GetFilterOptions';
import { FilterOptionsResult } from '../Relationship/types';

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
    value,
    onChange,
    showError,
    serverURL = 'http://localhost:3000',
    api = '/api',
    collection,
    errorMessage,
    filterOptions,
  } = props;

  const { t, i18n } = useTranslation('fields');

  const [file, setFile] = useState(undefined);
  const [missingFile, setMissingFile] = useState(false);
  const [collectionSlugs] = useState([collection?.slug]);
  const [filterOptionsResult, setFilterOptionsResult] = useState<FilterOptionsResult>();

  const [
    DocumentDrawer,
    DocumentDrawerToggler,
    {
      closeDrawer,
    },
  ] = useDocumentDrawer({
    collectionSlug: collectionSlugs[0],
  });

  const [
    ListDrawer,
    ListDrawerToggler,
    {
      closeDrawer: closeListDrawer,
    },
  ] = useListDrawer({
    collectionSlugs,
    filterOptions: filterOptionsResult,
  });

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

  const onSave = useCallback<DocumentDrawerProps['onSave']>((args) => {
    setMissingFile(false);
    onChange(args.doc);
    closeDrawer();
  }, [onChange, closeDrawer]);

  const onSelect = useCallback<ListDrawerProps['onSelect']>((args) => {
    setMissingFile(false);
    onChange({
      id: args.docID,
    });
    closeListDrawer();
  }, [onChange, closeListDrawer]);

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <GetFilterOptions
        {...{
          filterOptionsResult,
          setFilterOptionsResult,
          filterOptions,
          path,
          relationTo,
        }}
      />
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
              handleRemove={readOnly ? undefined : () => {
                onChange(null);
              }}
            />
          )}
          {(!file || missingFile) && (
            <div className={`${baseClass}__wrap`}>
              <div className={`${baseClass}__buttons`}>
                <DocumentDrawerToggler
                  className={`${baseClass}__toggler`}
                  disabled={readOnly}
                >
                  <Button
                    buttonStyle="secondary"
                    el="div"
                    disabled={readOnly}
                  >
                    {t('uploadNewLabel', { label: getTranslation(collection.labels.singular, i18n) })}
                  </Button>
                </DocumentDrawerToggler>
                <ListDrawerToggler
                  className={`${baseClass}__toggler`}
                  disabled={readOnly}
                >
                  <Button
                    buttonStyle="secondary"
                    el="div"
                    disabled={readOnly}
                  >
                    {t('chooseFromExisting')}
                  </Button>
                </ListDrawerToggler>
              </div>
            </div>
          )}
          <FieldDescription
            value={file}
            description={description}
          />
        </React.Fragment>
      )}
      {!readOnly && <DocumentDrawer onSave={onSave} />}
      {!readOnly && <ListDrawer onSelect={onSelect} />}
    </div>
  );
};

export default UploadInput;

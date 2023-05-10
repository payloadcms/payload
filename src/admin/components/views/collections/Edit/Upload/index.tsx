import React, {
  useState, useRef, useEffect, useCallback,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useDocumentInfo } from '../../../../utilities/DocumentInfo';
import useField from '../../../../forms/useField';
import Button from '../../../../elements/Button';
import FileDetails from '../../../../elements/FileDetails';
import Error from '../../../../forms/Error';
import { Props } from './types';
import reduceFieldsToValues from '../../../../forms/Form/reduceFieldsToValues';

import './index.scss';

const baseClass = 'file-field';

const handleDrag = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

const validate = (value) => {
  if (!value && value !== undefined) {
    return 'A file is required.';
  }

  return true;
};

const Upload: React.FC<Props> = (props) => {
  const {
    collection,
    internalState,
  } = props;

  const inputRef = useRef(null);
  const dropRef = useRef(null);
  const [selectingFile, setSelectingFile] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [replacingFile, setReplacingFile] = useState(false);
  const { t } = useTranslation('upload');
  const [doc, setDoc] = useState(reduceFieldsToValues(internalState || {}, true));
  const { docPermissions } = useDocumentInfo();

  const {
    value,
    setValue,
    showError,
    errorMessage,
  } = useField<{ name: string }>({
    path: 'file',
    validate,
  });

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((count) => count + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((count) => count - 1);
    if (dragCounter > 1) return;
    setDragging(false);
  }, [dragCounter]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setValue(e.dataTransfer.files[0]);
      setDragging(false);

      e.dataTransfer.clearData();
      setDragCounter(0);
    } else {
      setDragging(false);
    }
  }, [setValue]);

  // Only called when input is interacted with directly
  // Not called when drag + drop is used
  // Or when input is cleared
  const handleInputChange = useCallback(() => {
    setSelectingFile(false);
    setValue(inputRef?.current?.files?.[0] || null);
  }, [inputRef, setValue]);

  useEffect(() => {
    if (selectingFile) {
      inputRef.current.click();
      setSelectingFile(false);
    }
  }, [selectingFile, inputRef, setSelectingFile]);

  useEffect(() => {
    setDoc(reduceFieldsToValues(internalState || {}, true));
    setReplacingFile(false);
  }, [internalState]);

  useEffect(() => {
    const div = dropRef.current;
    if (div) {
      div.addEventListener('dragenter', handleDragIn);
      div.addEventListener('dragleave', handleDragOut);
      div.addEventListener('dragover', handleDrag);
      div.addEventListener('drop', handleDrop);

      return () => {
        div.removeEventListener('dragenter', handleDragIn);
        div.removeEventListener('dragleave', handleDragOut);
        div.removeEventListener('dragover', handleDrag);
        div.removeEventListener('drop', handleDrop);
      };
    }

    return () => null;
  }, [handleDragIn, handleDragOut, handleDrop, value]);

  const classes = [
    baseClass,
    dragging && `${baseClass}--dragging`,
    'field-type',
  ].filter(Boolean).join(' ');

  const canRemoveUpload = docPermissions?.update?.permission && 'delete' in docPermissions && docPermissions?.delete?.permission;

  return (
    <div className={classes}>
      <Error
        showError={showError}
        message={errorMessage}
      />
      {(doc.filename && !replacingFile) && (
        <FileDetails
          doc={doc}
          collection={collection}
          handleRemove={canRemoveUpload ? () => {
            setReplacingFile(true);
            setValue(null);
          } : undefined}
        />
      )}
      {(!doc.filename || replacingFile) && (
        <div className={`${baseClass}__upload`}>
          {value && (
            <div className={`${baseClass}__file-selected`}>
              <span
                className={`${baseClass}__filename`}
              >
                {value.name}
              </span>
              <Button
                icon="x"
                round
                buttonStyle="icon-label"
                iconStyle="with-border"
                onClick={() => {
                  setValue(null);
                  inputRef.current.value = null;
                }}
              />
            </div>
          )}
          {!value && (
            <React.Fragment>
              <div
                className={`${baseClass}__drop-zone`}
                ref={dropRef}
                onPaste={(e) => {
                  if (e?.clipboardData?.files.length) {
                    const fileObject = e.clipboardData.files[0];
                    if (fileObject) setValue(fileObject);
                  }
                }}
              >
                <Button
                  size="small"
                  buttonStyle="secondary"
                  onClick={() => setSelectingFile(true)}
                  className={`${baseClass}__file-button`}
                >
                  {t('selectFile')}
                </Button>
                <p className={`${baseClass}__drag-label`}>
                  {t('general:or')}
                  {' '}
                  {t('dragAndDrop')}
                </p>
              </div>
            </React.Fragment>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={collection?.upload?.mimeTypes?.join(',')}
            onChange={handleInputChange}
          />
        </div>
      )}
    </div>
  );
};

export default Upload;

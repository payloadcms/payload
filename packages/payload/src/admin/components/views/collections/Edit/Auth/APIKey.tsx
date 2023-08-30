import React, { useMemo, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import useField from '../../../../forms/useField/index.js';
import Label from '../../../../forms/Label/index.js';
import CopyToClipboard from '../../../../elements/CopyToClipboard/index.js';
import { text } from '../../../../../../fields/validations.js';
import { useFormFields } from '../../../../forms/Form/context.js';

import GenerateConfirmation from '../../../../elements/GenerateConfirmation/index.js';

const path = 'apiKey';
const baseClass = 'api-key';

const APIKey: React.FC<{readOnly?: boolean}> = ({ readOnly }) => {
  const [initialAPIKey, setInitialAPIKey] = useState(null);
  const [highlightedField, setHighlightedField] = useState(false);
  const { t } = useTranslation();

  const apiKey = useFormFields(([fields]) => fields[path]);
  const validate = (val) => text(val, { minLength: 24, maxLength: 48, data: {}, siblingData: {}, t });

  const apiKeyValue = apiKey?.value;

  const APIKeyLabel = useMemo(() => (
    <div className={`${baseClass}__label`}>
      <span>
        API Key
      </span>
      <CopyToClipboard value={apiKeyValue as string} />
    </div>
  ), [apiKeyValue]);

  const fieldType = useField({
    path: 'apiKey',
    validate,
  });

  const highlightField = () => {
    if (highlightedField) {
      setHighlightedField(false);
    }
    setTimeout(() => {
      setHighlightedField(true);
    }, 1);
  };

  const {
    value,
    setValue,
  } = fieldType;

  useEffect(() => {
    setInitialAPIKey(uuidv4());
  }, []);

  useEffect(() => {
    if (!apiKeyValue) {
      setValue(initialAPIKey);
    }
  }, [apiKeyValue, setValue, initialAPIKey]);

  useEffect(() => {
    if (highlightedField) {
      setTimeout(() => {
        setHighlightedField(false);
      }, 10000);
    }
  }, [highlightedField]);

  const classes = [
    'field-type',
    'api-key',
    'read-only',
  ].filter(Boolean).join(' ');

  return (
    <React.Fragment>
      <div className={classes}>
        <Label
          htmlFor={path}
          label={APIKeyLabel}
        />
        <input
          value={value as string || ''}
          className={highlightedField ? 'highlight' : undefined}
          disabled
          type="text"
          id="apiKey"
          name="apiKey"
        />
      </div>
      {!readOnly && (
        <GenerateConfirmation
          setKey={() => setValue(uuidv4())}
          highlightField={highlightField}
        />
      )}
    </React.Fragment>
  );
};

export default APIKey;

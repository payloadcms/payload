'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { text } from 'payload/shared';
import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../../../elements/Button/index.js';
import { CopyToClipboard } from '../../../elements/CopyToClipboard/index.js';
import { GenerateConfirmation } from '../../../elements/GenerateConfirmation/index.js';
import { useFormFields } from '../../../forms/Form/context.js';
import { useField } from '../../../forms/useField/index.js';
import { EyeIcon } from '../../../icons/Eye/index.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
const path = 'apiKey';
const baseClass = 'api-key';
const fieldBaseClass = 'field-type';
export const APIKey = ({
  enabled,
  readOnly
}) => {
  const [initialAPIKey] = useState(uuidv4());
  const [highlightedField, setHighlightedField] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const {
    i18n,
    t
  } = useTranslation();
  const {
    config,
    getEntityConfig
  } = useConfig();
  const {
    collectionSlug
  } = useDocumentInfo();
  const apiKey = useFormFields(([fields]) => fields && fields[path] || null);
  const apiKeyField = getEntityConfig({
    collectionSlug
  })?.fields?.find(field => 'name' in field && field.name === 'apiKey');
  const validate = val => text(val, {
    name: 'apiKey',
    type: 'text',
    blockData: {},
    data: {},
    event: 'onChange',
    maxLength: 48,
    minLength: 24,
    path: ['apiKey'],
    preferences: {
      fields: {}
    },
    req: {
      payload: {
        config
      },
      t
    },
    siblingData: {}
  });
  const apiKeyValue = apiKey?.value;
  const apiKeyLabel = useMemo(() => {
    let label = 'API Key';
    if (apiKeyField?.label) {
      label = apiKeyField.label;
    }
    return getTranslation(label, i18n);
  }, [apiKeyField, i18n]);
  const APIKeyLabel = useMemo(() => /*#__PURE__*/_jsxs("label", {
    className: `${baseClass}__label field-label`,
    htmlFor: "apiKey",
    children: [/*#__PURE__*/_jsx("span", {
      children: apiKeyLabel
    }), /*#__PURE__*/_jsx(CopyToClipboard, {
      value: apiKeyValue
    })]
  }), [apiKeyLabel, apiKeyValue]);
  const fieldType = useField({
    path: 'apiKey',
    validate
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
    setValue,
    value
  } = fieldType;
  useEffect(() => {
    if (!apiKeyValue && enabled) {
      setValue(initialAPIKey);
    }
    if (!enabled && apiKeyValue) {
      setValue(null);
    }
  }, [apiKeyValue, enabled, setValue, initialAPIKey]);
  useEffect(() => {
    if (highlightedField) {
      setTimeout(() => {
        setHighlightedField(false);
      }, 10000);
    }
  }, [highlightedField]);
  if (!enabled) {
    return null;
  }
  return /*#__PURE__*/_jsxs(React.Fragment, {
    children: [/*#__PURE__*/_jsxs("div", {
      className: [fieldBaseClass, 'api-key', 'read-only'].filter(Boolean).join(' '),
      children: [APIKeyLabel, /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__input-wrap`,
        children: [/*#__PURE__*/_jsx("input", {
          "aria-label": apiKeyLabel,
          className: highlightedField ? 'highlight' : undefined,
          disabled: true,
          id: "apiKey",
          name: "apiKey",
          type: showKey ? 'text' : 'password',
          value: value || ''
        }), /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__toggle-button-wrap`,
          children: /*#__PURE__*/_jsx(Button, {
            buttonStyle: "none",
            className: `${baseClass}__toggle-button`,
            icon: /*#__PURE__*/_jsx(EyeIcon, {
              active: showKey
            }),
            onClick: () => setShowKey(prev => !prev)
          })
        })]
      })]
    }), !readOnly && /*#__PURE__*/_jsx(GenerateConfirmation, {
      highlightField: highlightField,
      setKey: () => setValue(uuidv4())
    })]
  });
};
//# sourceMappingURL=APIKey.js.map
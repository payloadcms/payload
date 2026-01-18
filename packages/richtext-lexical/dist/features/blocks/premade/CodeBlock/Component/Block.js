'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { ChevronIcon, Combobox, CopyToClipboard, PopupList, RenderFields, useForm, useFormFields, useTranslation } from '@payloadcms/ui';
import React from 'react';
import { CodeBlockIcon } from '../../../../../lexical/ui/icons/CodeBlock/index.js';
import { useBlockComponentContext } from '../../../client/component/BlockContent.js';
import { Collapse } from './Collapse/index.js';
import { defaultLanguages } from './defaultLanguages.js';
import { FloatingCollapse } from './FloatingCollapse/index.js';
const baseClass = 'payload-richtext-code-block';
export const CodeBlockBlockComponent = args => {
  const {
    languages: languagesFromProps
  } = args;
  const languages = languagesFromProps || defaultLanguages;
  const {
    BlockCollapsible,
    formSchema,
    RemoveButton
  } = useBlockComponentContext();
  const {
    setModified
  } = useForm();
  const {
    t
  } = useTranslation();
  const {
    codeField
  } = useFormFields(([fields]) => ({
    codeField: fields?.code
  }));
  const {
    selectedLanguageField,
    setSelectedLanguage
  } = useFormFields(([fields_0, dispatch]) => ({
    selectedLanguageField: fields_0?.language,
    setSelectedLanguage: language => {
      dispatch({
        type: 'UPDATE',
        path: 'language',
        value: language
      });
      setModified(true);
    }
  }));
  const selectedLanguageLabel = languages[selectedLanguageField?.value];
  const isEditable = useLexicalEditable();
  const languageEntries = React.useMemo(() => {
    return Object.entries(languages).map(([languageCode, languageLabel]) => ({
      name: `${languageCode} ${languageLabel}`,
      Component: /*#__PURE__*/_jsx(PopupList.Button, {
        active: false,
        disabled: false,
        onClick: () => {
          setSelectedLanguage(languageCode);
        },
        children: /*#__PURE__*/_jsx("span", {
          className: `${baseClass}__language-code`,
          "data-language": languageCode,
          children: languageLabel
        })
      })
    }));
  }, [languages, setSelectedLanguage]);
  return /*#__PURE__*/_jsx(BlockCollapsible, {
    Actions: /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__actions`,
      children: [/*#__PURE__*/_jsx(Combobox, {
        button: /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__language-selector-button`,
          "data-selected-language": selectedLanguageField?.value,
          children: [/*#__PURE__*/_jsx("span", {
            children: selectedLanguageLabel
          }), /*#__PURE__*/_jsx(ChevronIcon, {
            className: `${baseClass}__chevron`
          })]
        }),
        buttonType: "custom",
        className: `${baseClass}__language-selector`,
        disabled: !isEditable,
        entries: languageEntries,
        horizontalAlign: "right",
        minEntriesForSearch: 8,
        searchPlaceholder: t('fields:searchForLanguage'),
        showScrollbar: true,
        size: "large"
      }), /*#__PURE__*/_jsx(CopyToClipboard, {
        value: codeField?.value ?? ''
      }), /*#__PURE__*/_jsx(Collapse, {}), isEditable && /*#__PURE__*/_jsx(RemoveButton, {})]
    }),
    className: baseClass,
    collapsibleProps: {
      AfterCollapsible: /*#__PURE__*/_jsx(FloatingCollapse, {}),
      disableHeaderToggle: true,
      disableToggleIndicator: true
    },
    Pill: /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__pill`,
      children: /*#__PURE__*/_jsx(CodeBlockIcon, {})
    }),
    children: /*#__PURE__*/_jsx(RenderFields, {
      fields: formSchema,
      forceRender: true,
      parentIndexPath: "",
      parentPath: '',
      parentSchemaPath: "",
      permissions: true,
      readOnly: !isEditable
    })
  });
};
//# sourceMappingURL=Block.js.map
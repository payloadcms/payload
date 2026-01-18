'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { useForm } from '../../forms/Form/context.js';
import { useEditDepth } from '../../providers/EditDepth/index.js';
import { useLocale } from '../../providers/Locale/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { generateFieldID } from '../../utilities/generateFieldID.js';
import './index.scss';
export const FieldLabel = props => {
  const {
    as: t0,
    hideLocale: t1,
    htmlFor: htmlForFromProps,
    label,
    localized: t2,
    path,
    required: t3,
    unstyled: t4
  } = props;
  const ElementFromProps = t0 === undefined ? "label" : t0;
  const hideLocale = t1 === undefined ? false : t1;
  const localized = t2 === undefined ? false : t2;
  const required = t3 === undefined ? false : t3;
  const unstyled = t4 === undefined ? false : t4;
  const {
    uuid
  } = useForm();
  const editDepth = useEditDepth();
  const htmlFor = htmlForFromProps || generateFieldID(path, editDepth, uuid);
  const {
    i18n
  } = useTranslation();
  const {
    code,
    label: localLabel
  } = useLocale();
  const Element = ElementFromProps === "label" ? htmlFor ? "label" : "span" : ElementFromProps || "span";
  if (label) {
    return _jsxs(Element, {
      className: `field-label${unstyled ? " unstyled" : ""}`,
      htmlFor,
      children: [getTranslation(label, i18n), required && !unstyled && _jsx("span", {
        className: "required",
        children: "*"
      }), localized && !hideLocale && _jsxs("span", {
        className: "localized",
        children: ["\u2014 ", typeof localLabel === "string" ? localLabel : code]
      })]
    });
  }
  return null;
};
//# sourceMappingURL=index.js.map
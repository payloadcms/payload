'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useTranslation } from '../../../providers/Translation/index.js';
import { Button } from '../../Button/index.js';
import { Dropzone } from '../../Dropzone/index.js';
import { DrawerHeader } from '../Header/index.js';
import './index.scss';
const baseClass = 'bulk-upload--add-files';
export function AddFilesView({
  acceptMimeTypes,
  onCancel,
  onDrop
}) {
  const {
    t
  } = useTranslation();
  const inputRef = React.useRef(null);
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [/*#__PURE__*/_jsx(DrawerHeader, {
      onClose: onCancel,
      title: t('upload:addFiles')
    }), /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__dropArea`,
      children: /*#__PURE__*/_jsxs(Dropzone, {
        multipleFiles: true,
        onChange: onDrop,
        children: [/*#__PURE__*/_jsx(Button, {
          buttonStyle: "subtle",
          iconPosition: "left",
          onClick: () => {
            if (inputRef.current) {
              inputRef.current.click();
            }
          },
          size: "small",
          children: t('upload:selectFile')
        }), /*#__PURE__*/_jsx("input", {
          accept: acceptMimeTypes,
          "aria-hidden": "true",
          className: `${baseClass}__hidden-input`,
          hidden: true,
          multiple: true,
          onChange: e => {
            if (e.target.files && e.target.files.length > 0) {
              onDrop(e.target.files);
            }
          },
          ref: inputRef,
          type: "file"
        }), /*#__PURE__*/_jsxs("p", {
          className: `${baseClass}__dragAndDropText`,
          children: [t('general:or'), " ", t('upload:dragAndDrop')]
        })]
      })
    })]
  });
}
//# sourceMappingURL=index.js.map
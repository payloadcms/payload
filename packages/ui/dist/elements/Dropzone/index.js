'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
const handleDragOver = e => {
  e.preventDefault();
  e.stopPropagation();
};
const baseClass = 'dropzone';
export function Dropzone({
  children,
  className,
  disabled = false,
  dropzoneStyle = 'default',
  multipleFiles,
  onChange
}) {
  const dropRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const addFiles = React.useCallback(files => {
    if (!multipleFiles && files.length > 1) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      onChange(dataTransfer.files);
    } else {
      onChange(files);
    }
  }, [multipleFiles, onChange]);
  const handlePaste = React.useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      addFiles(e.clipboardData.files);
    }
  }, [addFiles]);
  const handleDragEnter = React.useCallback(e_0 => {
    e_0.preventDefault();
    e_0.stopPropagation();
    setDragging(true);
  }, []);
  const handleDragLeave = React.useCallback(e_1 => {
    e_1.preventDefault();
    e_1.stopPropagation();
    setDragging(false);
  }, []);
  const handleDrop = React.useCallback(e_2 => {
    e_2.preventDefault();
    e_2.stopPropagation();
    setDragging(false);
    if (e_2.dataTransfer.files && e_2.dataTransfer.files.length > 0) {
      addFiles(e_2.dataTransfer.files);
      setDragging(false);
      e_2.dataTransfer.clearData();
    }
  }, [addFiles]);
  React.useEffect(() => {
    const div = dropRef.current;
    if (div && !disabled) {
      div.addEventListener('dragenter', handleDragEnter);
      div.addEventListener('dragleave', handleDragLeave);
      div.addEventListener('dragover', handleDragOver);
      div.addEventListener('drop', handleDrop);
      div.addEventListener('paste', handlePaste);
      return () => {
        div.removeEventListener('dragenter', handleDragEnter);
        div.removeEventListener('dragleave', handleDragLeave);
        div.removeEventListener('dragover', handleDragOver);
        div.removeEventListener('drop', handleDrop);
        div.removeEventListener('paste', handlePaste);
      };
    }
    return () => null;
  }, [disabled, handleDragEnter, handleDragLeave, handleDrop, handlePaste]);
  const classes = [baseClass, className, dragging ? 'dragging' : '', `dropzoneStyle--${dropzoneStyle}`].filter(Boolean).join(' ');
  return /*#__PURE__*/_jsx("div", {
    className: classes,
    ref: dropRef,
    children: children
  });
}
//# sourceMappingURL=index.js.map
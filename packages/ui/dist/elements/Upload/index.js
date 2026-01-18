'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { formatAdminURL, isImage } from 'payload/shared';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FieldError } from '../../fields/FieldError/index.js';
import { fieldBaseClass } from '../../fields/shared/index.js';
import { useForm, useFormProcessing } from '../../forms/Form/index.js';
import { useField } from '../../forms/useField/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { EditDepthProvider } from '../../providers/EditDepth/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { UploadControlsProvider, useUploadControls } from '../../providers/UploadControls/index.js';
import { useUploadEdits } from '../../providers/UploadEdits/index.js';
import { Button } from '../Button/index.js';
import { Drawer } from '../Drawer/index.js';
import { Dropzone } from '../Dropzone/index.js';
import { EditUpload } from '../EditUpload/index.js';
import './index.scss';
import { FileDetails } from '../FileDetails/index.js';
import { PreviewSizes } from '../PreviewSizes/index.js';
import { Thumbnail } from '../Thumbnail/index.js';
const baseClass = 'file-field';
export const editDrawerSlug = 'edit-upload';
export const sizePreviewSlug = 'preview-sizes';
const validate = value => {
  if (!value && value !== undefined) {
    return 'A file is required.';
  }
  if (value && (!value.name || value.name === '')) {
    return 'A file name is required.';
  }
  return true;
};
export const UploadActions = t0 => {
  const $ = _c(8);
  const {
    customActions,
    enableAdjustments,
    enablePreviewSizes,
    mimeType
  } = t0;
  const {
    t
  } = useTranslation();
  const {
    openModal
  } = useModal();
  let t1;
  let t2;
  if ($[0] !== customActions || $[1] !== enableAdjustments || $[2] !== enablePreviewSizes || $[3] !== mimeType || $[4] !== openModal || $[5] !== t) {
    t2 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const fileTypeIsAdjustable = isImage(mimeType) && mimeType !== "image/svg+xml" && mimeType !== "image/jxl";
      if (!fileTypeIsAdjustable && (!customActions || customActions.length === 0)) {
        t2 = null;
        break bb0;
      }
      t1 = _jsxs("div", {
        className: `${baseClass}__upload-actions`,
        children: [fileTypeIsAdjustable && _jsxs(React.Fragment, {
          children: [enablePreviewSizes && _jsx(Button, {
            buttonStyle: "pill",
            className: `${baseClass}__previewSizes`,
            margin: false,
            onClick: () => {
              openModal(sizePreviewSlug);
            },
            size: "small",
            children: t("upload:previewSizes")
          }), enableAdjustments && _jsx(Button, {
            buttonStyle: "pill",
            className: `${baseClass}__edit`,
            margin: false,
            onClick: () => {
              openModal(editDrawerSlug);
            },
            size: "small",
            children: t("upload:editImage")
          })]
        }), customActions && customActions.map(_temp)]
      });
    }
    $[0] = customActions;
    $[1] = enableAdjustments;
    $[2] = enablePreviewSizes;
    $[3] = mimeType;
    $[4] = openModal;
    $[5] = t;
    $[6] = t1;
    $[7] = t2;
  } else {
    t1 = $[6];
    t2 = $[7];
  }
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    return t2;
  }
  return t1;
};
export const Upload = props => {
  const $ = _c(5);
  const {
    resetUploadEdits,
    updateUploadEdits,
    uploadEdits
  } = useUploadEdits();
  let t0;
  if ($[0] !== props || $[1] !== resetUploadEdits || $[2] !== updateUploadEdits || $[3] !== uploadEdits) {
    t0 = _jsx(UploadControlsProvider, {
      children: _jsx(Upload_v4, {
        ...props,
        resetUploadEdits,
        updateUploadEdits,
        uploadEdits
      })
    });
    $[0] = props;
    $[1] = resetUploadEdits;
    $[2] = updateUploadEdits;
    $[3] = uploadEdits;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  return t0;
};
export const Upload_v4 = props => {
  const {
    collectionSlug,
    customActions,
    initialState,
    onChange,
    resetUploadEdits,
    updateUploadEdits,
    uploadConfig,
    UploadControls,
    uploadEdits
  } = props;
  const {
    setUploadControlFile,
    setUploadControlFileName,
    setUploadControlFileUrl,
    uploadControlFile,
    uploadControlFileName,
    uploadControlFileUrl
  } = useUploadControls();
  const {
    config: {
      routes: {
        api
      }
    }
  } = useConfig();
  const {
    t
  } = useTranslation();
  const {
    setModified
  } = useForm();
  const {
    id,
    data,
    docPermissions,
    setUploadStatus
  } = useDocumentInfo();
  const isFormSubmitting = useFormProcessing();
  const {
    errorMessage,
    setValue,
    showError,
    value
  } = useField({
    path: 'file',
    validate
  });
  const [fileSrc, setFileSrc] = useState(null);
  const [removedFile, setRemovedFile] = useState(false);
  const [filename, setFilename] = useState(value?.name || '');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const urlInputRef = useRef(null);
  const inputRef = useRef(null);
  const useServerSideFetch = typeof uploadConfig?.pasteURL === 'object' && uploadConfig.pasteURL.allowList?.length > 0;
  const handleFileChange = useCallback(({
    file,
    isNewFile = true
  }) => {
    if (isNewFile && file instanceof File) {
      setFileSrc(URL.createObjectURL(file));
    }
    setValue(file);
    setShowUrlInput(false);
    setUploadControlFileUrl('');
    setUploadControlFileName(null);
    setUploadControlFile(null);
    if (typeof onChange === 'function') {
      onChange(file);
    }
  }, [onChange, setValue, setUploadControlFile, setUploadControlFileName, setUploadControlFileUrl]);
  const renameFile = (fileToChange, newName) => {
    // Creating a new File object with updated properties
    const newFile = new File([fileToChange], newName, {
      type: fileToChange.type,
      lastModified: fileToChange.lastModified
    });
    return newFile;
  };
  const handleFileNameChange = React.useCallback(e => {
    const updatedFileName = e.target.value;
    if (value) {
      handleFileChange({
        file: renameFile(value, updatedFileName),
        isNewFile: false
      });
      setFilename(updatedFileName);
    }
  }, [handleFileChange, value]);
  const handleFileSelection = useCallback(files => {
    const fileToUpload = files?.[0];
    handleFileChange({
      file: fileToUpload
    });
  }, [handleFileChange]);
  const handleFileRemoval = useCallback(() => {
    setRemovedFile(true);
    handleFileChange({
      file: null
    });
    setFileSrc('');
    setFileUrl('');
    resetUploadEdits();
    setShowUrlInput(false);
    setUploadControlFileUrl('');
    setUploadControlFileName(null);
    setUploadControlFile(null);
  }, [handleFileChange, resetUploadEdits, setUploadControlFile, setUploadControlFileName, setUploadControlFileUrl]);
  const onEditsSave = useCallback(args => {
    setModified(true);
    updateUploadEdits(args);
  }, [setModified, updateUploadEdits]);
  const handleUrlSubmit = useCallback(async () => {
    if (!fileUrl || uploadConfig?.pasteURL === false) {
      return;
    }
    setUploadStatus('uploading');
    try {
      // Attempt client-side fetch
      const clientResponse = await fetch(fileUrl);
      if (!clientResponse.ok) {
        throw new Error(`Fetch failed with status: ${clientResponse.status}`);
      }
      const blob = await clientResponse.blob();
      const fileName = uploadControlFileName || decodeURIComponent(fileUrl.split('/').pop() || '');
      const file_0 = new File([blob], fileName, {
        type: blob.type
      });
      handleFileChange({
        file: file_0
      });
      setUploadStatus('idle');
      return; // Exit if client-side fetch succeeds
    } catch (_clientError) {
      if (!useServerSideFetch) {
        // If server-side fetch is not enabled, show client-side error
        toast.error('Failed to fetch the file.');
        setUploadStatus('failed');
        return;
      }
    }
    // Attempt server-side fetch if client-side fetch fails and useServerSideFetch is true
    try {
      const pasteURL = `/${collectionSlug}/paste-url${id ? `/${id}?` : '?'}src=${encodeURIComponent(fileUrl)}`;
      const serverResponse = await fetch(formatAdminURL({
        apiRoute: api,
        path: pasteURL
      }));
      if (!serverResponse.ok) {
        throw new Error(`Fetch failed with status: ${serverResponse.status}`);
      }
      const blob_0 = await serverResponse.blob();
      const fileName_0 = decodeURIComponent(fileUrl.split('/').pop() || '');
      const file_1 = new File([blob_0], fileName_0, {
        type: blob_0.type
      });
      handleFileChange({
        file: file_1
      });
      setUploadStatus('idle');
    } catch (_serverError) {
      toast.error('The provided URL is not allowed.');
      setUploadStatus('failed');
    }
  }, [api, collectionSlug, fileUrl, handleFileChange, id, setUploadStatus, uploadConfig, uploadControlFileName, useServerSideFetch]);
  useEffect(() => {
    if (initialState?.file?.value instanceof File) {
      setFileSrc(URL.createObjectURL(initialState.file.value));
      setRemovedFile(false);
    }
  }, [initialState]);
  useEffect(() => {
    if (showUrlInput && urlInputRef.current) {
      // urlInputRef.current.focus() // Focus on the remote-url input field when showUrlInput is true
    }
  }, [showUrlInput]);
  useEffect(() => {
    if (isFormSubmitting) {
      setRemovedFile(false);
    }
  }, [isFormSubmitting]);
  const canRemoveUpload = docPermissions?.update;
  const hasImageSizes = uploadConfig?.imageSizes?.length > 0;
  const hasResizeOptions = Boolean(uploadConfig?.resizeOptions);
  // Explicity check if set to true, default is undefined
  const focalPointEnabled = uploadConfig?.focalPoint === true;
  const {
    crop: showCrop = true,
    focalPoint = true
  } = uploadConfig;
  const showFocalPoint = focalPoint && (hasImageSizes || hasResizeOptions || focalPointEnabled);
  const acceptMimeTypes = uploadConfig.mimeTypes?.join(', ');
  const imageCacheTag = uploadConfig?.cacheTags && data?.updatedAt;
  useEffect(() => {
    const handleControlFileUrl = async () => {
      if (uploadControlFileUrl) {
        setFileUrl(uploadControlFileUrl);
        await handleUrlSubmit();
      }
    };
    void handleControlFileUrl();
  }, [uploadControlFileUrl, handleUrlSubmit]);
  useEffect(() => {
    const handleControlFile = () => {
      if (uploadControlFile) {
        handleFileChange({
          file: uploadControlFile
        });
      }
    };
    void handleControlFile();
  }, [uploadControlFile, handleFileChange]);
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass].filter(Boolean).join(' '),
    children: [/*#__PURE__*/_jsx(FieldError, {
      message: errorMessage,
      showError: showError
    }), data && data.filename && !removedFile && /*#__PURE__*/_jsx(FileDetails, {
      collectionSlug: collectionSlug,
      customUploadActions: customActions,
      doc: data,
      enableAdjustments: showCrop || showFocalPoint,
      handleRemove: canRemoveUpload ? handleFileRemoval : undefined,
      hasImageSizes: hasImageSizes,
      hideRemoveFile: uploadConfig.hideRemoveFile,
      imageCacheTag: imageCacheTag,
      uploadConfig: uploadConfig
    }), (!uploadConfig.hideFileInputOnCreate && !data?.filename || removedFile) && /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__upload`,
      children: [!value && !showUrlInput && /*#__PURE__*/_jsx(Dropzone, {
        onChange: handleFileSelection,
        children: /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__dropzoneContent`,
          children: [/*#__PURE__*/_jsxs("div", {
            className: `${baseClass}__dropzoneButtons`,
            children: [/*#__PURE__*/_jsx(Button, {
              buttonStyle: "pill",
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
              onChange: e_0 => {
                if (e_0.target.files && e_0.target.files.length > 0) {
                  handleFileSelection(e_0.target.files);
                }
              },
              ref: inputRef,
              type: "file"
            }), uploadConfig?.pasteURL !== false && /*#__PURE__*/_jsxs(Fragment, {
              children: [/*#__PURE__*/_jsx("span", {
                className: `${baseClass}__orText`,
                children: t('general:or')
              }), /*#__PURE__*/_jsx(Button, {
                buttonStyle: "pill",
                onClick: () => {
                  setShowUrlInput(true);
                  setUploadControlFileUrl('');
                  setUploadControlFile(null);
                  setUploadControlFileName(null);
                },
                size: "small",
                children: t('upload:pasteURL')
              })]
            }), UploadControls ? UploadControls : null]
          }), /*#__PURE__*/_jsxs("p", {
            className: `${baseClass}__dragAndDropText`,
            children: [t('general:or'), " ", t('upload:dragAndDrop')]
          })]
        })
      }), showUrlInput && /*#__PURE__*/_jsxs(React.Fragment, {
        children: [/*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__remote-file-wrap`,
          children: [/*#__PURE__*/_jsx("input", {
            className: `${baseClass}__remote-file`,
            onChange: e_1 => {
              setFileUrl(e_1.target.value);
            },
            ref: urlInputRef,
            title: fileUrl,
            type: "text",
            value: fileUrl
          }), /*#__PURE__*/_jsx("div", {
            className: `${baseClass}__add-file-wrap`,
            children: /*#__PURE__*/_jsx("button", {
              className: `${baseClass}__add-file`,
              onClick: () => {
                void handleUrlSubmit();
              },
              type: "button",
              children: t('upload:addFile')
            })
          })]
        }), /*#__PURE__*/_jsx(Button, {
          buttonStyle: "icon-label",
          className: `${baseClass}__remove`,
          icon: "x",
          iconStyle: "with-border",
          onClick: () => {
            setShowUrlInput(false);
            setUploadControlFileUrl('');
            setUploadControlFile(null);
            setUploadControlFileName(null);
          },
          round: true,
          tooltip: t('general:cancel')
        })]
      }), value && fileSrc && /*#__PURE__*/_jsxs(React.Fragment, {
        children: [/*#__PURE__*/_jsx("div", {
          className: `${baseClass}__thumbnail-wrap`,
          children: /*#__PURE__*/_jsx(Thumbnail, {
            collectionSlug: collectionSlug,
            fileSrc: isImage(value.type) ? fileSrc : null
          })
        }), /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__file-adjustments`,
          children: [/*#__PURE__*/_jsx("input", {
            className: `${baseClass}__filename`,
            onChange: handleFileNameChange,
            title: filename || value.name,
            type: "text",
            value: filename || value.name
          }), /*#__PURE__*/_jsx(UploadActions, {
            customActions: customActions,
            enableAdjustments: showCrop || showFocalPoint,
            enablePreviewSizes: hasImageSizes && data?.filename && !removedFile,
            mimeType: value.type
          })]
        }), /*#__PURE__*/_jsx(Button, {
          buttonStyle: "icon-label",
          className: `${baseClass}__remove`,
          icon: "x",
          iconStyle: "with-border",
          onClick: handleFileRemoval,
          round: true,
          tooltip: t('general:cancel')
        })]
      })]
    }), (value || data?.filename) && /*#__PURE__*/_jsx(EditDepthProvider, {
      children: /*#__PURE__*/_jsx(Drawer, {
        Header: null,
        slug: editDrawerSlug,
        children: /*#__PURE__*/_jsx(EditUpload, {
          fileName: value?.name || data?.filename,
          fileSrc: data?.url || fileSrc,
          imageCacheTag: imageCacheTag,
          initialCrop: uploadEdits?.crop ?? undefined,
          initialFocalPoint: {
            x: uploadEdits?.focalPoint?.x || data?.focalX || 50,
            y: uploadEdits?.focalPoint?.y || data?.focalY || 50
          },
          onSave: onEditsSave,
          showCrop: showCrop,
          showFocalPoint: showFocalPoint
        })
      })
    }), data && hasImageSizes && /*#__PURE__*/_jsx(Drawer, {
      className: `${baseClass}__previewDrawer`,
      hoverTitle: true,
      slug: sizePreviewSlug,
      title: t('upload:sizesFor', {
        label: data.filename
      }),
      children: /*#__PURE__*/_jsx(PreviewSizes, {
        doc: data,
        imageCacheTag: imageCacheTag,
        uploadConfig: uploadConfig
      })
    })]
  });
};
function _temp(CustomAction, i) {
  return _jsx(React.Fragment, {
    children: CustomAction
  }, i);
}
//# sourceMappingURL=index.js.map
'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import React, { useCallback } from 'react';
import { toast } from 'sonner';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Button } from '../Button/index.js';
import { ConfirmationModal } from '../ConfirmationModal/index.js';
import { Translation } from '../Translation/index.js';
export function GenerateConfirmation(props) {
  const $ = _c(12);
  const {
    highlightField,
    setKey
  } = props;
  const {
    id
  } = useDocumentInfo();
  const {
    toggleModal
  } = useModal();
  const {
    t
  } = useTranslation();
  const modalSlug = `generate-confirmation-${id}`;
  let t0;
  if ($[0] !== highlightField || $[1] !== setKey || $[2] !== t) {
    t0 = () => {
      setKey();
      toast.success(t("authentication:newAPIKeyGenerated"));
      highlightField(true);
    };
    $[0] = highlightField;
    $[1] = setKey;
    $[2] = t;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const handleGenerate = t0;
  let t1;
  if ($[4] !== modalSlug || $[5] !== toggleModal) {
    t1 = () => {
      toggleModal(modalSlug);
    };
    $[4] = modalSlug;
    $[5] = toggleModal;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  let t2;
  if ($[7] !== handleGenerate || $[8] !== modalSlug || $[9] !== t || $[10] !== t1) {
    t2 = _jsxs(React.Fragment, {
      children: [_jsx(Button, {
        buttonStyle: "secondary",
        onClick: t1,
        size: "small",
        children: t("authentication:generateNewAPIKey")
      }), _jsx(ConfirmationModal, {
        body: _jsx(Translation, {
          elements: {
            1: _temp
          },
          i18nKey: "authentication:generatingNewAPIKeyWillInvalidate",
          t
        }),
        confirmLabel: t("authentication:generate"),
        heading: t("authentication:confirmGeneration"),
        modalSlug,
        onConfirm: handleGenerate
      })]
    });
    $[7] = handleGenerate;
    $[8] = modalSlug;
    $[9] = t;
    $[10] = t1;
    $[11] = t2;
  } else {
    t2 = $[11];
  }
  return t2;
}
function _temp(t0) {
  const {
    children
  } = t0;
  return _jsx("strong", {
    children
  });
}
//# sourceMappingURL=index.js.map
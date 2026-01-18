'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { Gutter } from '../../../elements/Gutter/index.js';
import { useModal } from '../../../elements/Modal/index.js';
import { RenderTitle } from '../../../elements/RenderTitle/index.js';
import { useFormModified } from '../../../forms/Form/index.js';
import { XIcon } from '../../../icons/X/index.js';
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js';
import { useDocumentTitle } from '../../../providers/DocumentTitle/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { IDLabel } from '../../IDLabel/index.js';
import { LeaveWithoutSavingModal } from '../../LeaveWithoutSaving/index.js';
import { documentDrawerBaseClass } from '../index.js';
import './index.scss';
const leaveWithoutSavingModalSlug = 'leave-without-saving-doc-drawer';
export const DocumentDrawerHeader = t0 => {
  const $ = _c(15);
  const {
    AfterHeader,
    drawerSlug,
    showDocumentID: t1
  } = t0;
  const showDocumentID = t1 === undefined ? true : t1;
  const {
    closeModal,
    openModal
  } = useModal();
  const {
    t
  } = useTranslation();
  const isModified = useFormModified();
  let t2;
  if ($[0] !== closeModal || $[1] !== drawerSlug || $[2] !== isModified || $[3] !== openModal) {
    t2 = () => {
      if (isModified) {
        openModal(leaveWithoutSavingModalSlug);
      } else {
        closeModal(drawerSlug);
      }
    };
    $[0] = closeModal;
    $[1] = drawerSlug;
    $[2] = isModified;
    $[3] = openModal;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const handleOnClose = t2;
  let t3;
  if ($[5] !== AfterHeader || $[6] !== closeModal || $[7] !== drawerSlug || $[8] !== handleOnClose || $[9] !== showDocumentID || $[10] !== t) {
    let t4;
    if ($[12] !== closeModal || $[13] !== drawerSlug) {
      t4 = () => closeModal(drawerSlug);
      $[12] = closeModal;
      $[13] = drawerSlug;
      $[14] = t4;
    } else {
      t4 = $[14];
    }
    t3 = _jsxs(Gutter, {
      className: `${documentDrawerBaseClass}__header`,
      children: [_jsxs("div", {
        className: `${documentDrawerBaseClass}__header-content`,
        children: [_jsx("h2", {
          className: `${documentDrawerBaseClass}__header-text`,
          children: _jsx(RenderTitle, {
            element: "span"
          })
        }), _jsx("button", {
          "aria-label": t("general:close"),
          className: `${documentDrawerBaseClass}__header-close`,
          onClick: handleOnClose,
          type: "button",
          children: _jsx(XIcon, {})
        })]
      }), showDocumentID && _jsx(DocumentID, {}), AfterHeader ? _jsx("div", {
        className: `${documentDrawerBaseClass}__after-header`,
        children: AfterHeader
      }) : null, _jsx(LeaveWithoutSavingModal, {
        modalSlug: leaveWithoutSavingModalSlug,
        onConfirm: t4
      })]
    });
    $[5] = AfterHeader;
    $[6] = closeModal;
    $[7] = drawerSlug;
    $[8] = handleOnClose;
    $[9] = showDocumentID;
    $[10] = t;
    $[11] = t3;
  } else {
    t3 = $[11];
  }
  return t3;
};
const DocumentID = () => {
  const $ = _c(3);
  const {
    id
  } = useDocumentInfo();
  const {
    title
  } = useDocumentTitle();
  let t0;
  if ($[0] !== id || $[1] !== title) {
    t0 = id && id !== title ? _jsx(IDLabel, {
      id: id.toString()
    }) : null;
    $[0] = id;
    $[1] = title;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
};
//# sourceMappingURL=index.js.map
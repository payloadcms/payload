'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useCallback } from 'react';
import { useForm, useFormModified } from '../../forms/Form/index.js';
import { useAuth } from '../../providers/Auth/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { ConfirmationModal } from '../ConfirmationModal/index.js';
import { useModal } from '../Modal/index.js';
import { usePreventLeave } from './usePreventLeave.js';
const leaveWithoutSavingModalSlug = 'leave-without-saving';
export const LeaveWithoutSaving = t0 => {
  const $ = _c(17);
  const {
    disablePreventLeave: t1,
    onConfirm,
    onPrevent
  } = t0;
  const disablePreventLeave = t1 === undefined ? false : t1;
  const modalSlug = leaveWithoutSavingModalSlug;
  const {
    closeModal,
    openModal
  } = useModal();
  const modified = useFormModified();
  const {
    isValid
  } = useForm();
  const {
    user
  } = useAuth();
  const [hasAccepted, setHasAccepted] = React.useState(false);
  const prevent = !disablePreventLeave && Boolean((modified || !isValid) && user);
  let t2;
  if ($[0] !== onPrevent || $[1] !== openModal) {
    t2 = () => {
      const activeHref = document.activeElement?.href || null;
      if (onPrevent) {
        onPrevent(activeHref);
      }
      openModal(leaveWithoutSavingModalSlug);
    };
    $[0] = onPrevent;
    $[1] = openModal;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const handlePrevent = t2;
  let t3;
  if ($[3] !== closeModal) {
    t3 = () => {
      closeModal(leaveWithoutSavingModalSlug);
    };
    $[3] = closeModal;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const handleAccept = t3;
  let t4;
  if ($[5] !== handleAccept || $[6] !== handlePrevent || $[7] !== hasAccepted || $[8] !== prevent) {
    t4 = {
      hasAccepted,
      onAccept: handleAccept,
      onPrevent: handlePrevent,
      prevent
    };
    $[5] = handleAccept;
    $[6] = handlePrevent;
    $[7] = hasAccepted;
    $[8] = prevent;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  usePreventLeave(t4);
  let t5;
  if ($[10] !== closeModal) {
    t5 = () => {
      closeModal(leaveWithoutSavingModalSlug);
    };
    $[10] = closeModal;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  const onCancel = t5;
  let t6;
  if ($[12] !== onConfirm) {
    t6 = async () => {
      if (onConfirm) {
        ;
        try {
          await onConfirm();
        } catch (t7) {
          const err = t7;
          console.error("Error in LeaveWithoutSaving onConfirm:", err);
        }
      }
      setHasAccepted(true);
    };
    $[12] = onConfirm;
    $[13] = t6;
  } else {
    t6 = $[13];
  }
  const handleConfirm = t6;
  let t7;
  if ($[14] !== handleConfirm || $[15] !== onCancel) {
    t7 = _jsx(LeaveWithoutSavingModal, {
      modalSlug: leaveWithoutSavingModalSlug,
      onCancel,
      onConfirm: handleConfirm
    });
    $[14] = handleConfirm;
    $[15] = onCancel;
    $[16] = t7;
  } else {
    t7 = $[16];
  }
  return t7;
};
export const LeaveWithoutSavingModal = t0 => {
  const $ = _c(5);
  const {
    modalSlug,
    onCancel,
    onConfirm
  } = t0;
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== modalSlug || $[1] !== onCancel || $[2] !== onConfirm || $[3] !== t) {
    t1 = _jsx(ConfirmationModal, {
      body: t("general:changesNotSaved"),
      cancelLabel: t("general:stayOnThisPage"),
      confirmLabel: t("general:leaveAnyway"),
      heading: t("general:leaveWithoutSaving"),
      modalSlug,
      onCancel,
      onConfirm
    });
    $[0] = modalSlug;
    $[1] = onCancel;
    $[2] = onConfirm;
    $[3] = t;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
};
//# sourceMappingURL=index.js.map
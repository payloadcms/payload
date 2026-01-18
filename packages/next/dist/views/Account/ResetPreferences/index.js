'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, ConfirmationModal, toast, useConfig, useModal, useTranslation } from '@payloadcms/ui';
import { formatAdminURL } from 'payload/shared';
import * as qs from 'qs-esm';
import { Fragment, useCallback } from 'react';
const confirmResetModalSlug = 'confirm-reset-modal';
export const ResetPreferences = t0 => {
  const $ = _c(9);
  const {
    user
  } = t0;
  const {
    openModal
  } = useModal();
  const {
    t
  } = useTranslation();
  const {
    config: t1
  } = useConfig();
  const {
    routes: t2
  } = t1;
  const {
    api: apiRoute
  } = t2;
  let t3;
  if ($[0] !== apiRoute || $[1] !== user) {
    t3 = async () => {
      if (!user) {
        return;
      }
      const stringifiedQuery = qs.stringify({
        depth: 0,
        where: {
          user: {
            id: {
              equals: user.id
            }
          }
        }
      }, {
        addQueryPrefix: true
      });
      ;
      try {
        const res = await fetch(formatAdminURL({
          apiRoute,
          path: `/payload-preferences${stringifiedQuery}`
        }), {
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          method: "DELETE"
        });
        const json = await res.json();
        const message = json.message;
        if (res.ok) {
          toast.success(message);
        } else {
          toast.error(message);
        }
      } catch (t4) {
        const _err = t4;
      }
    };
    $[0] = apiRoute;
    $[1] = user;
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  const handleResetPreferences = t3;
  let t4;
  if ($[3] !== openModal) {
    t4 = () => openModal(confirmResetModalSlug);
    $[3] = openModal;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  let t5;
  if ($[5] !== handleResetPreferences || $[6] !== t || $[7] !== t4) {
    t5 = _jsxs(Fragment, {
      children: [_jsx("div", {
        children: _jsx(Button, {
          buttonStyle: "secondary",
          onClick: t4,
          children: t("general:resetPreferences")
        })
      }), _jsx(ConfirmationModal, {
        body: t("general:resetPreferencesDescription"),
        confirmingLabel: t("general:resettingPreferences"),
        heading: t("general:resetPreferences"),
        modalSlug: confirmResetModalSlug,
        onConfirm: handleResetPreferences
      })]
    });
    $[5] = handleResetPreferences;
    $[6] = t;
    $[7] = t4;
    $[8] = t5;
  } else {
    t5 = $[8];
  }
  return t5;
};
//# sourceMappingURL=index.js.map
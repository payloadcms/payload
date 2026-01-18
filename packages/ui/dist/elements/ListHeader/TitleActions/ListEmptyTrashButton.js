'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { getTranslation } from '@payloadcms/translations';
import { useRouter, useSearchParams } from 'next/navigation.js';
import { formatAdminURL } from 'payload/shared';
import * as qs from 'qs-esm';
import React from 'react';
import { toast } from 'sonner';
import { useConfig } from '../../../providers/Config/index.js';
import { useLocale } from '../../../providers/Locale/index.js';
import { useRouteCache } from '../../../providers/RouteCache/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { requests } from '../../../utilities/api.js';
import { Button } from '../../Button/index.js';
import { ConfirmationModal } from '../../ConfirmationModal/index.js';
import { Translation } from '../../Translation/index.js';
const confirmEmptyTrashSlug = 'confirm-empty-trash';
export function ListEmptyTrashButton({
  collectionConfig,
  hasDeletePermission
}) {
  const {
    i18n,
    t
  } = useTranslation();
  const {
    code: locale
  } = useLocale();
  const {
    config
  } = useConfig();
  const {
    openModal
  } = useModal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    clearRouteCache
  } = useRouteCache();
  const [trashCount, setTrashCount] = React.useState(null);
  React.useEffect(() => {
    const fetchTrashCount = async () => {
      const queryString = qs.stringify({
        depth: 0,
        limit: 0,
        locale,
        trash: true,
        where: {
          deletedAt: {
            exists: true
          }
        }
      }, {
        addQueryPrefix: true
      });
      try {
        const res = await requests.get(formatAdminURL({
          apiRoute: config.routes.api,
          path: `/${collectionConfig.slug}${queryString}`
        }), {
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/json'
          }
        });
        const json = await res.json();
        setTrashCount(json?.totalDocs ?? 0);
      } catch {
        setTrashCount(0);
      }
    };
    void fetchTrashCount();
  }, [collectionConfig.slug, config, i18n.language, locale]);
  const handleEmptyTrash = React.useCallback(async () => {
    if (!hasDeletePermission) {
      return;
    }
    const {
      slug,
      labels
    } = collectionConfig;
    const queryString_0 = qs.stringify({
      limit: 0,
      locale,
      trash: true,
      where: {
        deletedAt: {
          exists: true
        }
      }
    }, {
      addQueryPrefix: true
    });
    const res_0 = await requests.delete(formatAdminURL({
      apiRoute: config.routes.api,
      path: `/${slug}${queryString_0}`
    }), {
      headers: {
        'Accept-Language': i18n.language,
        'Content-Type': 'application/json'
      }
    });
    try {
      const json_0 = await res_0.json();
      const deletedCount = json_0?.docs?.length || 0;
      if (res_0.status < 400) {
        toast.success(t('general:permanentlyDeletedCountSuccessfully', {
          count: deletedCount,
          label: getTranslation(labels?.plural, i18n)
        }));
      }
      if (json_0?.errors?.length > 0) {
        toast.error(json_0.message, {
          description: json_0.errors.map(err => err.message).join('\n')
        });
      }
      router.replace(qs.stringify({
        ...Object.fromEntries(searchParams.entries()),
        page: '1'
      }, {
        addQueryPrefix: true
      }));
      clearRouteCache();
    } catch {
      toast.error(t('error:unknown'));
    }
  }, [collectionConfig, config, hasDeletePermission, i18n, t, locale, searchParams, router, clearRouteCache]);
  return /*#__PURE__*/_jsxs(React.Fragment, {
    children: [/*#__PURE__*/_jsx(Button, {
      "aria-label": t('general:emptyTrashLabel', {
        label: getTranslation(collectionConfig?.labels?.plural, i18n)
      }),
      buttonStyle: "pill",
      disabled: trashCount === 0,
      id: "empty-trash-button",
      onClick: () => {
        openModal(confirmEmptyTrashSlug);
      },
      size: "small",
      children: t('general:emptyTrash')
    }, "empty-trash-button"), /*#__PURE__*/_jsx(ConfirmationModal, {
      body: /*#__PURE__*/_jsx(Translation, {
        elements: {
          '0': ({
            children
          }) => /*#__PURE__*/_jsx("strong", {
            children: children
          }),
          '1': ({
            children: children_0
          }) => /*#__PURE__*/_jsx("strong", {
            children: children_0
          })
        },
        i18nKey: "general:aboutToPermanentlyDeleteTrash",
        t: t,
        variables: {
          count: trashCount ?? 0,
          label: getTranslation(trashCount === 1 ? collectionConfig.labels?.singular : collectionConfig.labels?.plural, i18n)
        }
      }),
      confirmingLabel: t('general:deleting'),
      heading: t('general:confirmDeletion'),
      modalSlug: confirmEmptyTrashSlug,
      onConfirm: handleEmptyTrash
    })]
  });
}
//# sourceMappingURL=ListEmptyTrashButton.js.map
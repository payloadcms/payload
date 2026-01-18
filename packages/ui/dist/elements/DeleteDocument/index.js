'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { getTranslation } from '@payloadcms/translations';
import { useRouter } from 'next/navigation.js';
import { formatAdminURL } from 'payload/shared';
import React, { Fragment, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { CheckboxInput } from '../../fields/Checkbox/Input.js';
import { useForm } from '../../forms/Form/context.js';
import { useConfig } from '../../providers/Config/index.js';
import { useDocumentTitle } from '../../providers/DocumentTitle/index.js';
import { useRouteTransition } from '../../providers/RouteTransition/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { requests } from '../../utilities/api.js';
import { ConfirmationModal } from '../ConfirmationModal/index.js';
import { PopupList } from '../Popup/index.js';
import { Translation } from '../Translation/index.js';
import './index.scss';
const baseClass = 'delete-document';
export const DeleteDocument = props => {
  const {
    id,
    buttonId,
    collectionSlug,
    onDelete,
    redirectAfterDelete = true,
    singularLabel,
    title: titleFromProps
  } = props;
  const {
    config: {
      routes: {
        admin: adminRoute,
        api
      }
    },
    getEntityConfig
  } = useConfig();
  const collectionConfig = getEntityConfig({
    collectionSlug
  });
  const {
    setModified
  } = useForm();
  const router = useRouter();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    title
  } = useDocumentTitle();
  const {
    startRouteTransition
  } = useRouteTransition();
  const {
    openModal
  } = useModal();
  const modalSlug = `delete-${id}`;
  const [deletePermanently, setDeletePermanently] = useState(false);
  const addDefaultError = useCallback(() => {
    toast.error(t('error:deletingTitle', {
      title
    }));
  }, [t, title]);
  const handleDelete = useCallback(async () => {
    setModified(false);
    try {
      const url = formatAdminURL({
        apiRoute: api,
        path: `/${collectionSlug}/${id}`
      });
      const res = deletePermanently || !collectionConfig.trash ? await requests.delete(url, {
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/json'
        }
      }) : await requests.patch(url, {
        body: JSON.stringify({
          deletedAt: new Date().toISOString()
        }),
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/json'
        }
      });
      const json = await res.json();
      if (res.status < 400) {
        toast.success(t(deletePermanently || !collectionConfig.trash ? 'general:titleDeleted' : 'general:titleTrashed', {
          label: getTranslation(singularLabel, i18n),
          title
        }) || json.message);
        if (redirectAfterDelete) {
          return startRouteTransition(() => router.push(formatAdminURL({
            adminRoute,
            path: `/collections/${collectionSlug}`
          })));
        }
        if (typeof onDelete === 'function') {
          await onDelete({
            id,
            collectionConfig
          });
        }
        return;
      }
      if (json.errors) {
        json.errors.forEach(error => toast.error(error.message));
      } else {
        addDefaultError();
      }
      return;
    } catch (_err) {
      return addDefaultError();
    }
  }, [deletePermanently, setModified, api, collectionSlug, id, t, singularLabel, addDefaultError, i18n, title, router, adminRoute, redirectAfterDelete, onDelete, collectionConfig, startRouteTransition]);
  if (id) {
    return /*#__PURE__*/_jsxs(Fragment, {
      children: [/*#__PURE__*/_jsx(PopupList.Button, {
        id: buttonId,
        onClick: () => {
          openModal(modalSlug);
        },
        children: t('general:delete')
      }), /*#__PURE__*/_jsx(ConfirmationModal, {
        body: /*#__PURE__*/_jsxs(Fragment, {
          children: [/*#__PURE__*/_jsx(Translation, {
            elements: {
              '1': ({
                children
              }) => /*#__PURE__*/_jsx("strong", {
                children: children
              })
            },
            i18nKey: collectionConfig.trash ? 'general:aboutToTrash' : 'general:aboutToDelete',
            t: t,
            variables: {
              label: getTranslation(singularLabel, i18n),
              title: titleFromProps || title || id
            }
          }), collectionConfig.trash && /*#__PURE__*/_jsx("div", {
            className: `${baseClass}__checkbox`,
            children: /*#__PURE__*/_jsx(CheckboxInput, {
              checked: deletePermanently,
              id: "delete-forever",
              label: t('general:deletePermanently'),
              name: "delete-forever",
              onToggle: e => setDeletePermanently(e.target.checked)
            })
          })]
        }),
        className: baseClass,
        confirmingLabel: t('general:deleting'),
        heading: t('general:confirmDeletion'),
        modalSlug: modalSlug,
        onConfirm: handleDelete
      })]
    });
  }
  return null;
};
//# sourceMappingURL=index.js.map
'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { formatAdminURL } from 'payload/shared';
import React, { useCallback } from 'react';
import { toast } from 'sonner';
import { useForm } from '../../forms/Form/context.js';
import { useConfig } from '../../providers/Config/index.js';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { useLocale } from '../../providers/Locale/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { requests } from '../../utilities/api.js';
import { Button } from '../Button/index.js';
import { ConfirmationModal } from '../ConfirmationModal/index.js';
import './index.scss';
const baseClass = 'status';
export const Status = () => {
  const {
    id,
    collectionSlug,
    docPermissions,
    globalSlug,
    hasPublishedDoc,
    incrementVersionCount,
    isTrashed,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    unpublishedVersionCount
  } = useDocumentInfo();
  const {
    toggleModal
  } = useModal();
  const {
    config: {
      routes: {
        api
      }
    }
  } = useConfig();
  const {
    reset: resetForm
  } = useForm();
  const {
    code: locale
  } = useLocale();
  const {
    i18n,
    t
  } = useTranslation();
  const unPublishModalSlug = `confirm-un-publish-${id}`;
  const revertModalSlug = `confirm-revert-${id}`;
  let statusToRender;
  if (unpublishedVersionCount > 0 && hasPublishedDoc) {
    statusToRender = 'changed';
  } else if (!hasPublishedDoc) {
    statusToRender = 'draft';
  } else if (hasPublishedDoc && unpublishedVersionCount <= 0) {
    statusToRender = 'published';
  }
  const displayStatusKey = isTrashed ? hasPublishedDoc ? 'previouslyPublished' : 'previouslyDraft' : statusToRender;
  const performAction = useCallback(async action => {
    let url;
    let method;
    let body;
    if (action === 'unpublish') {
      body = {
        _status: 'draft'
      };
    }
    if (collectionSlug) {
      url = formatAdminURL({
        apiRoute: api,
        path: `/${collectionSlug}/${id}?locale=${locale}&fallback-locale=null&depth=0`
      });
      method = 'patch';
    }
    if (globalSlug) {
      url = formatAdminURL({
        apiRoute: api,
        path: `/globals/${globalSlug}?locale=${locale}&fallback-locale=null&depth=0`
      });
      method = 'post';
    }
    if (action === 'revert') {
      const publishedDoc = await requests.get(url, {
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/json'
        }
      }).then(res => res.json());
      body = publishedDoc;
    }
    const res_0 = await requests[method](url, {
      body: JSON.stringify(body),
      headers: {
        'Accept-Language': i18n.language,
        'Content-Type': 'application/json'
      }
    });
    if (res_0.status === 200) {
      let data;
      const json = await res_0.json();
      if (globalSlug) {
        data = json.result;
      } else if (collectionSlug) {
        data = json.doc;
      }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      resetForm(data);
      toast.success(json.message);
      incrementVersionCount();
      setMostRecentVersionIsAutosaved(false);
      if (action === 'unpublish') {
        setHasPublishedDoc(false);
      } else if (action === 'revert') {
        setUnpublishedVersionCount(0);
      }
    } else {
      try {
        const json_0 = await res_0.json();
        if (json_0.errors?.[0]?.message) {
          toast.error(json_0.errors[0].message);
        } else if (json_0.error) {
          toast.error(json_0.error);
        } else {
          toast.error(t('error:unPublishingDocument'));
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        toast.error(t('error:unPublishingDocument'));
      }
    }
  }, [api, collectionSlug, globalSlug, id, i18n.language, incrementVersionCount, locale, resetForm, setUnpublishedVersionCount, setMostRecentVersionIsAutosaved, t, setHasPublishedDoc]);
  const canUpdate = docPermissions?.update;
  if (statusToRender) {
    return /*#__PURE__*/_jsx("div", {
      className: baseClass,
      title: `${t('version:status')}: ${t(`version:${displayStatusKey}`)}`,
      children: /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__value-wrap`,
        children: [/*#__PURE__*/_jsxs("span", {
          className: `${baseClass}__label`,
          children: [t('version:status'), ": "]
        }), /*#__PURE__*/_jsx("span", {
          className: `${baseClass}__value`,
          children: t(`version:${displayStatusKey}`)
        }), !isTrashed && canUpdate && statusToRender === 'published' && /*#__PURE__*/_jsxs(React.Fragment, {
          children: [" — ", /*#__PURE__*/_jsx(Button, {
            buttonStyle: "none",
            className: `${baseClass}__action`,
            id: `action-unpublish`,
            onClick: () => toggleModal(unPublishModalSlug),
            children: t('version:unpublish')
          }), /*#__PURE__*/_jsx(ConfirmationModal, {
            body: t('version:aboutToUnpublish'),
            confirmingLabel: t('version:unpublishing'),
            heading: t('version:confirmUnpublish'),
            modalSlug: unPublishModalSlug,
            onConfirm: () => performAction('unpublish')
          })]
        }), !isTrashed && canUpdate && hasPublishedDoc && statusToRender === 'changed' && /*#__PURE__*/_jsxs(React.Fragment, {
          children: [" — ", /*#__PURE__*/_jsx(Button, {
            buttonStyle: "none",
            className: `${baseClass}__action`,
            id: "action-revert-to-published",
            onClick: () => toggleModal(revertModalSlug),
            children: t('version:revertToPublished')
          }), /*#__PURE__*/_jsx(ConfirmationModal, {
            body: t('version:aboutToRevertToPublished'),
            confirmingLabel: t('version:reverting'),
            heading: t('version:confirmRevertToSaved'),
            modalSlug: revertModalSlug,
            onConfirm: () => performAction('revert')
          })]
        })]
      })
    });
  }
  return null;
};
//# sourceMappingURL=index.js.map
'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { formatFilesize } from 'payload/shared';
import React from 'react';
import { Button } from '../../../elements/Button/index.js';
import { useDocumentDrawer } from '../../../elements/DocumentDrawer/index.js';
import { Pill } from '../../../elements/Pill/index.js';
import { ThumbnailComponent } from '../../../elements/Thumbnail/index.js';
import './index.scss';
import { useConfig } from '../../../providers/Config/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
const baseClass = 'upload-relationship-details';
export function RelationshipContent(props) {
  const $ = _c(11);
  const {
    id,
    allowEdit,
    allowRemove,
    alt,
    byteSize,
    className,
    collectionSlug,
    displayPreview,
    filename,
    mimeType,
    onRemove,
    reloadDoc,
    showCollectionSlug: t0,
    src,
    thumbnailSrc,
    updatedAt,
    withMeta: t1,
    x,
    y
  } = props;
  const showCollectionSlug = t0 === undefined ? false : t0;
  const withMeta = t1 === undefined ? true : t1;
  const {
    config
  } = useConfig();
  const {
    i18n
  } = useTranslation();
  const collectionConfig = "collections" in config ? config.collections.find(collection => collection.slug === collectionSlug) : undefined;
  const t2 = id ?? undefined;
  let t3;
  if ($[0] !== collectionSlug || $[1] !== t2) {
    t3 = {
      id: t2,
      collectionSlug
    };
    $[0] = collectionSlug;
    $[1] = t2;
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  const [DocumentDrawer,, t4] = useDocumentDrawer(t3);
  const {
    openDrawer
  } = t4;
  let t5;
  if ($[3] !== collectionSlug || $[4] !== reloadDoc) {
    t5 = async t6 => {
      const {
        doc
      } = t6;
      return reloadDoc(doc.id, collectionSlug);
    };
    $[3] = collectionSlug;
    $[4] = reloadDoc;
    $[5] = t5;
  } else {
    t5 = $[5];
  }
  const onSave = t5;
  let t6;
  if ($[6] !== x || $[7] !== y) {
    t6 = function generateMetaText(mimeType_0, size) {
      const sections = [];
      if (size) {
        sections.push(formatFilesize(size));
      }
      if (x && y) {
        sections.push(`${x}x${y}`);
      }
      if (mimeType_0) {
        sections.push(mimeType_0);
      }
      return sections.join(" \u2014 ");
    };
    $[6] = x;
    $[7] = y;
    $[8] = t6;
  } else {
    t6 = $[8];
  }
  const generateMetaText = t6;
  const metaText = withMeta ? generateMetaText(mimeType, byteSize) : "";
  const previewAllowed = displayPreview ?? collectionConfig?.upload?.displayPreview ?? true;
  let t7;
  if ($[9] !== className) {
    t7 = [baseClass, className].filter(Boolean);
    $[9] = className;
    $[10] = t7;
  } else {
    t7 = $[10];
  }
  return _jsxs("div", {
    className: t7.join(" "),
    children: [_jsxs("div", {
      className: `${baseClass}__imageAndDetails`,
      children: [previewAllowed && _jsx(ThumbnailComponent, {
        alt,
        className: `${baseClass}__thumbnail`,
        filename,
        fileSrc: thumbnailSrc,
        imageCacheTag: collectionConfig?.upload?.cacheTags && updatedAt,
        size: "small"
      }), showCollectionSlug && collectionConfig ? _jsx(Pill, {
        size: "small",
        children: getTranslation(collectionConfig.labels.singular, i18n)
      }) : null, _jsxs("div", {
        className: `${baseClass}__details`,
        children: [_jsx("p", {
          className: `${baseClass}__filename`,
          children: src ? _jsx("a", {
            href: src,
            target: "_blank",
            children: filename
          }) : filename
        }), withMeta ? _jsx("p", {
          className: `${baseClass}__meta`,
          children: metaText
        }) : null]
      })]
    }), allowEdit !== false || allowRemove !== false ? _jsxs("div", {
      className: `${baseClass}__actions`,
      children: [allowEdit !== false ? _jsx(Button, {
        buttonStyle: "icon-label",
        className: `${baseClass}__edit`,
        icon: "edit",
        iconStyle: "none",
        onClick: openDrawer
      }) : null, allowRemove !== false ? _jsx(Button, {
        buttonStyle: "icon-label",
        className: `${baseClass}__remove`,
        icon: "x",
        iconStyle: "none",
        onClick: () => onRemove()
      }) : null, _jsx(DocumentDrawer, {
        onSave
      })]
    }) : null]
  });
}
//# sourceMappingURL=index.js.map
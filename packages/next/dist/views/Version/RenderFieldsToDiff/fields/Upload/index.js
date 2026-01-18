import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { FieldDiffContainer, File, getHTMLDiffComponents } from '@payloadcms/ui/rsc';
import React from 'react';
const baseClass = 'upload-diff';
export const Upload = args => {
  const {
    comparisonValue: valueFrom,
    field,
    i18n,
    locale,
    nestingLevel,
    req,
    versionValue: valueTo
  } = args;
  const hasMany = 'hasMany' in field && field.hasMany && Array.isArray(valueTo);
  const polymorphic = Array.isArray(field.relationTo);
  if (hasMany) {
    return /*#__PURE__*/_jsx(HasManyUploadDiff, {
      field: field,
      i18n: i18n,
      locale: locale,
      nestingLevel: nestingLevel,
      polymorphic: polymorphic,
      req: req,
      valueFrom: valueFrom,
      valueTo: valueTo
    });
  }
  return /*#__PURE__*/_jsx(SingleUploadDiff, {
    field: field,
    i18n: i18n,
    locale: locale,
    nestingLevel: nestingLevel,
    polymorphic: polymorphic,
    req: req,
    valueFrom: valueFrom,
    valueTo: valueTo
  });
};
export const HasManyUploadDiff = async args => {
  const {
    field,
    i18n,
    locale,
    nestingLevel,
    polymorphic,
    req,
    valueFrom,
    valueTo
  } = args;
  const ReactDOMServer = (await import('react-dom/server')).default;
  let From = '';
  let To = '';
  const showCollectionSlug = Array.isArray(field.relationTo);
  const getUploadDocKey = uploadDoc => {
    if (typeof uploadDoc === 'object' && 'relationTo' in uploadDoc) {
      // Polymorphic case
      const value = uploadDoc.value;
      return typeof value === 'object' ? value.id : value;
    }
    // Non-polymorphic case
    return typeof uploadDoc === 'object' ? uploadDoc.id : uploadDoc;
  };
  const FromComponents = valueFrom ? valueFrom.map(uploadDoc => /*#__PURE__*/_jsx(UploadDocumentDiff, {
    i18n: i18n,
    polymorphic: polymorphic,
    relationTo: field.relationTo,
    req: req,
    showCollectionSlug: showCollectionSlug,
    uploadDoc: uploadDoc
  }, getUploadDocKey(uploadDoc))) : null;
  const ToComponents = valueTo ? valueTo.map(uploadDoc => /*#__PURE__*/_jsx(UploadDocumentDiff, {
    i18n: i18n,
    polymorphic: polymorphic,
    relationTo: field.relationTo,
    req: req,
    showCollectionSlug: showCollectionSlug,
    uploadDoc: uploadDoc
  }, getUploadDocKey(uploadDoc))) : null;
  const diffResult = getHTMLDiffComponents({
    fromHTML: `<div class="${baseClass}-hasMany">` + (FromComponents ? FromComponents.map(component => `<div>${ReactDOMServer.renderToStaticMarkup(component)}</div>`).join('') : '') + '</div>',
    toHTML: `<div class="${baseClass}-hasMany">` + (ToComponents ? ToComponents.map(component => `<div>${ReactDOMServer.renderToStaticMarkup(component)}</div>`).join('') : '') + '</div>',
    tokenizeByCharacter: false
  });
  From = diffResult.From;
  To = diffResult.To;
  return /*#__PURE__*/_jsx(FieldDiffContainer, {
    className: `${baseClass}-container ${baseClass}-container--hasMany`,
    From: From,
    i18n: i18n,
    label: {
      label: field.label,
      locale
    },
    nestingLevel: nestingLevel,
    To: To
  });
};
export const SingleUploadDiff = async args => {
  const {
    field,
    i18n,
    locale,
    nestingLevel,
    polymorphic,
    req,
    valueFrom,
    valueTo
  } = args;
  const ReactDOMServer = (await import('react-dom/server')).default;
  let From = '';
  let To = '';
  const showCollectionSlug = Array.isArray(field.relationTo);
  const FromComponent = valueFrom ? /*#__PURE__*/_jsx(UploadDocumentDiff, {
    i18n: i18n,
    polymorphic: polymorphic,
    relationTo: field.relationTo,
    req: req,
    showCollectionSlug: showCollectionSlug,
    uploadDoc: valueFrom
  }) : null;
  const ToComponent = valueTo ? /*#__PURE__*/_jsx(UploadDocumentDiff, {
    i18n: i18n,
    polymorphic: polymorphic,
    relationTo: field.relationTo,
    req: req,
    showCollectionSlug: showCollectionSlug,
    uploadDoc: valueTo
  }) : null;
  const fromHtml = FromComponent ? ReactDOMServer.renderToStaticMarkup(FromComponent) : '<p>' + '' + '</p>';
  const toHtml = ToComponent ? ReactDOMServer.renderToStaticMarkup(ToComponent) : '<p>' + '' + '</p>';
  const diffResult = getHTMLDiffComponents({
    fromHTML: fromHtml,
    toHTML: toHtml,
    tokenizeByCharacter: false
  });
  From = diffResult.From;
  To = diffResult.To;
  return /*#__PURE__*/_jsx(FieldDiffContainer, {
    className: `${baseClass}-container ${baseClass}-container--hasOne`,
    From: From,
    i18n: i18n,
    label: {
      label: field.label,
      locale
    },
    nestingLevel: nestingLevel,
    To: To
  });
};
const UploadDocumentDiff = args => {
  const {
    i18n,
    polymorphic,
    relationTo,
    req,
    showCollectionSlug,
    uploadDoc
  } = args;
  let thumbnailSRC = '';
  const value = polymorphic ? uploadDoc.value : uploadDoc;
  if (value && typeof value === 'object' && 'thumbnailURL' in value) {
    thumbnailSRC = typeof value.thumbnailURL === 'string' && value.thumbnailURL || typeof value.url === 'string' && value.url || '';
  }
  let filename;
  if (value && typeof value === 'object') {
    filename = value.filename;
  } else {
    filename = `${i18n.t('general:untitled')} - ID: ${uploadDoc}`;
  }
  let pillLabel = null;
  if (showCollectionSlug) {
    let collectionSlug;
    if (polymorphic && typeof uploadDoc === 'object' && 'relationTo' in uploadDoc) {
      collectionSlug = uploadDoc.relationTo;
    } else {
      collectionSlug = typeof relationTo === 'string' ? relationTo : relationTo[0];
    }
    const uploadConfig = req.payload.collections[collectionSlug].config;
    pillLabel = uploadConfig.labels?.singular ? getTranslation(uploadConfig.labels.singular, i18n) : uploadConfig.slug;
  }
  let id;
  if (polymorphic && typeof uploadDoc === 'object' && 'relationTo' in uploadDoc) {
    const polyValue = uploadDoc.value;
    id = typeof polyValue === 'object' ? polyValue.id : polyValue;
  } else if (typeof uploadDoc === 'object' && 'id' in uploadDoc) {
    id = uploadDoc.id;
  } else if (typeof uploadDoc === 'string' || typeof uploadDoc === 'number') {
    id = uploadDoc;
  }
  const alt = value && typeof value === 'object' && value.alt || filename || '';
  return /*#__PURE__*/_jsx("div", {
    className: `${baseClass}`,
    "data-enable-match": "true",
    "data-id": id,
    "data-relation-to": relationTo,
    children: /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__card`,
      children: [/*#__PURE__*/_jsx("div", {
        className: `${baseClass}__thumbnail`,
        children: thumbnailSRC?.length ? /*#__PURE__*/_jsx("img", {
          alt: alt,
          src: thumbnailSRC
        }) : /*#__PURE__*/_jsx(File, {})
      }), pillLabel && /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__pill`,
        "data-enable-match": "false",
        children: /*#__PURE__*/_jsx("span", {
          children: pillLabel
        })
      }), /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__info`,
        "data-enable-match": "false",
        children: /*#__PURE__*/_jsx("strong", {
          children: filename
        })
      })]
    })
  });
};
//# sourceMappingURL=index.js.map
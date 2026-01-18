import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { File } from '@payloadcms/ui/rsc';
import { createHash } from 'crypto';
import { formatFilesize } from 'payload/shared';
import React from 'react';
const baseClass = 'lexical-upload-diff';
export const UploadDiffHTMLConverterAsync = () => {
  return {
    upload: async ({
      node,
      populate,
      providedCSSString
    }) => {
      const uploadNode = node;
      let uploadDoc = undefined;
      // If there's no valid upload data, populate return an empty string
      if (typeof uploadNode.value !== 'object') {
        if (!populate) {
          return '';
        }
        uploadDoc = await populate({
          id: uploadNode.value,
          collectionSlug: uploadNode.relationTo
        });
      } else {
        uploadDoc = uploadNode.value;
      }
      if (!uploadDoc) {
        return '';
      }
      const alt = node.fields?.alt || uploadDoc?.alt || '';
      const thumbnailSRC = 'thumbnailURL' in uploadDoc && uploadDoc?.thumbnailURL || uploadDoc?.url || '';
      const ReactDOMServer = (await import('react-dom/server')).default;
      // hash fields to ensure they are diffed if they change
      const nodeFieldsHash = createHash('sha256').update(JSON.stringify(node.fields ?? {})).digest('hex');
      const JSX = /*#__PURE__*/_jsx("div", {
        className: `${baseClass}${providedCSSString}`,
        "data-enable-match": "true",
        "data-fields-hash": `${nodeFieldsHash}`,
        "data-filename": uploadDoc?.filename,
        "data-lexical-upload-id": uploadNode.value,
        "data-lexical-upload-relation-to": uploadNode.relationTo,
        "data-src": thumbnailSRC,
        children: /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__card`,
          children: [/*#__PURE__*/_jsx("div", {
            className: `${baseClass}__thumbnail`,
            children: thumbnailSRC?.length ? /*#__PURE__*/_jsx("img", {
              alt: alt,
              src: thumbnailSRC
            }) : /*#__PURE__*/_jsx(File, {})
          }), /*#__PURE__*/_jsxs("div", {
            className: `${baseClass}__info`,
            "data-enable-match": "false",
            children: [/*#__PURE__*/_jsx("strong", {
              children: uploadDoc?.filename
            }), /*#__PURE__*/_jsxs("div", {
              className: `${baseClass}__meta`,
              children: [formatFilesize(uploadDoc?.filesize), typeof uploadDoc?.width === 'number' && typeof uploadDoc?.height === 'number' && /*#__PURE__*/_jsxs(React.Fragment, {
                children: [" - ", uploadDoc?.width, "x", uploadDoc?.height]
              }), uploadDoc?.mimeType && /*#__PURE__*/_jsxs(React.Fragment, {
                children: [" - ", uploadDoc?.mimeType]
              })]
            })]
          })]
        })
      });
      // Render to HTML
      const html = ReactDOMServer.renderToStaticMarkup(JSX);
      return html;
    }
  };
};
//# sourceMappingURL=index.js.map
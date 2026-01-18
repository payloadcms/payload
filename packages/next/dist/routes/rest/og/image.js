import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
import React from 'react';
export const OGImage = ({
  description,
  Fallback,
  fontFamily = 'Arial, sans-serif',
  Icon,
  importMap,
  leader,
  title
}) => {
  const IconComponent = RenderServerComponent({
    clientProps: {
      fill: 'white'
    },
    Component: Icon,
    Fallback,
    importMap
  });
  return /*#__PURE__*/_jsxs("div", {
    style: {
      backgroundColor: '#000',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily,
      height: '100%',
      justifyContent: 'space-between',
      padding: '100px',
      width: '100%'
    },
    children: [/*#__PURE__*/_jsxs("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        fontSize: 50,
        height: '100%'
      },
      children: [leader && /*#__PURE__*/_jsx("div", {
        style: {
          fontSize: 30,
          marginBottom: 10
        },
        children: leader
      }), /*#__PURE__*/_jsx("p", {
        style: {
          display: '-webkit-box',
          fontSize: 90,
          lineHeight: 1,
          marginBottom: 0,
          marginTop: 0,
          textOverflow: 'ellipsis',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2
        },
        children: title
      }), description && /*#__PURE__*/_jsx("p", {
        style: {
          display: '-webkit-box',
          flexGrow: 1,
          fontSize: 30,
          lineHeight: 1,
          marginBottom: 0,
          marginTop: 40,
          textOverflow: 'ellipsis',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2
        },
        children: description
      })]
    }), /*#__PURE__*/_jsx("div", {
      style: {
        alignItems: 'flex-end',
        display: 'flex',
        flexShrink: 0,
        height: '38px',
        justifyContent: 'center',
        width: '38px'
      },
      children: IconComponent
    })]
  });
};
//# sourceMappingURL=image.js.map
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { AlignCenterIcon } from '../../icons/AlignCenter/index.js';
import { AlignLeftIcon } from '../../icons/AlignLeft/index.js';
import { AlignRightIcon } from '../../icons/AlignRight/index.js';
import { ElementButton } from '../Button.js';
export const TextAlignElementButton = ()=>/*#__PURE__*/ _jsxs(React.Fragment, {
        children: [
            /*#__PURE__*/ _jsx(ElementButton, {
                format: "left",
                type: "textAlign",
                children: /*#__PURE__*/ _jsx(AlignLeftIcon, {})
            }),
            /*#__PURE__*/ _jsx(ElementButton, {
                format: "center",
                type: "textAlign",
                children: /*#__PURE__*/ _jsx(AlignCenterIcon, {})
            }),
            /*#__PURE__*/ _jsx(ElementButton, {
                format: "right",
                type: "textAlign",
                children: /*#__PURE__*/ _jsx(AlignRightIcon, {})
            })
        ]
    });

//# sourceMappingURL=Button.js.map
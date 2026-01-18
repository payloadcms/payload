'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
export const Pill = (props)=>{
    const { backgroundColor, color, label } = props;
    return /*#__PURE__*/ _jsx("div", {
        style: {
            backgroundColor,
            borderRadius: '2px',
            color,
            flexShrink: 0,
            lineHeight: 1,
            marginRight: '10px',
            padding: '4px 6px',
            whiteSpace: 'nowrap'
        },
        children: /*#__PURE__*/ _jsx("small", {
            children: label
        })
    });
};

//# sourceMappingURL=Pill.js.map
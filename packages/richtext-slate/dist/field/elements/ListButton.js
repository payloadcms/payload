'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useCallback } from 'react';
import { useSlate } from 'slate-react';
import '../buttons.scss';
import { isListActive } from './isListActive.js';
import { toggleList } from './toggleList.js';
export const baseClass = 'rich-text__button';
export const ListButton = ({ children, className, format, onClick })=>{
    const editor = useSlate();
    const defaultOnClick = useCallback((event)=>{
        event.preventDefault();
        toggleList(editor, format);
    }, [
        editor,
        format
    ]);
    return /*#__PURE__*/ _jsx("button", {
        className: [
            baseClass,
            className,
            isListActive(editor, format) && `${baseClass}__button--active`
        ].filter(Boolean).join(' '),
        onClick: onClick || defaultOnClick,
        type: "button",
        children: children
    });
};

//# sourceMappingURL=ListButton.js.map
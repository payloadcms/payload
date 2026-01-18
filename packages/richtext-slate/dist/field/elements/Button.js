'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Tooltip } from '@payloadcms/ui';
import React, { useCallback, useState } from 'react';
import { useSlate } from 'slate-react';
import '../buttons.scss';
import { useElementButton } from '../providers/ElementButtonProvider.js';
import { isElementActive } from './isActive.js';
import { toggleElement } from './toggle.js';
export const baseClass = 'rich-text__button';
export const ElementButton = (props)=>{
    const { type = 'type', children, className, disabled: disabledFromProps, el = 'button', format, onClick, tooltip } = props;
    const editor = useSlate();
    const { disabled: disabledFromContext } = useElementButton();
    const [showTooltip, setShowTooltip] = useState(false);
    const defaultOnClick = useCallback((event)=>{
        event.preventDefault();
        setShowTooltip(false);
        toggleElement(editor, format, type);
    }, [
        editor,
        format,
        type
    ]);
    const Tag = el;
    const disabled = disabledFromProps || disabledFromContext;
    return /*#__PURE__*/ _jsxs(Tag, {
        ...el === 'button' && {
            type: 'button',
            disabled
        },
        className: [
            baseClass,
            className,
            isElementActive(editor, format, type) && `${baseClass}__button--active`
        ].filter(Boolean).join(' '),
        onClick: onClick || defaultOnClick,
        onPointerEnter: ()=>setShowTooltip(true),
        onPointerLeave: ()=>setShowTooltip(false),
        children: [
            tooltip && /*#__PURE__*/ _jsx(Tooltip, {
                show: showTooltip,
                children: tooltip
            }),
            children
        ]
    });
};

//# sourceMappingURL=Button.js.map
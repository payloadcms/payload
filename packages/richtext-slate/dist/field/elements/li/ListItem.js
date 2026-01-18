'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useElement } from '../../providers/ElementProvider.js';
import { listTypes } from '../listTypes.js';
export const ListItemElement = ()=>{
    const { attributes, children, element } = useElement();
    const listType = typeof element.children?.[0]?.type === 'string' ? element.children[0].type : '';
    const disableListStyle = element.children.length >= 1 && listTypes.includes(listType);
    return /*#__PURE__*/ _jsx("li", {
        style: {
            listStyle: disableListStyle ? 'none' : undefined,
            listStylePosition: disableListStyle ? 'outside' : undefined
        },
        ...attributes,
        children: children
    });
};

//# sourceMappingURL=ListItem.js.map
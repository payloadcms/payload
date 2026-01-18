'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use } from 'react';
const SlatePropsContext = /*#__PURE__*/ createContext(undefined);
export function SlatePropsProvider({ children, schemaPath }) {
    return /*#__PURE__*/ _jsx(SlatePropsContext, {
        value: {
            schemaPath
        },
        children: children
    });
}
export function useSlateProps() {
    const context = use(SlatePropsContext);
    if (!context) {
        throw new Error('useSlateProps must be used within SlatePropsProvider');
    }
    return context;
}

//# sourceMappingURL=SlatePropsProvider.js.map
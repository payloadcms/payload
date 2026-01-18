'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const LeafButtonContext = /*#__PURE__*/ React.createContext({
    fieldProps: {},
    path: '',
    schemaPath: ''
});
export const LeafButtonProvider = (props)=>{
    const { children, ...rest } = props;
    return /*#__PURE__*/ _jsx(LeafButtonContext, {
        value: {
            ...rest
        },
        children: children
    });
};
export const useLeafButton = ()=>{
    const path = React.use(LeafButtonContext);
    return path;
};

//# sourceMappingURL=LeafButtonProvider.js.map
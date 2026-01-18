'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const LeafContext = /*#__PURE__*/ React.createContext({
    attributes: {},
    children: null,
    editorRef: null,
    fieldProps: {},
    leaf: '',
    path: '',
    schemaPath: ''
});
export const LeafProvider = (props)=>{
    const { children, result, ...rest } = props;
    return /*#__PURE__*/ _jsx(LeafContext, {
        value: {
            ...rest,
            children: result
        },
        children: children
    });
};
export const useLeaf = ()=>{
    const path = React.use(LeafContext);
    return path;
};

//# sourceMappingURL=LeafProvider.js.map
'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const ElementContext = /*#__PURE__*/ React.createContext({
    attributes: {},
    children: null,
    editorRef: null,
    element: {},
    fieldProps: {},
    path: '',
    schemaPath: ''
});
export const ElementProvider = (props)=>{
    const { childNodes, children, ...rest } = props;
    return /*#__PURE__*/ _jsx(ElementContext, {
        value: {
            ...rest,
            children: childNodes
        },
        children: children
    });
};
export const useElement = ()=>{
    return React.use(ElementContext);
};

//# sourceMappingURL=ElementProvider.js.map
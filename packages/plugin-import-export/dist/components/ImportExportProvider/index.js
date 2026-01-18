'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use, useCallback, useState } from 'react';
export const ImportExportContext = /*#__PURE__*/ createContext({});
export const ImportExportProvider = ({ children })=>{
    const [collection, setCollectionState] = useState('');
    const setCollection = useCallback((collection)=>{
        setCollectionState(collection);
    }, []);
    return /*#__PURE__*/ _jsx(ImportExportContext, {
        value: {
            collection,
            setCollection
        },
        children: children
    });
};
export const useImportExport = ()=>use(ImportExportContext);

//# sourceMappingURL=index.js.map
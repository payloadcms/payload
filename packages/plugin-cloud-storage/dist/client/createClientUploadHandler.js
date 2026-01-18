'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useConfig, useEffectEvent, useUploadHandlers } from '@payloadcms/ui';
import { Fragment, useEffect } from 'react';
export const createClientUploadHandler = ({ handler })=>{
    return function ClientUploadHandler({ children, collectionSlug, enabled, extra, prefix, serverHandlerPath }) {
        const { setUploadHandler } = useUploadHandlers();
        const { config: { routes: { api: apiRoute }, serverURL } } = useConfig();
        const initializeHandler = useEffectEvent(()=>{
            if (enabled) {
                setUploadHandler({
                    collectionSlug,
                    handler: ({ file, updateFilename })=>{
                        return handler({
                            apiRoute,
                            collectionSlug,
                            extra,
                            file,
                            prefix,
                            serverHandlerPath,
                            serverURL,
                            updateFilename
                        });
                    }
                });
            }
        });
        useEffect(()=>{
            initializeHandler();
        }, []);
        return /*#__PURE__*/ _jsx(Fragment, {
            children: children
        });
    };
};

//# sourceMappingURL=createClientUploadHandler.js.map
'use client';
import { ready, subscribe, unsubscribe } from '@payloadcms/live-preview';
import { useCallback, useEffect, useRef, useState } from 'react';
/**
 * This is a React hook to implement {@link https://payloadcms.com/docs/live-preview/overview Payload Live Preview}.
 *
 * @link https://payloadcms.com/docs/live-preview/frontend
 */ // NOTE: cannot use Record<string, unknown> here bc generated interfaces will not satisfy the type constraint
export const useLivePreview = (props)=>{
    const { apiRoute, depth, initialData, serverURL } = props;
    const [data, setData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(true);
    const hasSentReadyMessage = useRef(false);
    const onChange = useCallback((mergedData)=>{
        setData(mergedData);
        setIsLoading(false);
    }, []);
    useEffect(()=>{
        const subscription = subscribe({
            apiRoute,
            callback: onChange,
            depth,
            initialData,
            serverURL
        });
        if (!hasSentReadyMessage.current) {
            hasSentReadyMessage.current = true;
            ready({
                serverURL
            });
        }
        return ()=>{
            unsubscribe(subscription);
        };
    }, [
        serverURL,
        onChange,
        depth,
        initialData,
        apiRoute
    ]);
    return {
        data,
        isLoading
    };
};

//# sourceMappingURL=useLivePreview.js.map
import { handleMessage, resetCache } from './handleMessage.js';
export const subscribe = (args)=>{
    const { apiRoute, callback, depth, initialData, requestHandler, serverURL } = args;
    // Ensure previous subscription state does not leak across navigations
    // by clearing the internal cached data before subscribing.
    resetCache();
    const onMessage = async (event)=>{
        const mergedData = await handleMessage({
            apiRoute,
            depth,
            event,
            initialData,
            requestHandler,
            serverURL
        });
        callback(mergedData);
    };
    if (typeof window !== 'undefined') {
        window.addEventListener('message', onMessage);
    }
    return onMessage;
};

//# sourceMappingURL=subscribe.js.map
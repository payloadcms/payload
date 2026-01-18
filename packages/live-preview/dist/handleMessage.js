import { isLivePreviewEvent } from './isLivePreviewEvent.js';
import { mergeData } from './mergeData.js';
const _payloadLivePreview = {
    /**
   * Each time the data is merged, cache the result as a `previousData` variable
   * This will ensure changes compound overtop of each other
   */ previousData: undefined
};
// Reset the internal cached merged data. This is useful when navigating
// between routes where a new subscription should not inherit prior data.
export const resetCache = ()=>{
    _payloadLivePreview.previousData = undefined;
};
export const handleMessage = async (args)=>{
    const { apiRoute, depth, event, initialData, requestHandler, serverURL } = args;
    if (isLivePreviewEvent(event, serverURL)) {
        const { collectionSlug, data, globalSlug, locale } = event.data;
        // Only attempt to merge when we have a clear target
        // Either a collectionSlug or a globalSlug must be present
        if (!collectionSlug && !globalSlug) {
            return initialData;
        }
        const mergedData = await mergeData({
            apiRoute,
            collectionSlug,
            depth,
            globalSlug,
            incomingData: data,
            initialData: _payloadLivePreview?.previousData || initialData,
            locale,
            requestHandler,
            serverURL
        });
        _payloadLivePreview.previousData = mergedData;
        return mergedData;
    }
    if (!_payloadLivePreview.previousData) {
        _payloadLivePreview.previousData = initialData;
    }
    return _payloadLivePreview.previousData;
};

//# sourceMappingURL=handleMessage.js.map
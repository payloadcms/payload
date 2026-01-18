export const isLivePreviewEvent = (event, serverURL)=>event.origin === serverURL && event.data && typeof event.data === 'object' && event.data.type === 'payload-live-preview';

//# sourceMappingURL=isLivePreviewEvent.js.map
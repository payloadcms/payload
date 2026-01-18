export const isDocumentEvent = (event, serverURL)=>event.origin === serverURL && event.data && typeof event.data === 'object' && event.data.type === 'payload-document-event';

//# sourceMappingURL=isDocumentEvent.js.map
export const isDocumentEvent = (event: MessageEvent, serverURL: string): boolean =>
  event.origin === serverURL &&
  event.data &&
  typeof event.data === 'object' &&
  event.data.type === 'payload-document-event'

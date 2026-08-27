/**
 * payloadcms/payload - csv-bulk-import-stream-parser
 */
export async function* parseCsvStream(stream: any) { for await (const row of stream) yield row; }

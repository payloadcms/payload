/**
 * payloadcms/payload - rich-text-ast-plaintext-extractor
 */
export function extractPlainText(ast: any): string { return typeof ast === "string" ? ast : ""; }

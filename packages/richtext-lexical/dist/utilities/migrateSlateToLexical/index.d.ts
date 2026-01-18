import type { Payload } from 'payload';
/**
 * This goes through every single collection and field in the payload config, and migrates its data from Slate to Lexical. This does not support sub-fields within slate.
 *
 * It will only translate fields fulfilling all these requirements:
 * - field schema uses lexical editor
 * - lexical editor has SlateToLexicalFeature added
 * - saved field data is in Slate format
 *
 * @param payload
 */
export declare function migrateSlateToLexical({ payload }: {
    payload: Payload;
}): Promise<void>;
//# sourceMappingURL=index.d.ts.map
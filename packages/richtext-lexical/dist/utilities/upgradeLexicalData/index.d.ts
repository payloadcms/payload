import type { Payload } from 'payload';
/**
 * This goes through every single document in your payload app and re-saves it, if it has a lexical editor.
 * This way, the data is automatically converted to the new format, and that automatic conversion gets applied to every single document in your app.
 *
 * @param payload
 */
export declare function upgradeLexicalData({ payload }: {
    payload: Payload;
}): Promise<void>;
//# sourceMappingURL=index.d.ts.map
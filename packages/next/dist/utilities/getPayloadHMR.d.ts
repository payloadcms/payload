import type { InitOptions, Payload } from 'payload';
/**
 *  getPayloadHMR is no longer preferred.
 *  You can now use in all contexts:
 *  ```ts
 *   import { getPayload } from 'payload'
 *  ```
 * @deprecated
 */
export declare const getPayloadHMR: (options: Pick<InitOptions, "config" | "importMap">) => Promise<Payload>;
//# sourceMappingURL=getPayloadHMR.d.ts.map
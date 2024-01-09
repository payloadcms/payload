import type { Field, ClientConfig, SanitizedConfig } from 'payload/types'
export declare const sanitizeField: (f: any) => any
export declare const sanitizeFields: (fields: Field[]) => Field[]
export declare const createClientConfig: (
  configPromise: SanitizedConfig | Promise<SanitizedConfig>,
) => Promise<ClientConfig>
//# sourceMappingURL=createClientConfig.d.ts.map

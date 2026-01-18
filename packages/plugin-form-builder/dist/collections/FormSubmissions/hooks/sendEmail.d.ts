import type { CollectionAfterChangeHook } from 'payload';
import type { FormBuilderPluginConfig } from '../../../types.js';
type AfterChangeParams = Parameters<CollectionAfterChangeHook>[0];
export declare const sendEmail: (afterChangeParameters: AfterChangeParams, formConfig: FormBuilderPluginConfig) => Promise<void>;
export {};
//# sourceMappingURL=sendEmail.d.ts.map
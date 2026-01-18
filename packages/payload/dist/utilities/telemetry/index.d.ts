import type { Payload } from '../../types/index.js';
import type { AdminInitEvent } from './events/adminInit.js';
import type { ServerInitEvent } from './events/serverInit.js';
export type BaseEvent = {
    ciName: null | string;
    dbAdapter: string;
    emailAdapter: null | string;
    envID: string;
    isCI: boolean;
    locales: string[];
    localizationDefaultLocale: null | string;
    localizationEnabled: boolean;
    nodeEnv: string;
    nodeVersion: string;
    payloadVersion: string;
    projectID: string;
    projectIDSource: 'cwd' | 'git' | 'packageJSON' | 'serverURL';
    uploadAdapters: string[];
};
type PackageJSON = {
    dependencies: Record<string, string | undefined>;
    name: string;
};
type TelemetryEvent = AdminInitEvent | ServerInitEvent;
type Args = {
    event: TelemetryEvent;
    payload: Payload;
};
export declare const sendEvent: ({ event, payload }: Args) => Promise<void>;
export declare const getPayloadVersion: (packageJSON: PackageJSON) => string;
export declare const getLocalizationInfo: (payload: Payload) => Pick<BaseEvent, "locales" | "localizationDefaultLocale" | "localizationEnabled">;
export {};
//# sourceMappingURL=index.d.ts.map
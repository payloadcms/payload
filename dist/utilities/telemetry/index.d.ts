import { Payload } from '../../payload';
import { ServerInitEvent } from './events/serverInit';
import { AdminInitEvent } from './events/adminInit';
export type BaseEvent = {
    envID: string;
    projectID: string;
    nodeVersion: string;
    nodeEnv: string;
    payloadVersion: string;
};
type PackageJSON = {
    name: string;
    dependencies: Record<string, string | undefined>;
};
type TelemetryEvent = ServerInitEvent | AdminInitEvent;
type Args = {
    payload: Payload;
    event: TelemetryEvent;
};
export declare const sendEvent: ({ payload, event }: Args) => Promise<void>;
export declare const getPayloadVersion: (packageJSON: PackageJSON) => string;
export {};

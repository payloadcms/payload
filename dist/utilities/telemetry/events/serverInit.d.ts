import { Payload } from '../../../payload';
export type ServerInitEvent = {
    type: 'server-init';
};
export declare const serverInit: (payload: Payload) => void;

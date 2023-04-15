import { InitOptions } from './config/types';
import { Payload } from '.';
export declare const init: (payload: Payload, options: InitOptions) => void;
export declare const initAsync: (payload: Payload, options: InitOptions) => Promise<void>;
export declare const initSync: (payload: Payload, options: InitOptions) => void;

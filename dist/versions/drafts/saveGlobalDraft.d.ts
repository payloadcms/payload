import { Payload } from '../..';
import { SanitizedGlobalConfig } from '../../globals/config/types';
type Args = {
    payload: Payload;
    config?: SanitizedGlobalConfig;
    data: any;
    autosave: boolean;
};
export declare const saveGlobalDraft: ({ payload, config, data, autosave, }: Args) => Promise<void>;
export {};

import { Model } from 'mongoose';
import { User } from '../auth';
import { PayloadRequest } from '../express/types';
export type Preference = {
    user: string;
    userCollection: string;
    key: string;
    value: {
        [key: string]: unknown;
    } | unknown;
    createdAt?: Date;
    updatedAt?: Date;
};
export type Preferences = {
    Model: Model<Preference>;
};
export type PreferenceRequest = {
    overrideAccess?: boolean;
    req: PayloadRequest;
    user: User;
    key: string;
};
export type PreferenceUpdateRequest = PreferenceRequest & {
    value: undefined;
};
export type CollapsedPreferences = string[];
export type TabsPreferences = Array<{
    [path: string]: number;
}>;
export type FieldsPreferences = {
    [key: string]: {
        tabIndex: number;
        collapsed: CollapsedPreferences;
    };
};
export type DocumentPreferences = {
    fields: FieldsPreferences;
};

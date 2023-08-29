import { User } from '../auth/types.js';
import { PayloadRequest } from '../express/types.js';

export type PreferenceRequest = {
  overrideAccess?: boolean;
  req: PayloadRequest;
  user: User;
  key: string;
};

export type PreferenceUpdateRequest = PreferenceRequest & { value: undefined };

export type CollapsedPreferences = string[]

export type TabsPreferences = Array<{
  [path: string]: number
}>

export type FieldsPreferences = {
  [key: string]: {
    tabIndex: number
    collapsed: CollapsedPreferences
  }
}

export type DocumentPreferences = {
  fields: FieldsPreferences
}

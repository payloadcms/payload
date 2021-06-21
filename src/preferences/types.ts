import { Request } from 'express';
import { User } from '../auth';

export type Preference = {
  user: string;
  userCollection: string;
  key: string;
  value: { [key: string]: unknown } | unknown;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PreferenceRequest = {
  overrideAccess?: boolean;
  req: Request;
  user: User;
  key: string;
};

export type PreferenceUpdateRequest = PreferenceRequest & {value: undefined};

export type CollapsedPreferences = string[]

export type FieldsPreferences = {
  [key: string]: {
    collapsed: CollapsedPreferences
  }
}

export type DocumentPreferences = {
  fields: FieldsPreferences
}

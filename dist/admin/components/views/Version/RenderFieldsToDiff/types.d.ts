import { FieldPermissions } from '../../../../../auth';
import { Field } from '../../../../../fields/config/types';
import { FieldComponents } from './fields/types';
export type Props = {
    fields: Field[];
    fieldComponents: FieldComponents;
    fieldPermissions: Record<string, FieldPermissions>;
    version: Record<string, any>;
    comparison: Record<string, any>;
    locales: string[];
};

import type { MarkOptional } from 'ts-essentials';
import type { RelationshipField, RelationshipFieldClient } from '../../fields/config/types.js';
import type { RelationshipFieldValidation } from '../../fields/validations.js';
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js';
import type { ClientFieldBase, FieldClientComponent, FieldPaths, FieldServerComponent, ServerFieldBase } from '../forms/Field.js';
import type { FieldDescriptionClientComponent, FieldDescriptionServerComponent, FieldDiffClientComponent, FieldDiffServerComponent, FieldLabelClientComponent, FieldLabelServerComponent } from '../types.js';
type RelationshipFieldClientWithoutType = MarkOptional<RelationshipFieldClient, 'type'>;
type RelationshipFieldBaseClientProps = {
    readonly path: string;
    readonly validate?: RelationshipFieldValidation;
};
type RelationshipFieldBaseServerProps = Pick<FieldPaths, 'path'>;
export type RelationshipFieldClientProps = ClientFieldBase<RelationshipFieldClientWithoutType> & RelationshipFieldBaseClientProps;
export type RelationshipFieldServerProps = RelationshipFieldBaseServerProps & ServerFieldBase<RelationshipField, RelationshipFieldClientWithoutType>;
export type RelationshipFieldServerComponent = FieldServerComponent<RelationshipField, RelationshipFieldClientWithoutType, RelationshipFieldBaseServerProps>;
export type RelationshipFieldClientComponent = FieldClientComponent<RelationshipFieldClientWithoutType, RelationshipFieldBaseClientProps>;
export type RelationshipFieldLabelServerComponent = FieldLabelServerComponent<RelationshipField, RelationshipFieldClientWithoutType>;
export type RelationshipFieldLabelClientComponent = FieldLabelClientComponent<RelationshipFieldClientWithoutType>;
export type RelationshipFieldDescriptionServerComponent = FieldDescriptionServerComponent<RelationshipField, RelationshipFieldClientWithoutType>;
export type RelationshipFieldDescriptionClientComponent = FieldDescriptionClientComponent<RelationshipFieldClientWithoutType>;
export type RelationshipFieldErrorServerComponent = FieldErrorServerComponent<RelationshipField, RelationshipFieldClientWithoutType>;
export type RelationshipFieldErrorClientComponent = FieldErrorClientComponent<RelationshipFieldClientWithoutType>;
export type RelationshipFieldDiffServerComponent = FieldDiffServerComponent<RelationshipField, RelationshipFieldClient>;
export type RelationshipFieldDiffClientComponent = FieldDiffClientComponent<RelationshipFieldClient>;
export {};
//# sourceMappingURL=Relationship.d.ts.map
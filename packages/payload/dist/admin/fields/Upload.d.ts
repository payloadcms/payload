import type { MarkOptional } from 'ts-essentials';
import type { UploadField, UploadFieldClient } from '../../fields/config/types.js';
import type { UploadFieldValidation } from '../../fields/validations.js';
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js';
import type { ClientFieldBase, FieldClientComponent, FieldPaths, FieldServerComponent, ServerFieldBase } from '../forms/Field.js';
import type { FieldDescriptionClientComponent, FieldDescriptionServerComponent, FieldDiffClientComponent, FieldDiffServerComponent, FieldLabelClientComponent, FieldLabelServerComponent } from '../types.js';
type UploadFieldClientWithoutType = MarkOptional<UploadFieldClient, 'type'>;
type UploadFieldBaseClientProps = {
    readonly path: string;
    readonly validate?: UploadFieldValidation;
};
type UploadFieldBaseServerProps = Pick<FieldPaths, 'path'>;
export type UploadFieldClientProps = ClientFieldBase<UploadFieldClientWithoutType> & UploadFieldBaseClientProps;
export type UploadFieldServerProps = ServerFieldBase<UploadField, UploadFieldClientWithoutType> & UploadFieldBaseServerProps;
export type UploadFieldServerComponent = FieldServerComponent<UploadField, UploadFieldClientWithoutType, UploadFieldBaseServerProps>;
export type UploadFieldClientComponent = FieldClientComponent<UploadFieldClientWithoutType, UploadFieldBaseClientProps>;
export type UploadFieldLabelServerComponent = FieldLabelServerComponent<UploadField, UploadFieldClientWithoutType>;
export type UploadFieldLabelClientComponent = FieldLabelClientComponent<UploadFieldClientWithoutType>;
export type UploadFieldDescriptionServerComponent = FieldDescriptionServerComponent<UploadField, UploadFieldClientWithoutType>;
export type UploadFieldDescriptionClientComponent = FieldDescriptionClientComponent<UploadFieldClientWithoutType>;
export type UploadFieldErrorServerComponent = FieldErrorServerComponent<UploadField, UploadFieldClientWithoutType>;
export type UploadFieldErrorClientComponent = FieldErrorClientComponent<UploadFieldClientWithoutType>;
export type UploadFieldDiffServerComponent = FieldDiffServerComponent<UploadField, UploadFieldClient>;
export type UploadFieldDiffClientComponent = FieldDiffClientComponent<UploadFieldClient>;
export {};
//# sourceMappingURL=Upload.d.ts.map
import type { MarkOptional } from 'ts-essentials';
import type { ClientField, NamedTab, TabsField, TabsFieldClient, UnnamedTab } from '../../fields/config/types.js';
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js';
import type { ClientFieldBase, FieldClientComponent, FieldPaths, FieldServerComponent, ServerFieldBase } from '../forms/Field.js';
import type { FieldDescriptionClientComponent, FieldDescriptionServerComponent, FieldDiffClientComponent, FieldDiffServerComponent, FieldLabelClientComponent, FieldLabelServerComponent } from '../types.js';
export type ClientTab = ({
    fields: ClientField[];
    passesCondition?: boolean;
    readonly path?: string;
} & Omit<NamedTab, 'fields'>) | ({
    fields: ClientField[];
    passesCondition?: boolean;
} & Omit<UnnamedTab, 'fields'>);
type TabsFieldBaseClientProps = FieldPaths;
type TabsFieldClientWithoutType = MarkOptional<TabsFieldClient, 'type'>;
export type TabsFieldClientProps = ClientFieldBase<TabsFieldClientWithoutType> & TabsFieldBaseClientProps;
export type TabsFieldServerProps = ServerFieldBase<TabsField, TabsFieldClientWithoutType>;
export type TabsFieldServerComponent = FieldServerComponent<TabsField, TabsFieldClientWithoutType>;
export type TabsFieldClientComponent = FieldClientComponent<TabsFieldClientWithoutType, TabsFieldBaseClientProps>;
export type TabsFieldLabelServerComponent = FieldLabelServerComponent<TabsField, TabsFieldClientWithoutType>;
export type TabsFieldLabelClientComponent = FieldLabelClientComponent<TabsFieldClientWithoutType>;
export type TabsFieldDescriptionServerComponent = FieldDescriptionServerComponent<TabsField, TabsFieldClientWithoutType>;
export type TabsFieldDescriptionClientComponent = FieldDescriptionClientComponent<TabsFieldClientWithoutType>;
export type TabsFieldErrorServerComponent = FieldErrorServerComponent<TabsField, TabsFieldClientWithoutType>;
export type TabsFieldErrorClientComponent = FieldErrorClientComponent<TabsFieldClientWithoutType>;
export type TabsFieldDiffServerComponent = FieldDiffServerComponent<TabsField, TabsFieldClient>;
export type TabsFieldDiffClientComponent = FieldDiffClientComponent<TabsFieldClient>;
export {};
//# sourceMappingURL=Tabs.d.ts.map
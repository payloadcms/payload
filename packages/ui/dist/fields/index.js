'use client';

import { RowLabel } from '../forms/RowLabel/index.js';
import { ArrayField } from './Array/index.js';
import { BlocksField } from './Blocks/index.js';
import { CheckboxField } from './Checkbox/index.js';
import { CodeField } from './Code/index.js';
import { CollapsibleField } from './Collapsible/index.js';
import { ConfirmPasswordField } from './ConfirmPassword/index.js';
import { DateTimeField } from './DateTime/index.js';
import { EmailField } from './Email/index.js';
import { FieldDescription } from './FieldDescription/index.js';
import { FieldError } from './FieldError/index.js';
import { FieldLabel } from './FieldLabel/index.js';
import { GroupField } from './Group/index.js';
import { HiddenField } from './Hidden/index.js';
import { JoinField } from './Join/index.js';
import { JSONField } from './JSON/index.js';
import { NumberField } from './Number/index.js';
import { PasswordField } from './Password/index.js';
import { PointField } from './Point/index.js';
import { RadioGroupField } from './RadioGroup/index.js';
import { RelationshipField } from './Relationship/index.js';
import { RichTextField } from './RichText/index.js';
import { RowField } from './Row/index.js';
import { SelectField } from './Select/index.js';
import { TabsField } from './Tabs/index.js';
import { TextField } from './Text/index.js';
import { TextareaField } from './Textarea/index.js';
import { UIField } from './UI/index.js';
import { UploadField } from './Upload/index.js';
export * from './shared/index.js';
export const fieldComponents = {
  array: ArrayField,
  blocks: BlocksField,
  checkbox: CheckboxField,
  code: CodeField,
  collapsible: CollapsibleField,
  confirmPassword: ConfirmPasswordField,
  date: DateTimeField,
  email: EmailField,
  group: GroupField,
  hidden: HiddenField,
  join: JoinField,
  json: JSONField,
  number: NumberField,
  password: PasswordField,
  point: PointField,
  radio: RadioGroupField,
  relationship: RelationshipField,
  richText: RichTextField,
  row: RowField,
  select: SelectField,
  tabs: TabsField,
  text: TextField,
  textarea: TextareaField,
  ui: UIField,
  upload: UploadField
};
export const allFieldComponents = {
  ...fieldComponents,
  Description: FieldDescription,
  Error: FieldError,
  Label: FieldLabel,
  RowLabel
};
//# sourceMappingURL=index.js.map
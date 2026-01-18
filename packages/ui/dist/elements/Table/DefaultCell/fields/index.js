'use client';

import { ArrayCell } from './Array/index.js';
import { BlocksCell } from './Blocks/index.js';
import { CheckboxCell } from './Checkbox/index.js';
import { CodeCell } from './Code/index.js';
import { DateCell } from './Date/index.js';
import { FileCell } from './File/index.js';
import { JSONCell } from './JSON/index.js';
import { RelationshipCell } from './Relationship/index.js';
import { SelectCell } from './Select/index.js';
import { TextareaCell } from './Textarea/index.js';
export const cellComponents = {
  array: ArrayCell,
  blocks: BlocksCell,
  checkbox: CheckboxCell,
  code: CodeCell,
  date: DateCell,
  File: FileCell,
  join: RelationshipCell,
  json: JSONCell,
  radio: SelectCell,
  relationship: RelationshipCell,
  select: SelectCell,
  textarea: TextareaCell,
  upload: RelationshipCell
};
//# sourceMappingURL=index.js.map
import type { FieldDiffClientProps, FieldDiffServerProps, FieldTypes } from 'payload'

/* eslint-disable payload/no-imports-from-exports-dir -- Server-side map of diff components must reference exports/client bundle so RSC client refs resolve to the bundled providers */
import {
  VersionFieldDiffCheckbox as Checkbox,
  VersionFieldDiffCollapsible as Collapsible,
  VersionFieldDiffDate as DateDiffComponent,
  VersionFieldDiffGroup as Group,
  VersionFieldDiffIterable as Iterable,
  VersionFieldDiffRow as Row,
  VersionFieldDiffSelect as Select,
  VersionFieldDiffTabs as Tabs,
  VersionFieldDiffText as Text,
} from '../../../../exports/client/index.js'
/* eslint-enable payload/no-imports-from-exports-dir */
import { Relationship } from './Relationship/index.js'
import { Upload } from './Upload/index.js'

export const diffComponents: Record<
  FieldTypes,
  React.ComponentType<FieldDiffClientProps | FieldDiffServerProps>
> = {
  array: Iterable,
  blocks: Iterable,
  checkbox: Checkbox,
  code: Text,
  collapsible: Collapsible,
  date: DateDiffComponent,
  email: Text,
  group: Group,
  join: null,
  json: Text,
  number: Text,
  point: Text,
  radio: Select,
  relationship: Relationship,
  richText: Text,
  row: Row,
  select: Select,
  tabs: Tabs,
  text: Text,
  textarea: Text,
  ui: null,
  upload: Upload,
}

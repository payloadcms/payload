import type { FieldState } from '../../admin/forms/Form.js'
import type { Field } from '../config/types.js'

/**
 * Adds `blockType` and `blockName` entries to form state for a block row.
 *
 * These fields are marked `admin.disabled` in `baseBlockFields`, which causes them to be
 * skipped by the normal field processing in `addFieldStatePromise`. Both the standard
 * blocks handler (`case 'blocks':` in `addFieldStatePromise`) and the Lexical adapter's
 * `buildFormState` need to add these entries manually.
 */
export function addBlockMetaToFormState({
  addedByServer,
  blockFields,
  blockName,
  blockType,
  includeSchema,
  path,
  state,
}: {
  addedByServer?: boolean
  blockFields?: Field[]
  blockName?: string
  blockType: string
  includeSchema?: boolean
  path: string
  state: Record<string, FieldState>
}): void {
  const blockTypeEntry: FieldState = {
    initialValue: blockType,
    value: blockType,
  }

  if (addedByServer) {
    blockTypeEntry.addedByServer = true
  }

  if (includeSchema && blockFields) {
    blockTypeEntry.fieldSchema = blockFields.find(
      (f): f is { name: string } & Field => 'name' in f && f.name === 'blockType',
    )
  }

  state[`${path}.blockType`] = blockTypeEntry

  const blockNameEntry: FieldState = {}

  if (blockName) {
    blockNameEntry.initialValue = blockName
    blockNameEntry.value = blockName
  }

  if (addedByServer) {
    blockNameEntry.addedByServer = true
  }

  if (includeSchema && blockFields) {
    blockNameEntry.fieldSchema = blockFields.find(
      (f): f is { name: string } & Field => 'name' in f && f.name === 'blockName',
    )
  }

  state[`${path}.blockName`] = blockNameEntry
}

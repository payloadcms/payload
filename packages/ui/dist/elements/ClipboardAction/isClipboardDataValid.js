import { fieldAffectsData, fieldHasSubFields } from 'payload/shared';
/**
 * Validates whether clipboard data is compatible with the target schema.
 * For this to be true, the copied field and the target to be pasted must
 * be structurally equivalent (same schema)
 *
 * @returns True if the clipboard data is valid and can be pasted, false otherwise
 */
export function isClipboardDataValid({
  data,
  path,
  ...args
}) {
  if (typeof data === 'undefined' || !path || !args.type) {
    return false;
  }
  if (args.type === 'blocks') {
    return isClipboardBlocksValid({
      blocksFromClipboard: args.blocks,
      blocksFromConfig: args.schemaBlocks
    });
  } else {
    return isClipboardFieldsValid({
      fieldsFromClipboard: args.fields,
      fieldsFromConfig: args.schemaFields
    });
  }
}
function isClipboardFieldsValid({
  fieldsFromClipboard,
  fieldsFromConfig
}) {
  if (!fieldsFromConfig || fieldsFromClipboard.length !== fieldsFromConfig?.length) {
    return false;
  }
  return fieldsFromClipboard.every((clipboardField, i) => {
    const configField = fieldsFromConfig[i];
    if (clipboardField.type !== configField.type) {
      return false;
    }
    const affectsData = fieldAffectsData(clipboardField) && fieldAffectsData(configField);
    if (affectsData && clipboardField.name !== configField.name) {
      return false;
    }
    const hasNestedFieldsConfig = fieldHasSubFields(configField);
    const hasNestedFieldsClipboard = fieldHasSubFields(clipboardField);
    if (hasNestedFieldsClipboard !== hasNestedFieldsConfig) {
      return false;
    }
    if (hasNestedFieldsClipboard && hasNestedFieldsConfig) {
      return isClipboardFieldsValid({
        fieldsFromClipboard: clipboardField.fields,
        fieldsFromConfig: configField.fields
      });
    }
    return true;
  });
}
function isClipboardBlocksValid({
  blocksFromClipboard,
  blocksFromConfig
}) {
  const configBlockMap = new Map(blocksFromConfig?.map(block => [block.slug, block]));
  if (!configBlockMap.size) {
    return false;
  }
  const checkedSlugs = new Set();
  for (const currBlock of blocksFromClipboard) {
    const currSlug = currBlock.slug;
    if (!checkedSlugs.has(currSlug)) {
      const configBlock = configBlockMap.get(currSlug);
      if (!configBlock) {
        return false;
      }
      if (!isClipboardFieldsValid({
        fieldsFromClipboard: currBlock.fields,
        fieldsFromConfig: configBlock.fields
      })) {
        return false;
      }
      checkedSlugs.add(currSlug);
    }
  }
  return true;
}
//# sourceMappingURL=isClipboardDataValid.js.map
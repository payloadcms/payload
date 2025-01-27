/**
 * Wraps the input formData in a blockFieldWrapperName, so that it can be read by the RenderFields component
 * which requires it to be wrapped in a group field
 */
export function transformInputFormData(data: any, blockFieldWrapperName: string) {
  const dataCopy = JSON.parse(JSON.stringify(data))

  const fieldDataWithoutBlockFields = { ...dataCopy }
  delete fieldDataWithoutBlockFields['id']
  delete fieldDataWithoutBlockFields['blockName']
  delete fieldDataWithoutBlockFields['blockType']

  // Wrap all fields inside blockFieldWrapperName.
  // This is necessary, because blockFieldWrapperName is set as the 'base' path for all fields in the block (in the RenderFields component).
  // Thus, in order for the data to be read, it has to be wrapped in this blockFieldWrapperName, as it's expected to be there.

  // Why are we doing this? Because that way, all rendered fields of the blocks have different paths and names, and thus don't conflict with each other.
  // They have different paths and names, because they are wrapped in the blockFieldWrapperName, which has a name that is unique for each block.
  return {
    id: dataCopy.id,
    [blockFieldWrapperName]: fieldDataWithoutBlockFields,
    blockName: dataCopy.blockName,
    blockType: dataCopy.blockType,
  }
}

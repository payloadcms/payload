import { serialize } from 'object-to-formdata';
import { reduceFieldsToValues } from 'payload/shared';
export async function createFormData(formState = {}, overrides = {}, collectionSlug, uploadHandler) {
  const data = reduceFieldsToValues(formState, true);
  let file = data?.file;
  if (file) {
    delete data.file;
  }
  if (file && typeof uploadHandler === 'function') {
    let filename = file.name;
    const clientUploadContext = await uploadHandler({
      file,
      updateFilename: value => {
        filename = value;
      }
    });
    file = JSON.stringify({
      clientUploadContext,
      collectionSlug,
      filename,
      mimeType: file.type,
      size: file.size
    });
  }
  const dataWithOverrides = {
    ...data,
    ...overrides
  };
  const dataToSerialize = {
    _payload: JSON.stringify(dataWithOverrides),
    file
  };
  return serialize(dataToSerialize, {
    indices: true,
    nullsAsUndefineds: false
  });
}
//# sourceMappingURL=createFormData.js.map
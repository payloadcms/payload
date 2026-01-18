import { defaultValuePromise } from './promise.js';
export const iterateFields = async ({
  id,
  data,
  fields,
  locale,
  req,
  select,
  selectMode,
  siblingData,
  user
}) => {
  const promises = [];
  fields.forEach(field => {
    promises.push(defaultValuePromise({
      id,
      data,
      field,
      locale,
      req,
      select,
      selectMode,
      siblingData,
      user
    }));
  });
  await Promise.all(promises);
};
//# sourceMappingURL=iterateFields.js.map
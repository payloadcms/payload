import { iterateFields } from './iterateFields.js';
export const calculateDefaultValues = async ({
  id,
  data,
  fields,
  locale,
  req,
  select,
  selectMode,
  user
}) => {
  await iterateFields({
    id,
    data,
    fields,
    locale,
    req,
    select,
    selectMode,
    siblingData: data,
    user
  });
  return data;
};
//# sourceMappingURL=index.js.map
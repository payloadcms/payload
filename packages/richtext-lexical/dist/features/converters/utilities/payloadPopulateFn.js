import { createLocalReq } from 'payload';
import { populate } from '../../../populateGraphQL/populate.js';
export const getPayloadPopulateFn = async ({
  currentDepth,
  depth,
  draft,
  overrideAccess,
  payload,
  req,
  showHiddenFields
}) => {
  let reqToUse = req;
  if (req === undefined && payload) {
    reqToUse = await createLocalReq({}, payload);
  }
  if (!reqToUse) {
    throw new Error('No req or payload provided');
  }
  const populateFn = async ({
    id,
    collectionSlug,
    select
  }) => {
    const dataContainer = {};
    await populate({
      id,
      collectionSlug,
      currentDepth,
      data: dataContainer,
      depth,
      draft: draft ?? false,
      key: 'value',
      overrideAccess: overrideAccess ?? true,
      req: reqToUse,
      select,
      showHiddenFields: showHiddenFields ?? false
    });
    return dataContainer.value;
  };
  return populateFn;
};
//# sourceMappingURL=payloadPopulateFn.js.map
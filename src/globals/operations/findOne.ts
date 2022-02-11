import { hasWhereAccessResult } from '../../auth';
import executeAccess from '../../auth/executeAccess';
import { Where } from '../../types';
import { AccessResult } from '../../config/types';
import sanitizeInternalFields from '../../utilities/sanitizeInternalFields';
import replaceWithDraftIfAvailable from '../../versions/drafts/replaceWithDraftIfAvailable';

async function findOne(args) {
  const { globals: { Model } } = this;

  const {
    globalConfig,
    locale,
    req,
    slug,
    depth,
    showHiddenFields,
    draft: draftEnabled = false,
    overrideAccess = false,
  } = args;

  // /////////////////////////////////////
  // Retrieve and execute access
  // /////////////////////////////////////

  const queryToBuild: { where?: Where} = {
    where: {
      and: [
        {
          globalType: {
            equals: slug,
          },
        },
      ],
    },
  };

  let accessResult: AccessResult;

  if (!overrideAccess) {
    accessResult = await executeAccess({ req }, globalConfig.access.read);

    if (hasWhereAccessResult(accessResult)) {
      queryToBuild.where.and.push(accessResult);
    }
  }

  const query = await Model.buildQuery(queryToBuild, locale);

  // /////////////////////////////////////
  // Perform database operation
  // /////////////////////////////////////

  let doc = await Model.findOne(query).lean();

  if (!doc) {
    doc = {};
  } else if (doc._id) {
    doc.id = doc._id;
    delete doc._id;
  }

  doc = JSON.stringify(doc);
  doc = JSON.parse(doc);
  doc = sanitizeInternalFields(doc);

  // /////////////////////////////////////
  // Replace document with draft if available
  // /////////////////////////////////////

  if (globalConfig.versions?.drafts && draftEnabled) {
    doc = await replaceWithDraftIfAvailable({
      payload: this,
      entity: globalConfig,
      doc,
      locale,
      accessResult,
    });
  }

  // /////////////////////////////////////
  // 3. Execute before collection hook
  // /////////////////////////////////////

  await globalConfig.hooks.beforeRead.reduce(async (priorHook, hook) => {
    await priorHook;

    doc = await hook({
      req,
      doc,
    }) || doc;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 4. Execute field-level hooks and access
  // /////////////////////////////////////

  doc = await this.performFieldOperations(globalConfig, {
    data: doc,
    hook: 'afterRead',
    operation: 'read',
    req,
    depth,
    flattenLocales: true,
    showHiddenFields,
  });

  // /////////////////////////////////////
  // 5. Execute after collection hook
  // /////////////////////////////////////

  await globalConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
    await priorHook;

    doc = await hook({
      req,
      doc,
    }) || doc;
  }, Promise.resolve());

  // /////////////////////////////////////
  // 6. Return results
  // /////////////////////////////////////

  return doc;
}

export default findOne;

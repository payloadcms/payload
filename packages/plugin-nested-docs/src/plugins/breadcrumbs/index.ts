import { Config } from 'payload/config';
import { CollectionAfterReadHook, CollectionConfig } from 'payload/types';
import { Options } from './types';
import createBreadcrumbsField from './fields/breadcrumbs';
import createParentField from './fields/parent';
import getParents from './getParents';
import formatBreadcrumb from './formatBreadcrumb';

const populateBreadcrumbs = (options: Options, collection: CollectionConfig): CollectionAfterReadHook => async ({ req: { payload, payloadAPI }, doc }) => {
  const newDoc = doc;
  const breadcrumbs = await getParents(payload, options, collection, doc);
  const currentDocBreadcrumb = formatBreadcrumb(options, collection, doc, breadcrumbs);

  return {
    ...newDoc,
    [options?.breadcrumbsFieldSlug || 'breadcrumbs']: [
      breadcrumbs,
      currentDocBreadcrumb,
    ],
  };
};

const breadcrumbs = (options: Options) => (config: Config): Config => ({
  ...config,
  collections: (config.collections || []).map((collection) => {
    if (options.collections.indexOf(collection.slug) > -1) {
      const fields = [...collection?.fields || []];

      if (!options.parentFieldSlug) {
        fields.push(createParentField(collection.slug));
      }

      if (!options.breadcrumbsFieldSlug) {
        fields.push(createBreadcrumbsField());
      }

      return {
        ...collection,
        hooks: {
          ...collection.hooks || {},
          afterRead: [
            populateBreadcrumbs(options, collection),
            ...collection?.hooks?.afterRead || [],
          ],
        },
        fields,
      };
    }

    return collection;
  }),
});

export default breadcrumbs;

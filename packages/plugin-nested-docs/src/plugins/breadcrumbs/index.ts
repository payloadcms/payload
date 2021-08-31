import { Config } from 'payload/config';
import { CollectionConfig } from 'payload/types';
import { Options } from './types';
import createBreadcrumbsField from './fields/breadcrumbs';
import createParentField from './fields/parent';
import getParents from './getParents';
import formatBreadcrumb from './formatBreadcrumb';

const populateBreadcrumbs = async (req: any, options: Options, collection: CollectionConfig, data: any) => {
  const newData = data;
  const breadcrumbs = await getParents(req.payload, options, collection, data);
  const currentDocBreadcrumb = formatBreadcrumb(options, collection, data, breadcrumbs);

  return {
    ...newData,
    [options?.breadcrumbsFieldSlug || 'breadcrumbs']: [
      ...breadcrumbs,
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
        fields.push(createBreadcrumbsField(collection.slug));
      }

      return {
        ...collection,
        hooks: {
          ...collection.hooks || {},
          beforeChange: [
            async ({ req, data }) => populateBreadcrumbs(req, options, collection, data),
            ...collection?.hooks?.beforeChange || [],
          ],
          afterRead: [
            async ({ req, doc }) => populateBreadcrumbs(req, options, collection, doc),
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

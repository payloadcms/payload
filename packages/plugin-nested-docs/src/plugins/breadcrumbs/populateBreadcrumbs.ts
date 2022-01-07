import { CollectionConfig } from 'payload/types';
import { Options } from './types';
import getParents from './getParents';
import formatBreadcrumb from './formatBreadcrumb';

const populateBreadcrumbs = async (req: any, options: Options, collection: CollectionConfig, data: any, originalDoc?: any): Promise<any> => {
  const newData = data;
  const breadcrumbDocs = [
    ...await getParents(req, options, collection, {
      ...originalDoc,
      ...data,
    }),
    {
      ...originalDoc,
      ...data,
      id: originalDoc?.id,
    },
  ];

  const breadcrumbs = breadcrumbDocs.map((_, i) => formatBreadcrumb(options, collection, breadcrumbDocs.slice(0, i + 1)));

  return {
    ...newData,
    [options?.breadcrumbsFieldSlug || 'breadcrumbs']: breadcrumbs,
  };
};

export default populateBreadcrumbs;

import { CollectionConfig } from 'payload/types';
import { PluginConfig } from '../types';
import getParents from './getParents';
import formatBreadcrumb from './formatBreadcrumb';

const populateBreadcrumbs = async (req: any, pluginConfig: PluginConfig, collection: CollectionConfig, data: any, originalDoc?: any): Promise<any> => {
  const newData = data;
  const breadcrumbDocs = [
    ...await getParents(req, pluginConfig, collection, {
      ...originalDoc,
      ...data,
    }),
    {
      ...originalDoc,
      ...data,
      id: originalDoc?.id,
    },
  ];

  const breadcrumbs = breadcrumbDocs.map((_, i) => formatBreadcrumb(pluginConfig, collection, breadcrumbDocs.slice(0, i + 1)));

  return {
    ...newData,
    [pluginConfig?.breadcrumbsFieldSlug || 'breadcrumbs']: breadcrumbs,
  };
};

export default populateBreadcrumbs;

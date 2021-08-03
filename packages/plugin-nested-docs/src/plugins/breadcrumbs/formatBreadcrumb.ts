import { CollectionConfig } from 'payload/types';
import { Options, Breadcrumb } from './types';

const formatBreadcrumb = (
  options: Options,
  collection: CollectionConfig,
  doc: Record<string, unknown>,
  breadcrumbs: Breadcrumb[] = [],
): Breadcrumb => {
  let url: string;
  let label = doc.id as string;

  if (typeof options?.generateURL === 'function') {
    url = options.generateURL(breadcrumbs, doc);
  }

  if (typeof options?.generateLabel === 'function') {
    label = options.generateLabel(breadcrumbs, doc);
  } else {
    const useAsTitle = collection?.admin?.useAsTitle || 'id';
    label = doc[useAsTitle] as string;
  }

  return {
    label,
    url,
    doc: doc.id as string,
  };
};

export default formatBreadcrumb;

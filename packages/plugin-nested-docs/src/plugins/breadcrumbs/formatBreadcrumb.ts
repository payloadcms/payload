import { CollectionConfig } from 'payload/types';
import { Options, Breadcrumb } from './types';

const formatBreadcrumb = (
  options: Options,
  collection: CollectionConfig,
  docs: Record<string, unknown>[],
): Breadcrumb => {
  let url: string;
  let label: string;

  const lastDoc = docs[docs.length - 1];

  if (typeof options?.generateURL === 'function') {
    url = options.generateURL(docs, lastDoc);
  }

  if (typeof options?.generateLabel === 'function') {
    label = options.generateLabel(docs, lastDoc);
  } else {
    const useAsTitle = collection?.admin?.useAsTitle || 'id';
    label = lastDoc[useAsTitle] as string;
  }

  return {
    label,
    url,
    doc: lastDoc.id as string,
  };
};

export default formatBreadcrumb;

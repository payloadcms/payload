import * as React from 'react';
import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';
import { useConfig } from '../../../../utilities/Config';

type options = { uploads: boolean };

type FilteredCollectionsT = (collections: SanitizedCollectionConfig[], options?: options) => SanitizedCollectionConfig[];
const filterRichTextCollections: FilteredCollectionsT = (collections, options) => {
  return collections.filter(({ admin: { enableRichTextRelationship }, upload }) => {
    if (options?.uploads) {
      return enableRichTextRelationship && Boolean(upload) === true;
    }

    return upload ? false : enableRichTextRelationship;
  });
};

export const EnabledRelationshipsCondition: React.FC<any> = (props) => {
  const { children, uploads = false, ...rest } = props;
  const { collections } = useConfig();
  const [enabledCollectionSlugs] = React.useState(() => filterRichTextCollections(collections, { uploads }).map(({ slug }) => slug));

  if (!enabledCollectionSlugs.length) {
    return null;
  }

  return React.cloneElement(children, { ...rest, enabledCollectionSlugs });
};

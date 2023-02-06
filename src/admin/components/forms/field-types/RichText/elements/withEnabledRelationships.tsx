import * as React from 'react';
import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';
import { useConfig } from '../../../../utilities/Config';

type ButtonToRenderT = React.FC<{ enabledCollectionSlugs: string[] }>;
type options = { uploads: boolean };

type FilteredCollectionsT = (collections: SanitizedCollectionConfig[], options?: options) => SanitizedCollectionConfig[];
export const filterRichTextCollections: FilteredCollectionsT = (collections, options) => {
  return collections.filter(({ admin: { enableRichTextRelationship }, upload }) => {
    if (options?.uploads && Boolean(upload) === false) {
      return false;
    }

    return enableRichTextRelationship;
  });
};

export const withEnabledRelationships = (ButtonToRender: ButtonToRenderT, renderProps?: options) => (props: { path: string }): React.ReactNode => {
  const { collections } = useConfig();
  const [enabledCollectionSlugs] = React.useState(() => filterRichTextCollections(collections, renderProps).map(({ slug }) => slug));

  if (!enabledCollectionSlugs.length) {
    return null;
  }

  return (
    <ButtonToRender
      {...props}
      enabledCollectionSlugs={enabledCollectionSlugs}
    />
  );
};

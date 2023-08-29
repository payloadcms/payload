import { useId } from 'react';
import { formatDrawerSlug } from './index.js';
import { useEditDepth } from '../../utilities/EditDepth/index.js';

export const useDrawerSlug = (slug: string): string => {
  const uuid = useId();
  const editDepth = useEditDepth();
  return formatDrawerSlug({
    slug: `${slug}-${uuid}`,
    depth: editDepth,
  });
};

import { useId } from 'react';
import { formatDrawerSlug } from '.';
import { useEditDepth } from '../../utilities/EditDepth';

export const useDrawerSlug = (slug: string): string => {
  const uuid = useId();
  const editDepth = useEditDepth();
  return formatDrawerSlug({
    slug: `${slug}-${uuid}`,
    depth: editDepth,
  });
};

import { SanitizedCollectionConfig } from '../collections/config/types';
import { SanitizedGlobalConfig } from '../globals/config/types';
import { PaginatedDocs } from '../mongoose/types';

type ShouldIncrementVersionCount = (args: {
  entity: SanitizedGlobalConfig | SanitizedCollectionConfig
  versions: PaginatedDocs<{ version?: { _status: string} }>
  docStatus: string
}) => boolean

export const shouldIncrementVersionCount: ShouldIncrementVersionCount = ({ entity, docStatus, versions }) => {
  return !(entity?.versions?.drafts && entity.versions.drafts?.autosave)
    && (docStatus === 'published' || (docStatus === 'draft' && versions?.docs?.[0]?.version?._status !== 'draft'));
};

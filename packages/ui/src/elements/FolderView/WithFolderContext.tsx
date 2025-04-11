import type { FolderBreadcrumb, GetFolderDataResult } from 'payload/shared'

import type { FolderProviderProps } from '../../providers/Folders/index.js'
import type { PolymorphicRelationshipValue } from './types.js'

import { FolderProvider } from '../../providers/Folders/index.js'

export const WithFolderContext =
  <HOCProps extends {}>(Component: React.FC<HOCProps>) =>
  (props: HOCProps & Omit<FolderProviderProps, 'children'>) => {
    return (
      <FolderProvider
        breadcrumbs={props.breadcrumbs || []}
        documents={props.documents || []}
        folderID={props.folderID || null}
        subfolders={props.subfolders || []}
      >
        <Component {...props} />
      </FolderProvider>
    )
  }

import type { FolderBreadcrumb, GetFolderDataResult } from 'payload/shared'

import type { PolymorphicRelationshipValue } from './types.js'

import { FolderProvider } from '../../providers/Folders/index.js'

type BaseProps = {
  readonly breadcrumbs?: FolderBreadcrumb[]
  readonly documents?: PolymorphicRelationshipValue[]
  readonly drawerSlug: string
  readonly folderID?: number | string
  readonly subfolders?: GetFolderDataResult['subfolders']
}
export const WithFolderContext =
  <HOCProps extends BaseProps>(Component: React.FC<HOCProps>) =>
  (props: HOCProps) => {
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

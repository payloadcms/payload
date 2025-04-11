import type { FolderBreadcrumb, GetFolderDataResult } from 'payload/shared'

import type { PolymorphicRelationshipValue } from '../types.js'

import { FolderProvider } from '../../../providers/Folders/index.js'
import { Drawer } from '../../Drawer/index.js'

type BaseProps = {
  readonly breadcrumbs?: FolderBreadcrumb[]
  readonly documents?: PolymorphicRelationshipValue[]
  readonly drawerSlug: string
  readonly folderID?: number | string
  readonly subfolders?: GetFolderDataResult['subfolders']
}
export const DrawerWithFolderContext =
  <HOCProps extends BaseProps>(Component: React.FC<HOCProps>) =>
  (props: HOCProps) => {
    return (
      <Drawer gutter={false} Header={null} slug={props.drawerSlug}>
        <FolderProvider
          breadcrumbs={props.breadcrumbs || []}
          documents={props.documents || []}
          folderID={props.folderID || null}
          subfolders={props.subfolders || []}
        >
          <Component {...props} />
        </FolderProvider>
      </Drawer>
    )
  }

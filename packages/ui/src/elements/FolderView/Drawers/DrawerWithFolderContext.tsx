import { FolderProvider } from '../../../providers/Folders/index.js'
import { Drawer } from '../../Drawer/index.js'

type BaseProps = {
  readonly drawerSlug: string
}
export const DrawerWithFolderContext =
  <HOCProps extends BaseProps>(Component: React.FC<HOCProps>) =>
  (props: HOCProps) => {
    return (
      <Drawer gutter={false} Header={null} slug={props.drawerSlug}>
        <FolderProvider>
          <Component {...props} />
        </FolderProvider>
      </Drawer>
    )
  }

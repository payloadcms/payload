import { useRouteCache } from '../../../../providers/RouteCache/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { useDocumentDrawer } from '../../../DocumentDrawer/index.js'
import { ListSelectionButton } from '../../../ListSelection/index.js'

type EditFolderActionProps = {
  folderCollectionSlug: string
  id: number | string
}
export const EditFolderAction = ({ id, folderCollectionSlug }: EditFolderActionProps) => {
  const { clearRouteCache } = useRouteCache()
  const { t } = useTranslation()
  const [FolderDocumentDrawer, , { closeDrawer, openDrawer }] = useDocumentDrawer({
    id,
    collectionSlug: folderCollectionSlug,
  })

  if (!id) {
    return null
  }

  return (
    <>
      <ListSelectionButton onClick={openDrawer} type="button">
        {t('general:edit')}
      </ListSelectionButton>

      <FolderDocumentDrawer
        onSave={() => {
          closeDrawer()
          clearRouteCache()
        }}
      />
    </>
  )
}

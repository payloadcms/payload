import type { DocumentDrawerContextProps } from '../../../DocumentDrawer/Provider.js'

import { useTranslation } from '../../../../providers/Translation/index.js'
import { useDocumentDrawer } from '../../../DocumentDrawer/index.js'
import { ListSelectionButton } from '../../../ListSelection/index.js'

type EditFolderActionProps = {
  folderCollectionSlug: string
  id: number | string
  onSave: DocumentDrawerContextProps['onSave']
}
export const EditFolderAction = ({ id, folderCollectionSlug, onSave }: EditFolderActionProps) => {
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
        onSave={async (args) => {
          await onSave(args)
          closeDrawer()
        }}
      />
    </>
  )
}

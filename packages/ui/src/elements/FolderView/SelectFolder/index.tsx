'use client'

import { useSearchParams } from 'next/navigation.js'
import React from 'react'

import { useField } from '../../../forms/useField/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { FolderProvider, useFolder } from '../../../providers/Folders/index.js'
import { strings } from '../../../strings.js'
import { DrawerToggler } from '../../Drawer/index.js'

const drawerSlug = 'select-folder'

const SelectFolderWithContext = () => {
  const { setFolderID } = useFolder()
  const { setValue, value } = useField<string>({
    path: 'parentFolder',
  })
  const searchParams = useSearchParams()

  // set the default value for folderID based on the search params
  // needed for bulk upload
  React.useEffect(() => {
    if (['number', 'string'].includes(typeof searchParams.get('folderID'))) {
      void setValue(searchParams.get('folderID'))
    }
  }, [searchParams, setValue])

  return (
    <React.Fragment>
      <DrawerToggler
        onClick={(e) => {
          e.preventDefault()
          void setFolderID({ folderID: value || undefined })
        }}
        slug={drawerSlug}
      >
        {strings.selectFolder}
      </DrawerToggler>
    </React.Fragment>
  )
}

// export const SelectFolder = () => {
//   const { collectionSlug, docConfig } = useDocumentInfo()

//   return (
//     <FolderProvider
//       collectionSlug={collectionSlug}
//       folderCollectionSlug={docConfig.admin.custom.folderCollectionSlug}
//       initialData={{}}
//     >
//       <SelectFolderWithContext />
//     </FolderProvider>
//   )
// }

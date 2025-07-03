import type { RelationshipFieldServerProps } from 'payload'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { MoveDocToFolder } from '../../../exports/client/index.js'
import './index.scss'

const baseClass = 'folder-edit-field'

export const FolderEditField = (props: RelationshipFieldServerProps) => {
  if (props.payload.config.folders === false) {
    return null
  }
  return (
    <MoveDocToFolder
      className={baseClass}
      folderCollectionSlug={props.payload.config.folders.slug}
      folderFieldName={props.payload.config.folders.fieldName}
    />
  )
}

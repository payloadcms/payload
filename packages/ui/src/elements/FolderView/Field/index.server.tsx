import type { RelationshipFieldServerProps } from 'payload'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { MoveDocToFolder } from '../../../exports/client/index.js'
import './index.scss'

const baseClass = 'folder-edit-field'

export const FolderEditField = (props: RelationshipFieldServerProps) => {
  return (
    <MoveDocToFolder
      className={baseClass}
      folderFieldName={props.payload.config.folders.fieldName}
    />
  )
}

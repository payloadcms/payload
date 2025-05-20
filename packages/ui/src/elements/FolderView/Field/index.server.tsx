import type { RelationshipFieldServerProps } from 'payload'

import { MoveDocToFolder } from '../MoveDocToFolder/index.js'
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

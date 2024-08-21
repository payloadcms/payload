import { type UploadFieldProps, baseClass } from '../index.js'
import './index.scss'

export const UploadComponentHasMany: React.FC<UploadFieldProps> = (props) => {
  return (
    <div className={[baseClass].join(' ')}>
      <div>Draggable / Sortable Rows Go Here</div>
      <div className={[`${baseClass}__controls`].join(' ')}>
        <div className={[`${baseClass}__buttons`].join(' ')}>
          <div>Create new</div>
          <div>Add existing</div>
        </div>
        <div>Clear all</div>
      </div>
    </div>
  )
}

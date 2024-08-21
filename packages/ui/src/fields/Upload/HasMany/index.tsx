import type { UploadFieldPropsWithContext } from '../HasOne/index.js'

import { useConfig } from '../../../providers/Config/index.js'
import { baseClass } from '../index.js'
import './index.scss'

export const UploadComponentHasMany: React.FC<UploadFieldPropsWithContext> = (props) => {
  const {
    field: { relationTo },
  } = props

  const {
    config: { collections },
  } = useConfig()

  if (typeof relationTo === 'string') {
    const collection = collections.find((coll) => coll.slug === relationTo)

    if (collection.upload) {
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

    return null
  }

  return <div>Polymorphic Has Many Uploads Go Here</div>
}

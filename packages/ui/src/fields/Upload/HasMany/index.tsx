import { Fragment } from 'react'

import type { UploadFieldPropsWithContext } from '../HasOne/index.js'

import { AddNewRelation } from '../../../elements/AddNewRelation/index.js'
import { useListDrawer } from '../../../elements/ListDrawer/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { FieldLabel } from '../../FieldLabel/index.js'
import { baseClass } from '../index.js'
import './index.scss'

export const UploadComponentHasMany: React.FC<UploadFieldPropsWithContext> = (props) => {
  const {
    field,
    field: {
      _path,
      admin: {
        components: { Label },
      },
      hasMany,
      label,
      relationTo,
    },
    fieldHookResult: { setValue, value },
  } = props

  const {
    config: { collections },
  } = useConfig()

  const [ListDrawer, ListDrawerToggler] = useListDrawer({
    collectionSlugs:
      typeof relationTo === 'string'
        ? [relationTo]
        : collections.map((collection) => collection.slug),
  })

  return (
    <Fragment>
      <div className={[baseClass].join(' ')}>
        <FieldLabel Label={Label} field={field} label={label} />
        <div>Draggable / Sortable Rows Go Here</div>
        <div className={[`${baseClass}__controls`].join(' ')}>
          <div className={[`${baseClass}__buttons`].join(' ')}>
            <AddNewRelation
              hasMany={hasMany}
              path={_path}
              relationTo={relationTo}
              setValue={setValue}
              value={value}
            />
            <ListDrawerToggler>
              <div>Add Existing</div>
            </ListDrawerToggler>
          </div>
          <div>Clear all</div>
        </div>
      </div>
      <ListDrawer />
    </Fragment>
  )
}

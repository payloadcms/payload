import { Fragment, useMemo } from 'react'

import type { UploadFieldPropsWithContext } from '../HasOne/index.js'

import { AddNewRelation } from '../../../elements/AddNewRelation/index.js'
import { Button } from '../../../elements/Button/index.js'
import { useListDrawer } from '../../../elements/ListDrawer/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { FieldLabel } from '../../FieldLabel/index.js'
import { baseClass } from '../index.js'
import './index.scss'

export const UploadComponentHasMany: React.FC<UploadFieldPropsWithContext<string[]>> = (props) => {
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
    fieldHookResult: { filterOptions: filterOptionsFromProps, setValue, value },
    readOnly,
  } = props

  const { t } = useTranslation()

  const {
    config: { collections },
  } = useConfig()

  const filterOptions = useMemo(() => {
    if (typeof relationTo === 'string') {
      return {
        [relationTo]: {
          where: [
            {
              id: {
                not_in: value,
              },
            },
          ],
        },
      }
    }
  }, [value, relationTo])

  const [ListDrawer, ListDrawerToggler] = useListDrawer({
    collectionSlugs:
      typeof relationTo === 'string'
        ? [relationTo]
        : collections.map((collection) => collection.slug),
    filterOptions,
  })

  return (
    <Fragment>
      <div className={[baseClass].join(' ')}>
        <FieldLabel Label={Label} field={field} label={label} />
        <div>Draggable / Sortable Rows Go Here</div>
        <div className={[`${baseClass}__controls`].join(' ')}>
          <div className={[`${baseClass}__buttons`].join(' ')}>
            <div className={[`${baseClass}__add-new`].join(' ')}>
              <AddNewRelation
                Button={
                  <Button
                    buttonStyle="icon-label"
                    el="span"
                    icon="plus"
                    iconPosition="left"
                    iconStyle="with-border"
                  >
                    {t('fields:addNew')}
                  </Button>
                }
                hasMany={hasMany}
                path={_path}
                relationTo={relationTo}
                setValue={setValue}
                unstyled
                value={value}
              />
            </div>
            <ListDrawerToggler className={`${baseClass}__toggler`} disabled={readOnly}>
              <div>
                <Button
                  buttonStyle="icon-label"
                  el="span"
                  icon="plus"
                  iconPosition="left"
                  iconStyle="with-border"
                >
                  {t('fields:chooseFromExisting')}
                </Button>
              </div>
            </ListDrawerToggler>
          </div>
          <div className={`${baseClass}__clear-all`}>Clear all</div>
        </div>
      </div>
      <ListDrawer />
    </Fragment>
  )
}

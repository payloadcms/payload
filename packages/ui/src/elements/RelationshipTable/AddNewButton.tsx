'use client'
import type { I18nClient } from '@ruya.sa/translations'
import type { ClientCollectionConfig, SanitizedPermissions } from '@ruya.sa/payload'

import { getTranslation } from '@ruya.sa/translations'

import type { Props as ButtonProps } from '../../elements/Button/types.js'

import { Button } from '../../elements/Button/index.js'
import { Popup, PopupList } from '../Popup/index.js'

export const AddNewButton = ({
  allowCreate,
  baseClass,
  buttonStyle,
  className,
  collections,
  i18n,
  icon,
  label,
  onClick,
  permissions,
  relationTo,
}: {
  allowCreate: boolean
  baseClass: string
  buttonStyle?: ButtonProps['buttonStyle']
  className?: string
  collections: ClientCollectionConfig[]
  i18n: I18nClient
  icon?: ButtonProps['icon']
  label: string
  onClick: (selectedCollection?: string) => void
  permissions: SanitizedPermissions
  relationTo: string | string[]
}) => {
  if (!allowCreate) {
    return null
  }

  const isPolymorphic = Array.isArray(relationTo)

  if (!isPolymorphic) {
    return (
      <Button buttonStyle={buttonStyle} className={className} onClick={() => onClick()}>
        {label}
      </Button>
    )
  }

  return (
    <div className={`${baseClass}__add-new-polymorphic-wrapper`}>
      <Popup
        button={
          <Button buttonStyle={buttonStyle} className={className} icon={icon}>
            {label}
          </Button>
        }
        buttonType="custom"
        horizontalAlign="center"
        render={({ close: closePopup }) => (
          <PopupList.ButtonGroup>
            {relationTo.map((relatedCollection) => {
              if (permissions.collections[relatedCollection]?.create) {
                return (
                  <PopupList.Button
                    className={`${baseClass}__relation-button--${relatedCollection}`}
                    key={relatedCollection}
                    onClick={() => {
                      closePopup()
                      onClick(relatedCollection)
                    }}
                  >
                    {getTranslation(
                      collections.find((each) => each.slug === relatedCollection).labels.singular,
                      i18n,
                    )}
                  </PopupList.Button>
                )
              }

              return null
            })}
          </PopupList.ButtonGroup>
        )}
        size="medium"
      />
    </div>
  )
}

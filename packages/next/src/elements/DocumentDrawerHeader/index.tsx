'use client'
import { Gutter, RenderTitle, useModal, useTranslation, XIcon } from '@payloadcms/ui'

import './index.scss'

const baseClass = 'doc-drawer'

export const DocumentDrawerHeader: React.FC<{
  drawerSlug?: string
  Header?: React.ReactNode
}> = ({ drawerSlug, Header }) => {
  const { toggleModal } = useModal()
  const { t } = useTranslation()

  return (
    <Gutter className={`${baseClass}__header`}>
      <div className={`${baseClass}__header-content`}>
        <h2 className={`${baseClass}__header-text`}>{Header || <RenderTitle element="span" />}</h2>
        {/* TODO: the `button` HTML element breaks CSS transitions on the drawer for some reason...
          i.e. changing to a `div` element will fix the animation issue but will break accessibility
        */}
        <button
          aria-label={t('general:close')}
          className={`${baseClass}__header-close`}
          onClick={() => toggleModal(drawerSlug)}
          type="button"
        >
          <XIcon />
        </button>
      </div>
      {/* <DocumentTitle /> */}
    </Gutter>
  )
}

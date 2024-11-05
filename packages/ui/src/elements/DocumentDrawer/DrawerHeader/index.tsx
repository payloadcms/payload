'use client'

import { Gutter } from '../../../elements/Gutter/index.js'
import { useModal } from '../../../elements/Modal/index.js'
import { RenderTitle } from '../../../elements/RenderTitle/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { IDLabel } from '../../IDLabel/index.js'
import { baseClass as docDrawerBaseClass } from '../index.js'
import './index.scss'

export const DocumentDrawerHeader: React.FC<{
  drawerSlug: string
}> = ({ drawerSlug }) => {
  const { closeModal } = useModal()
  const { t } = useTranslation()

  return (
    <Gutter className={`${docDrawerBaseClass}__header`}>
      <div className={`${docDrawerBaseClass}__header-content`}>
        <h2 className={`${docDrawerBaseClass}__header-text`}>{<RenderTitle element="span" />}</h2>
        <button
          aria-label={t('general:close')}
          className={`${docDrawerBaseClass}__header-close`}
          onClick={() => closeModal(drawerSlug)}
          type="button"
        >
          <XIcon />
        </button>
      </div>
      <DocumentTitle />
    </Gutter>
  )
}

const DocumentTitle: React.FC = () => {
  const { id, title } = useDocumentInfo()
  return id && id !== title ? <IDLabel id={id.toString()} /> : null
}

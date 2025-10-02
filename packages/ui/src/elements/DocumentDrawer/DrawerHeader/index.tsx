'use client'

import { Gutter } from '../../../elements/Gutter/index.js'
import { useModal } from '../../../elements/Modal/index.js'
import { RenderTitle } from '../../../elements/RenderTitle/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useDocumentTitle } from '../../../providers/DocumentTitle/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { IDLabel } from '../../IDLabel/index.js'
import { documentDrawerBaseClass } from '../index.js'
import './index.scss'

export const DocumentDrawerHeader: React.FC<{
  AfterHeader?: React.ReactNode
  drawerSlug: string
  showDocumentID?: boolean
}> = ({ AfterHeader, drawerSlug, showDocumentID = true }) => {
  const { closeModal } = useModal()
  const { t } = useTranslation()

  return (
    <Gutter className={`${documentDrawerBaseClass}__header`}>
      <div className={`${documentDrawerBaseClass}__header-content`}>
        <h2 className={`${documentDrawerBaseClass}__header-text`}>
          {<RenderTitle element="span" />}
        </h2>
        <button
          aria-label={t('general:close')}
          className={`${documentDrawerBaseClass}__header-close`}
          onClick={() => closeModal(drawerSlug)}
          type="button"
        >
          <XIcon />
        </button>
      </div>
      {showDocumentID && <DocumentID />}
      {AfterHeader ? (
        <div className={`${documentDrawerBaseClass}__after-header`}>{AfterHeader}</div>
      ) : null}
    </Gutter>
  )
}

const DocumentID: React.FC = () => {
  const { id } = useDocumentInfo()
  const { title } = useDocumentTitle()
  return id && id !== title ? <IDLabel id={id.toString()} /> : null
}

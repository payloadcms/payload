'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import React, { useCallback, useState } from 'react'
import { useTranslation } from '../../providers/Translation'
import { useHistory } from 'react-router-dom'
import { toast } from 'react-toastify'

import type { Props } from './types'

import { getTranslation } from 'payload/utilities'
// import { requests } from '../../../api'
import { useForm, useFormModified } from '../../forms/Form/context'
import { MinimalTemplate } from '../../templates/Minimal'
import { useConfig } from '../../providers/Config'
import { Button } from '../Button'
import * as PopupList from '../Popup/PopupButtonList'
import './index.scss'

const baseClass = 'duplicate'

const Duplicate: React.FC<Props> = ({ id, collection, slug }) => {
  const { push } = useHistory()
  const modified = useFormModified()
  const { toggleModal } = useModal()
  const { setModified } = useForm()
  const {
    localization,
    routes: { api },
    serverURL,
  } = useConfig()
  const {
    routes: { admin },
  } = useConfig()
  const [hasClicked, setHasClicked] = useState<boolean>(false)
  const { i18n, t } = useTranslation()

  const modalSlug = `duplicate-${id}`

  const handleClick = useCallback(
    async (override = false) => {
      setHasClicked(true)

      if (modified && !override) {
        toggleModal(modalSlug)
        return
      }

      const saveDocument = async ({
        id,
        duplicateID = '',
        locale = '',
      }): Promise<null | string> => {
        let data = null

        // const response = await requests.get(`${serverURL}${api}/${slug}/${id}`, {
        //   headers: {
        //     'Accept-Language': i18n.language,
        //   },
        //   params: {
        //     depth: 0,
        //     draft: true,
        //     'fallback-locale': 'none',
        //     locale,
        //   },
        // })

        // let data = await response.json()

        if (typeof collection.admin.hooks?.beforeDuplicate === 'function') {
          data = await collection.admin.hooks.beforeDuplicate({
            collection,
            data,
            locale,
          })
        }

        if (!duplicateID) {
          if ('createdAt' in data) delete data.createdAt
          if ('updatedAt' in data) delete data.updatedAt
        }

        // const result = await requests[duplicateID ? 'patch' : 'post'](
        //   `${serverURL}${api}/${slug}/${duplicateID}?locale=${locale}&fallback-locale=none`,
        //   {
        //     body: JSON.stringify(data),
        //     headers: {
        //       'Accept-Language': i18n.language,
        //       'Content-Type': 'application/json',
        //     },
        //   },
        // )

        // const json = await result.json()

        // if (result.status === 201 || result.status === 200) {
        //   return json.doc.id
        // }

        // only show the error if this is the initial request failing
        if (!duplicateID) {
          // json.errors.forEach((error) => toast.error(error.message))
        }
        return null
      }

      let duplicateID: string
      let abort = false
      const localeErrors = []

      if (localization) {
        await localization.localeCodes.reduce(async (priorLocalePatch, locale) => {
          await priorLocalePatch
          if (abort) return
          const localeResult = await saveDocument({
            id,
            duplicateID,
            locale,
          })
          duplicateID = localeResult || duplicateID
          if (duplicateID && !localeResult) {
            localeErrors.push(locale)
          }
          if (!duplicateID) {
            abort = true
          }
        }, Promise.resolve())
      } else {
        duplicateID = await saveDocument({ id })
      }

      if (!duplicateID) {
        // document was not saved, error toast was displayed
        return
      }

      toast.success(
        t('general:successfullyDuplicated', {
          label: getTranslation(collection.labels.singular, i18n),
        }),
        { autoClose: 3000 },
      )

      if (localeErrors.length > 0) {
        toast.error(
          `
          ${t('error:localesNotSaved', { count: localeErrors.length })}
          ${localeErrors.join(', ')}
          `,
          { autoClose: 5000 },
        )
      }

      setModified(false)

      setTimeout(() => {
        push({
          pathname: `${admin}/collections/${slug}/${duplicateID}`,
        })
      }, 10)
    },
    [
      modified,
      localization,
      t,
      i18n,
      collection,
      setModified,
      toggleModal,
      modalSlug,
      serverURL,
      api,
      slug,
      id,
      push,
      admin,
    ],
  )

  const confirm = useCallback(async () => {
    setHasClicked(false)
    await handleClick(true)
  }, [handleClick])

  return (
    <React.Fragment>
      <PopupList.Button id="action-duplicate" onClick={() => handleClick(false)}>
        {t('general:duplicate')}
      </PopupList.Button>
      {modified && hasClicked && (
        <Modal className={`${baseClass}__modal`} slug={modalSlug}>
          <MinimalTemplate className={`${baseClass}__modal-template`}>
            <h1>{t('general:confirmDuplication')}</h1>
            <p>{t('general:unsavedChangesDuplicate')}</p>
            <Button
              buttonStyle="secondary"
              id="confirm-cancel"
              onClick={() => toggleModal(modalSlug)}
              type="button"
            >
              {t('general:cancel')}
            </Button>
            <Button id="confirm-duplicate" onClick={confirm}>
              {t('general:duplicateWithoutSaving')}
            </Button>
          </MinimalTemplate>
        </Modal>
      )}
    </React.Fragment>
  )
}

export default Duplicate

import { useWindowInfo } from '@faceless-ui/window-info'
import React, { useEffect, useState } from 'react'
import AnimateHeight from 'react-animate-height'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { Props } from './types'

import { fieldAffectsData } from '../../../../fields/config/types'
import flattenFields from '../../../../utilities/flattenTopLevelFields'
import { getTranslation } from '../../../../utilities/getTranslation'
import Chevron from '../../icons/Chevron'
import { useSearchParams } from '../../utilities/SearchParams'
import Button from '../Button'
import ColumnSelector from '../ColumnSelector'
import DeleteMany from '../DeleteMany'
import EditMany from '../EditMany'
import Pill from '../Pill'
import PublishMany from '../PublishMany'
import SearchFilter from '../SearchFilter'
import SortComplex from '../SortComplex'
import UnpublishMany from '../UnpublishMany'
import WhereBuilder from '../WhereBuilder'
import validateWhereQuery from '../WhereBuilder/validateWhereQuery'
import { getTextFieldsToBeSearched } from './getTextFieldsToBeSearched'
import './index.scss'

const baseClass = 'list-controls'

const getUseAsTitle = (collection: SanitizedCollectionConfig) => {
  const {
    admin: { useAsTitle },
    fields,
  } = collection

  const topLevelFields = flattenFields(fields)
  return topLevelFields.find((field) => fieldAffectsData(field) && field.name === useAsTitle)
}

/**
 * The ListControls component is used to render the controls (search, filter, where)
 * for a collection's list view. You can find those directly above the table which lists
 * the collection's documents.
 */
const ListControls: React.FC<Props> = (props) => {
  const {
    collection: {
      admin: { listSearchableFields },
      fields,
    },
    collection,
    enableColumns = true,
    enableSort = false,
    handleSortChange,
    handleWhereChange,
    modifySearchQuery = true,
    resetParams,
  } = props

  const params = useSearchParams()
  const shouldInitializeWhereOpened = validateWhereQuery(params?.where)

  const [titleField, setTitleField] = useState(getUseAsTitle(collection))
  useEffect(() => {
    setTitleField(getUseAsTitle(collection))
  }, [collection])

  const [textFieldsToBeSearched] = useState(getTextFieldsToBeSearched(listSearchableFields, fields))
  const [visibleDrawer, setVisibleDrawer] = useState<'columns' | 'sort' | 'where'>(
    shouldInitializeWhereOpened ? 'where' : undefined,
  )
  const { i18n, t } = useTranslation('general')
  const {
    breakpoints: { s: smallBreak },
  } = useWindowInfo()

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <SearchFilter
          fieldLabel={
            (titleField &&
              fieldAffectsData(titleField) &&
              getTranslation(titleField.label || titleField.name, i18n)) ??
            undefined
          }
          fieldName={titleField && fieldAffectsData(titleField) ? titleField.name : undefined}
          handleChange={handleWhereChange}
          listSearchableFields={textFieldsToBeSearched}
          modifySearchQuery={modifySearchQuery}
        />
        <div className={`${baseClass}__buttons`}>
          <div className={`${baseClass}__buttons-wrap`}>
            {!smallBreak && (
              <React.Fragment>
                <EditMany collection={collection} resetParams={resetParams} />
                <PublishMany collection={collection} resetParams={resetParams} />
                <UnpublishMany collection={collection} resetParams={resetParams} />
                <DeleteMany collection={collection} resetParams={resetParams} />
              </React.Fragment>
            )}
            {enableColumns && (
              <Pill
                aria-controls={`${baseClass}-columns`}
                aria-expanded={visibleDrawer === 'columns'}
                className={`${baseClass}__toggle-columns ${
                  visibleDrawer === 'columns' ? `${baseClass}__buttons-active` : ''
                }`}
                icon={<Chevron />}
                onClick={() =>
                  setVisibleDrawer(visibleDrawer !== 'columns' ? 'columns' : undefined)
                }
                pillStyle="light"
              >
                {t('columns')}
              </Pill>
            )}
            <Pill
              aria-controls={`${baseClass}-where`}
              aria-expanded={visibleDrawer === 'where'}
              className={`${baseClass}__toggle-where ${
                visibleDrawer === 'where' ? `${baseClass}__buttons-active` : ''
              }`}
              icon={<Chevron />}
              onClick={() => setVisibleDrawer(visibleDrawer !== 'where' ? 'where' : undefined)}
              pillStyle="light"
            >
              {t('filters')}
            </Pill>
            {enableSort && (
              <Pill
                aria-controls={`${baseClass}-sort`}
                aria-expanded={visibleDrawer === 'sort'}
                className={`${baseClass}__toggle-sort`}
                icon={<Chevron />}
                onClick={() => setVisibleDrawer(visibleDrawer !== 'sort' ? 'sort' : undefined)}
                pillStyle="light"
              >
                {t('sort')}
              </Pill>
            )}
          </div>
        </div>
      </div>
      {enableColumns && (
        <AnimateHeight
          className={`${baseClass}__columns`}
          height={visibleDrawer === 'columns' ? 'auto' : 0}
          id={`${baseClass}-columns`}
        >
          <ColumnSelector collection={collection} />
        </AnimateHeight>
      )}
      <AnimateHeight
        className={`${baseClass}__where`}
        height={visibleDrawer === 'where' ? 'auto' : 0}
        id={`${baseClass}-where`}
      >
        <WhereBuilder
          collection={collection}
          handleChange={handleWhereChange}
          modifySearchQuery={modifySearchQuery}
        />
      </AnimateHeight>
      {enableSort && (
        <AnimateHeight
          className={`${baseClass}__sort`}
          height={visibleDrawer === 'sort' ? 'auto' : 0}
          id={`${baseClass}-sort`}
        >
          <SortComplex
            collection={collection}
            handleChange={handleSortChange}
            modifySearchQuery={modifySearchQuery}
          />
        </AnimateHeight>
      )}
    </div>
  )
}

export default ListControls

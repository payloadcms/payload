import pkg from '@faceless-ui/window-info'
const { useWindowInfo } = pkg
import React, { useEffect, useState } from 'react'
import AnimateHeight from 'react-animate-height'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig } from '../../../../collections/config/types.js'
import type { Props } from './types.js'

import { fieldAffectsData } from '../../../../fields/config/types.js'
import flattenFields from '../../../../utilities/flattenTopLevelFields.js'
import { getTranslation } from '../../../../utilities/getTranslation.js'
import Chevron from '../../icons/Chevron/index.js'
import { useSearchParams } from '../../utilities/SearchParams/index.js'
import Button from '../Button/index.js'
import ColumnSelector from '../ColumnSelector/index.js'
import DeleteMany from '../DeleteMany/index.js'
import EditMany from '../EditMany/index.js'
import Pill from '../Pill/index.js'
import PublishMany from '../PublishMany/index.js'
import SearchFilter from '../SearchFilter/index.js'
import SortComplex from '../SortComplex/index.js'
import UnpublishMany from '../UnpublishMany/index.js'
import WhereBuilder from '../WhereBuilder/index.js'
import validateWhereQuery from '../WhereBuilder/validateWhereQuery.js'
import { getTextFieldsToBeSearched } from './getTextFieldsToBeSearched.js'
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
                className={`${baseClass}__toggle-columns ${
                  visibleDrawer === 'columns' ? `${baseClass}__buttons-active` : ''
                }`}
                onClick={() =>
                  setVisibleDrawer(visibleDrawer !== 'columns' ? 'columns' : undefined)
                }
                aria-controls={`${baseClass}-columns`}
                aria-expanded={visibleDrawer === 'columns'}
                icon={<Chevron />}
                pillStyle="light"
              >
                {t('columns')}
              </Pill>
            )}
            <Pill
              className={`${baseClass}__toggle-where ${
                visibleDrawer === 'where' ? `${baseClass}__buttons-active` : ''
              }`}
              aria-controls={`${baseClass}-where`}
              aria-expanded={visibleDrawer === 'where'}
              icon={<Chevron />}
              onClick={() => setVisibleDrawer(visibleDrawer !== 'where' ? 'where' : undefined)}
              pillStyle="light"
            >
              {t('filters')}
            </Pill>
            {enableSort && (
              <Button
                aria-controls={`${baseClass}-sort`}
                aria-expanded={visibleDrawer === 'sort'}
                buttonStyle={visibleDrawer === 'sort' ? undefined : 'secondary'}
                className={`${baseClass}__toggle-sort`}
                icon="chevron"
                iconStyle="none"
                onClick={() => setVisibleDrawer(visibleDrawer !== 'sort' ? 'sort' : undefined)}
              >
                {t('sort')}
              </Button>
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

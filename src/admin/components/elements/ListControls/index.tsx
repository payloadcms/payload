import React, { useState } from 'react';
import AnimateHeight from 'react-animate-height';
import { useTranslation } from 'react-i18next';
import { fieldAffectsData } from '../../../../fields/config/types';
import SearchFilter from '../SearchFilter';
import ColumnSelector from '../ColumnSelector';
import WhereBuilder from '../WhereBuilder';
import SortComplex from '../SortComplex';
import Button from '../Button';
import { Props } from './types';
import { useSearchParams } from '../../utilities/SearchParams';
import validateWhereQuery from '../WhereBuilder/validateWhereQuery';
import { getTextFieldsToBeSearched } from './getTextFieldsToBeSearched';
import { getTranslation } from '../../../../utilities/getTranslation';
import Pill from '../Pill';
import Chevron from '../../icons/Chevron';
import DeleteManyDocuments from '../DeleteManyDocuments';

import './index.scss';

const baseClass = 'list-controls';

const ListControls: React.FC<Props> = (props) => {
  const {
    collection,
    enableColumns = true,
    enableSort = false,
    columns,
    setColumns,
    handleSortChange,
    handleWhereChange,
    modifySearchQuery = true,
    resetParams,
    collection: {
      fields,
      admin: {
        useAsTitle,
        listSearchableFields,
      },
    },
  } = props;

  const params = useSearchParams();
  const shouldInitializeWhereOpened = validateWhereQuery(params?.where);

  const [titleField] = useState(() => fields.find((field) => fieldAffectsData(field) && field.name === useAsTitle));
  const [textFieldsToBeSearched] = useState(getTextFieldsToBeSearched(listSearchableFields, fields));
  const [visibleDrawer, setVisibleDrawer] = useState<'where' | 'sort' | 'columns'>(shouldInitializeWhereOpened ? 'where' : undefined);
  const { t, i18n } = useTranslation('general');

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <SearchFilter
          fieldName={titleField && fieldAffectsData(titleField) ? titleField.name : undefined}
          handleChange={handleWhereChange}
          modifySearchQuery={modifySearchQuery}
          fieldLabel={(titleField && fieldAffectsData(titleField) && getTranslation(titleField.label || titleField.name, i18n)) ?? undefined}
          listSearchableFields={textFieldsToBeSearched}
        />
        <div className={`${baseClass}__buttons`}>
          <div className={`${baseClass}__buttons-wrap`}>
            <DeleteManyDocuments
              collection={collection}
              resetParams={resetParams}
            />
            {enableColumns && (
              <Pill
                pillStyle="dark"
                className={`${baseClass}__toggle-columns ${visibleDrawer === 'columns' ? `${baseClass}__buttons-active` : ''}`}
                onClick={() => setVisibleDrawer(visibleDrawer !== 'columns' ? 'columns' : undefined)}
                icon={<Chevron />}
              >
                {t('columns')}
              </Pill>
            )}
            <Pill
              pillStyle="dark"
              className={`${baseClass}__toggle-columns ${visibleDrawer === 'where' ? `${baseClass}__buttons-active` : ''}`}
              onClick={() => setVisibleDrawer(visibleDrawer !== 'where' ? 'where' : undefined)}
              icon={<Chevron />}
            >
              {t('filters')}
            </Pill>
            {enableSort && (
              <Button
                className={`${baseClass}__toggle-sort`}
                buttonStyle={visibleDrawer === 'sort' ? undefined : 'secondary'}
                onClick={() => setVisibleDrawer(visibleDrawer !== 'sort' ? 'sort' : undefined)}
                icon="chevron"
                iconStyle="none"
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
        >
          <ColumnSelector
            collection={collection}
            columns={columns}
            setColumns={setColumns}
          />
        </AnimateHeight>
      )}
      <AnimateHeight
        className={`${baseClass}__where`}
        height={visibleDrawer === 'where' ? 'auto' : 0}
      >
        <WhereBuilder
          collection={collection}
          modifySearchQuery={modifySearchQuery}
          handleChange={handleWhereChange}
        />
      </AnimateHeight>
      {enableSort && (
        <AnimateHeight
          className={`${baseClass}__sort`}
          height={visibleDrawer === 'sort' ? 'auto' : 0}
        >
          <SortComplex
            modifySearchQuery={modifySearchQuery}
            collection={collection}
            handleChange={handleSortChange}
          />
        </AnimateHeight>
      )}
    </div>
  );
};

export default ListControls;

import React, { useState } from 'react';
import AnimateHeight from 'react-animate-height';
import { fieldIsNamed } from '../../../../fields/config/types';
import SearchFilter from '../SearchFilter';
import ColumnSelector from '../ColumnSelector';
import WhereBuilder from '../WhereBuilder';
import SortComplex from '../SortComplex';
import Button from '../Button';
import { Props } from './types';
import { useSearchParams } from '../../utilities/SearchParams';

import validateWhereQuery from '../WhereBuilder/validateWhereQuery';

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
    collection: {
      fields,
      admin: {
        useAsTitle,
      },
    },
  } = props;

  const params = useSearchParams();
  const shouldInitializeWhereOpened = validateWhereQuery(params?.where);

  const [titleField] = useState(() => fields.find((field) => fieldIsNamed(field) && field.name === useAsTitle));
  const [visibleDrawer, setVisibleDrawer] = useState<'where' | 'sort' | 'columns'>(shouldInitializeWhereOpened ? 'where' : undefined);

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <SearchFilter
          fieldName={titleField && fieldIsNamed(titleField) ? titleField.name : undefined}
          handleChange={handleWhereChange}
          modifySearchQuery={modifySearchQuery}
          fieldLabel={titleField && titleField.label ? titleField.label : undefined}
        />
        <div className={`${baseClass}__buttons`}>
          <div className={`${baseClass}__buttons-wrap`}>
            {enableColumns && (
              <Button
                className={`${baseClass}__toggle-columns`}
                buttonStyle={visibleDrawer === 'columns' ? undefined : 'secondary'}
                onClick={() => setVisibleDrawer(visibleDrawer !== 'columns' ? 'columns' : undefined)}
                icon="chevron"
                iconStyle="none"
              >
                Columns
              </Button>
            )}
            <Button
              className={`${baseClass}__toggle-where`}
              buttonStyle={visibleDrawer === 'where' ? undefined : 'secondary'}
              onClick={() => setVisibleDrawer(visibleDrawer !== 'where' ? 'where' : undefined)}
              icon="chevron"
              iconStyle="none"
            >
              Filters
            </Button>
            {enableSort && (
              <Button
                className={`${baseClass}__toggle-sort`}
                buttonStyle={visibleDrawer === 'sort' ? undefined : 'secondary'}
                onClick={() => setVisibleDrawer(visibleDrawer !== 'sort' ? 'sort' : undefined)}
                icon="chevron"
                iconStyle="none"
              >
                Sort
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

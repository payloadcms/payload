import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import SearchFilter from '../SearchFilter';
import ColumnSelector from '../ColumnSelector';
import WhereBuilder from '../WhereBuilder';
import SortComplex from '../SortComplex';
import Button from '../Button';

import './index.scss';

const baseClass = 'list-controls';

const ListControls = (props) => {
  const {
    handleChange,
    collection,
    enableColumns,
    enableSort,
    setSort,
    collection: {
      fields,
      admin: {
        useAsTitle,
        defaultColumns,
      },
    },
  } = props;

  const [titleField, setTitleField] = useState(null);
  const [search, setSearch] = useState('');
  const [columns, setColumns] = useState([]);
  const [where, setWhere] = useState({});
  const [visibleDrawer, setVisibleDrawer] = useState(false);

  useEffect(() => {
    if (useAsTitle) {
      const foundTitleField = fields.find((field) => field.name === useAsTitle);

      if (foundTitleField) {
        setTitleField(foundTitleField);
      }
    }
  }, [useAsTitle, fields]);

  useEffect(() => {
    const newState = {
      columns,
    };

    if (search) {
      newState.where = {
        and: [
          search,
        ],
      };
    }

    if (where) {
      if (!search) {
        newState.where = {
          and: [],
        };
      }

      newState.where.and.push(where);
    }

    handleChange(newState);
  }, [search, columns, where, handleChange]);

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <SearchFilter
          handleChange={setSearch}
          fieldName={titleField ? titleField.name : undefined}
          fieldLabel={titleField ? titleField.label : undefined}
        />
        <div className={`${baseClass}__buttons`}>
          <div className={`${baseClass}__buttons-wrap`}>
            {enableColumns && (
              <Button
                className={`${baseClass}__toggle-columns`}
                buttonStyle={visibleDrawer === 'columns' ? undefined : 'secondary'}
                onClick={() => setVisibleDrawer(visibleDrawer !== 'columns' ? 'columns' : false)}
                icon="chevron"
                iconStyle="none"
              >
                Columns
              </Button>
            )}
            <Button
              className={`${baseClass}__toggle-where`}
              buttonStyle={visibleDrawer === 'where' ? undefined : 'secondary'}
              onClick={() => setVisibleDrawer(visibleDrawer !== 'where' ? 'where' : false)}
              icon="chevron"
              iconStyle="none"
            >
              Filters
            </Button>
            {enableSort && (
              <Button
                className={`${baseClass}__toggle-sort`}
                buttonStyle={visibleDrawer === 'sort' ? undefined : 'secondary'}
                onClick={() => setVisibleDrawer(visibleDrawer !== 'sort' ? 'sort' : false)}
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
            defaultColumns={defaultColumns}
            handleChange={setColumns}
          />
        </AnimateHeight>
      )}
      <AnimateHeight
        className={`${baseClass}__where`}
        height={visibleDrawer === 'where' ? 'auto' : 0}
      >
        <WhereBuilder
          handleChange={setWhere}
          collection={collection}
        />
      </AnimateHeight>
      {enableSort && (
        <AnimateHeight
          className={`${baseClass}__sort`}
          height={visibleDrawer === 'sort' ? 'auto' : 0}
        >
          <SortComplex
            handleChange={setSort}
            collection={collection}
            enableSort
          />
        </AnimateHeight>
      )}
    </div>
  );
};

ListControls.defaultProps = {
  enableColumns: true,
  enableSort: false,
};

ListControls.propTypes = {
  enableColumns: PropTypes.bool,
  enableSort: PropTypes.bool,
  setSort: PropTypes.func.isRequired,
  collection: PropTypes.shape({
    admin: PropTypes.shape({
      useAsTitle: PropTypes.string,
      defaultColumns: PropTypes.arrayOf(
        PropTypes.string,
      ),
    }),
    fields: PropTypes.arrayOf(PropTypes.shape),
  }).isRequired,
  handleChange: PropTypes.func.isRequired,
};

export default ListControls;

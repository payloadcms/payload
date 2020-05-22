import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
// import customComponents from '../../customComponents';
import SearchFilter from '../SearchFilter';
import ColumnSelector from '../ColumnSelector';
import WhereBuilder from '../WhereBuilder';
import Button from '../Button';
import Chevron from '../../icons/Chevron';

import './index.scss';

const baseClass = 'list-controls';

const ListControls = (props) => {
  const {
    handleChange,
    collection: {
      fields,
      useAsTitle,
      defaultColumns,
    },
  } = props;

  const [titleField, setTitleField] = useState(null);
  const [search, setSearch] = useState('');
  const [columns, setColumns] = useState([]);
  const [where, setWhere] = useState({});
  const [visibleDrawer, setVisibleDrawer] = useState(false);

  useEffect(() => {
    if (useAsTitle) {
      const foundTitleField = fields.find(field => field.name === useAsTitle);

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
        AND: [
          search,
        ],
      };
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
        <Button
          className={`${baseClass}__toggle-columns`}
          buttonStyle={visibleDrawer === 'columns' ? undefined : 'secondary'}
          onClick={() => setVisibleDrawer(visibleDrawer !== 'columns' ? 'columns' : false)}
          icon={<Chevron />}
        >
          Columns
        </Button>
        <Button
          className={`${baseClass}__toggle-where`}
          buttonStyle={visibleDrawer === 'where' ? undefined : 'secondary'}
          onClick={() => setVisibleDrawer(visibleDrawer !== 'where' ? 'where' : false)}
          icon={<Chevron />}
        >
          Filters
        </Button>
      </div>
      <AnimateHeight
        className={`${baseClass}__columns`}
        height={visibleDrawer === 'columns' ? 'auto' : 0}
      >
        <ColumnSelector
          useAsTitle={useAsTitle}
          fields={fields}
          defaultColumns={defaultColumns}
          handleChange={setColumns}
        />
      </AnimateHeight>
      <AnimateHeight
        className={`${baseClass}__where`}
        height={visibleDrawer === 'where' ? 'auto' : 0}
      >
        <WhereBuilder handleChange={setWhere} />
      </AnimateHeight>
    </div>
  );
};

ListControls.propTypes = {
  collection: PropTypes.shape({
    useAsTitle: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape),
    defaultColumns: PropTypes.arrayOf(
      PropTypes.string,
    ),
  }).isRequired,
  handleChange: PropTypes.func.isRequired,
};

export default ListControls;

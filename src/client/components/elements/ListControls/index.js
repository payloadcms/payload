import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
// import customComponents from '../../customComponents';
import SearchFilter from '../SearchFilter';
import Button from '../Button';
import Chevron from '../../icons/Chevron';

import './index.scss';

const baseClass = 'list-controls';

const ListControls = (props) => {
  const {
    handleChange,
    collection: {
      useAsTitle,
      fields,
    },
  } = props;

  const [titleField, setTitleField] = useState(null);
  const [search, setSearch] = useState('');
  const [columns, setColumns] = useState([]);
  const [filters, setFilters] = useState({});
  const [columnsVisible, setColumnsVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  useEffect(() => {
    if (useAsTitle) {
      const foundTitleField = fields.find(field => field.name === useAsTitle);

      if (foundTitleField) {
        setTitleField(foundTitleField);
      }
    }
  }, [useAsTitle, fields]);

  useEffect(() => {
    handleChange({
      where: {
        AND: [
          search,
        ],
      },
    });
  }, [search, columns, filters, handleChange]);

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <SearchFilter
          handleChange={setSearch}
          fieldName={titleField ? titleField.name : undefined}
          fieldLabel={titleField ? titleField.label : undefined}
        />
        <Button
          onClick={() => setColumnsVisible(!columnsVisible)}
          icon={<Chevron />}
        >
          Columns
        </Button>
        <Button
          onClick={() => setFiltersVisible(!filtersVisible)}
          icon={<Chevron />}
        >
          Filters
        </Button>
      </div>
    </div>
  );
};

ListControls.propTypes = {
  collection: PropTypes.shape({
    useAsTitle: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape),
  }).isRequired,
  handleChange: PropTypes.func.isRequired,
};

export default ListControls;

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
// import customComponents from '../../customComponents';
import SearchFilter from '../SearchFilter';

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
      <SearchFilter
        handleChange={setSearch}
        fieldName={titleField ? titleField.name : undefined}
        fieldLabel={titleField ? titleField.label : undefined}
      />
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

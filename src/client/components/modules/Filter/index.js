import React from 'react';
import Form from '../../forms/Form';
import Text from '../../forms/field-types/Text';

const Filter = () => {
  return (
    <Form className="filter">
      <Text
        placeholder="Search"
        name="keywords"
      />
    </Form>
  );
};

export default Filter;

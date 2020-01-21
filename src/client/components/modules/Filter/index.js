import React from 'react';
import Form from '../../forms/Form';
import Input from '../../forms/field-types/Input';

const Filter = () => {
  return (
    <Form className="filter">
      <Input
        placeholder="Search"
        name="keywords"
      />
    </Form>
  );
};

export default Filter;

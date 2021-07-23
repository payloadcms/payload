import React from 'react';

const CustomDescriptionComponent: React.FC = ({ value }) => (
  <div>
    character count:
    {' '}
    { value.length }
  </div>
);

export default CustomDescriptionComponent;

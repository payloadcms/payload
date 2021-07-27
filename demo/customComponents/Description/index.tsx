import React from 'react';

const CustomDescriptionComponent: React.FC = ({ value }) => (
  <div>
    Character count:
    {' '}
    { value?.length || 0 }
  </div>
);

export default CustomDescriptionComponent;

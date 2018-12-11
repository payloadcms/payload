import React from 'react';

const Close = props => {
  return (
    <svg className="icon close" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <line className="stroke" stroke={props.color} x1="0" y1="0" x2="48" y2="48"/>
      <line className="stroke" stroke={props.color} x1="0" y1="48" x2="48" y2="0"/>
    </svg>
  );
};

export default Close;

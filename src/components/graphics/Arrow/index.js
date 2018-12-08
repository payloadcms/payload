import React from 'react';

const Arrow = props => {
  return (
    <svg className="icon arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 199.35">
      <line className="stroke" stroke={props.color} x1="12.5" y1="99.8" x2="192.8" y2="99.8"/>
      <polyline className="stroke" stroke={props.color} points="102.5,190.1 192.8,99.8 102.5,9.5 "/>
    </svg>
  );
};

export default Arrow;

import React from 'react';
import PropTypes from 'prop-types';

const SelectCell = ({ data, field }) => {
  const findLabel = (items) => items.map((i) => {
    const found = field.options.filter((f) => f.value === i)?.[0]?.label;
    return found;
  }).join(', ');

  let content = '';
  if (field?.options?.[0]?.value) {
    content = (Array.isArray(data))
      ? findLabel(data) // hasMany
      : findLabel([data]);
  } else {
    content = data.join(', ');
  }
  return (
    <span>
      {content}
    </span>
  );
};

SelectCell.defaultProps = {
  data: [],
};

SelectCell.propTypes = {
  data: PropTypes.oneOfType(
    [
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string,
        label: PropTypes.string,
      })),
    ],
  ),
  field: PropTypes.shape({
    singularLabel: PropTypes.string,
    label: PropTypes.string,
    options: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          value: PropTypes.string,
          label: PropTypes.string,
        }),
      ]),
    ),
  }).isRequired,
};

export default SelectCell;

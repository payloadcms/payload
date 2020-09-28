import React from 'react';
import PropTypes from 'prop-types';

const RichTextCell = ({ data }) => {
  const flattenedText = data?.map((i) => i?.children?.map((c) => c.text)).join(' ');
  const textToShow = flattenedText.length > 100 ? `${flattenedText.slice(0, 100)}\u2026` : flattenedText;
  return (
    <span>{textToShow}</span>
  );
};

RichTextCell.defaultProps = {
  data: [],
};

RichTextCell.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      children: PropTypes.arrayOf(
        PropTypes.shape({
          bold: PropTypes.string,
          text: PropTypes.string,
        }),
      ),
    }),
  ),


  field: PropTypes.shape({
    singularLabel: PropTypes.string,
    label: PropTypes.string,
  }).isRequired,
};

export default RichTextCell;

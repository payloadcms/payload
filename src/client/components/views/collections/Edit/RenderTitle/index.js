import React from 'react';
import PropTypes from 'prop-types';
import useTitle from '../../../../../hooks/useTitle';

const RenderTitle = (props) => {
  const {
    useAsTitle, title: titleFromProps, data, fallback,
  } = props;

  const titleFromForm = useTitle(useAsTitle);
  const titleFromData = data && data[useAsTitle];

  let title = titleFromData;
  if (!title) title = titleFromForm;
  if (!title) title = data.id;
  if (!title) title = fallback;
  title = titleFromProps || title;

  return <>{title}</>;
};

RenderTitle.defaultProps = {
  title: undefined,
  fallback: '[Untitled]',
  useAsTitle: null,
  data: null,
};

RenderTitle.propTypes = {
  useAsTitle: PropTypes.string,
  data: PropTypes.shape({
    id: PropTypes.string,
  }),
  title: PropTypes.string,
  fallback: PropTypes.string,
};


export default RenderTitle;

import React from 'react';
import PropTypes from 'prop-types';
import useTitle from '../../../../../hooks/useTitle';

const RenderTitle = (props) => {
  const {
    useAsTitle, title: titleFromProps, id, fallback,
  } = props;

  let title = useTitle(useAsTitle) || id;
  title = title || fallback;
  title = titleFromProps || title;

  return <>{title}</>;
};

RenderTitle.defaultProps = {
  title: undefined,
  fallback: '[Untitled]',
};

RenderTitle.propTypes = {
  useAsTitle: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  title: PropTypes.string,
  fallback: PropTypes.string,
};


export default RenderTitle;

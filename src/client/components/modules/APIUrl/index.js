import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const APIURL = ({ url }) => {
  return (
    <div className="api-url">
      <span className="uppercase-label">API URL</span>
      {url
        && (
          <div className="url">
            <a
              href={url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {url}
            </a>
          </div>
        )
      }
      {!url
        && <div>&mdash;</div>
      }
    </div>
  );
};

APIURL.propTypes = {
  url: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]).isRequired,
};

export default APIURL;

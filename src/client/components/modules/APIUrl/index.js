import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import './index.scss';

const mapState = state => ({
  locale: state.common.locale,
  config: state.common.config,
});

const APIUrl = (props) => {
  const { collectionSlug, id } = props.match.params;

  const apiUrl = `${props.config.serverURL}/${collectionSlug}/${id}`;

  return (
    <div className="api-url">
      <span className="uppercase-label">API URL</span>
      {id
        && (
          <div className="url">
            <a
              href={apiUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {apiUrl}
            </a>
          </div>
        )
      }
      {!id
        && <div>&mdash;</div>
      }
    </div>
  );
};

export default withRouter(connect(mapState)(APIUrl));

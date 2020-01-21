import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useLocale } from '../../utilities/Locale';
import getSanitizedConfig from '../../../config/getSanitizedConfig';

import './index.scss';

const { serverURL } = getSanitizedConfig();

const APIURL = () => {
  const { collectionSlug, id } = useRouteMatch();
  const locale = useLocale();

  const apiUrl = `${serverURL}/${collectionSlug}/${id}?locale=${locale}`;

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

export default APIURL;

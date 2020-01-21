import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useRouteMatch, useHistory } from 'react-router-dom';
import config from 'payload-config';
import useMountEffect from '../../hooks/useMountEffect';
import { requests } from '../../api';
import { useLocale } from '../utilities/Locale';

const withEditData = (PassedComponent) => {
  const EditData = (props) => {
    const { collection } = props;
    const locale = useLocale();
    const [data, setData] = useState({});
    const match = useRouteMatch();
    const history = useHistory();

    const fetchData = () => {
      const { id } = match.params;

      const params = {
        locale,
        'fallback-locale': 'null',
      };

      if (id) {
        requests.get(`${config.serverUrl}/${collection.slug}/${id}`, params).then(
          res => setData(res),
          (err) => {
            console.warn(err);
            history.push('/not-found');
          },
        );
      }
    };

    useMountEffect(fetchData);
    useEffect(fetchData, [locale]);

    return (
      <PassedComponent
        {...props}
        data={data}
      />
    );
  };

  EditData.propTypes = {
    collection: PropTypes.shape({
      slug: PropTypes.string,
    }).isRequired,
  };


  return EditData;
};

export default withEditData;

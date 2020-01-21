import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import config from 'payload-config';
import { requests } from '../../api';
import useMountEffect from '../../hooks/useMountEffect';
import { useLocale } from '../utilities/Locale';

const withListData = (PassedComponent) => {
  const ListData = (props) => {
    const { collection } = props;
    const locale = useLocale();
    const [data, setData] = useState({});

    const fetchData = () => {
      const params = { locale };
      requests.get(`${config.serverUrl}/${collection.slug}`, params).then(
        res => setData(res),
        err => console.warn(err),
      );
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

  ListData.propTypes = {
    collection: PropTypes.shape({
      slug: PropTypes.string,
    }).isRequired,
  };

  return ListData;
};

export default withListData;

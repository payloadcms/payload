import { useState, useEffect } from 'react';
import queryString from 'qs';
import { useLocale } from '../components/utilities/Locale';
import { requests } from '../api';

const usePayloadAPI = (url, options = {}) => {
  const {
    initialParams = {},
    initialData = {},
    onLoad,
  } = options;

  const [data, setData] = useState(initialData);
  const [params, setParams] = useState(initialParams);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const locale = useLocale();

  const search = queryString.stringify({
    locale,
    ...params,
  }, { depth: 10 });

  useEffect(() => {
    const fetchData = async () => {
      setIsError(false);
      setIsLoading(true);

      try {
        const response = await requests.get(`${url}?${search}`);
        const json = await response.json();
        setData(json);
        setIsLoading(false);
      } catch (error) {
        setIsError(true);
        setIsLoading(false);
      }
    };

    if (url) {
      fetchData();
    } else {
      setIsError(false);
      setIsLoading(false);
    }
  }, [url, locale, search, onLoad]);

  return [{ data, isLoading, isError }, { setParams }];
};

export default usePayloadAPI;

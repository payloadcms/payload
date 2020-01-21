import { useState, useEffect } from 'react';
import queryString from 'qs';
import { useLocale } from '../components/utilities/Locale';

const usePayloadAPI = (url, initialParams = {}, initialData = {}) => {
  const [data, setData] = useState(initialData);
  const [params, setParams] = useState(initialParams);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    const fetchData = async () => {
      setIsError(false);
      setIsLoading(true);

      try {
        const search = queryString.stringify({
          locale,
          ...params,
        });

        const result = await fetch(`${url}?${search}`);
        setData(result);
      } catch (error) {
        setIsError(true);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [url, locale, params]);

  return [{ data, isLoading, isError }, { setParams }];
};

export default usePayloadAPI;

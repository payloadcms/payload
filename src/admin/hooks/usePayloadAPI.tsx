import { useState, useEffect } from 'react';
import queryString from 'qs';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../components/utilities/Locale';
import { requests } from '../api';

type Result = [
  {
    isLoading: boolean
    isError: boolean
    data: any
  },
  {
    setParams: React.Dispatch<unknown>
  }
]

type Options = {
  initialParams?: unknown
  initialData?: any
}

type UsePayloadAPI = (url: string, options?: Options) => Result;

const usePayloadAPI: UsePayloadAPI = (url, options = {}) => {
  const {
    initialParams = {},
    initialData = {},
  } = options;

  const { i18n } = useTranslation();
  const [data, setData] = useState(initialData);
  const [params, setParams] = useState(initialParams);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const locale = useLocale();

  const search = queryString.stringify({
    locale,
    ...(typeof params === 'object' ? params : {}),
  }, {
    addQueryPrefix: true,
  });

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      setIsError(false);
      setIsLoading(true);

      try {
        const response = await requests.get(`${url}${search}`, {
          signal: abortController.signal,
          headers: {
            'Accept-Language': i18n.language,
          },
        });

        if (response.status > 201) {
          setIsError(true);
        }

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

    return () => {
      abortController.abort();
    };
  }, [url, locale, search, i18n.language]);

  return [{ data, isLoading, isError }, { setParams }];
};

export default usePayloadAPI;

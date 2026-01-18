import { stringify } from 'qs-esm';
export const getRestPopulateFn = ({
  apiURL,
  depth,
  draft,
  locale
}) => {
  const populateFn = async ({
    id,
    collectionSlug,
    select
  }) => {
    const query = stringify({
      depth: depth ?? 0,
      draft: draft ?? false,
      locale,
      select
    }, {
      addQueryPrefix: true
    });
    const res = await fetch(`${apiURL}/${collectionSlug}/${id}${query}`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'GET'
    }).then(res => res.json());
    return res;
  };
  return populateFn;
};
//# sourceMappingURL=restPopulateFn.js.map
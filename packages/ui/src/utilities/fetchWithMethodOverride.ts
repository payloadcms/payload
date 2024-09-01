/**
 * fetchWithMethodOverride allows us to fetch data for a large query.
 *
 * If the URL is larger than 2083 characters we will hit URL limits in
 * browsers.
 *
 * One way to circumvent the limit is to use the header: 'X-HTTP-Method-Override' allowing us
 * to fetch data using a POST request instead of a GET request. However some proxies
 * disallow the use of the 'X-HTTP-Method-Override' therefore we only want to use it
 * as a last resort.
 */
export async function fetchWithMethodOverride({
  api,
  language,
  queryStr,
  relation,
  serverURL,
}: {
  api: string
  language: string
  queryStr: string
  relation: string
  serverURL: string
}): Promise<Response> {
  const baseUrl = `${serverURL}${api}/${relation}`

  // The '?' query character needs to be accounted for
  const useGet = baseUrl.length + queryStr.length + 1 < 2083

  const queryURL = `${baseUrl}${useGet ? `?${queryStr}` : ''}`

  return fetch(queryURL, {
    credentials: 'include',
    ...(!useGet && { body: queryStr }),
    headers: {
      'Accept-Language': language,
      ...(!useGet && {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-HTTP-Method-Override': 'GET',
      }),
    },
    method: useGet ? 'GET' : 'POST',
  })
}

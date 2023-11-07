type Args = {
  accessor: number | string
  apiRoute?: string
  collection: string
  depth: number
  id: number | string
  ref: Record<string, unknown>
  serverURL: string
}

export const promise = async ({
  id,
  accessor,
  apiRoute,
  collection,
  depth,
  ref,
  serverURL,
}: Args): Promise<void> => {
  const url = `${serverURL}${apiRoute || '/api'}/${collection}/${id}?depth=${depth}`

  let res: any = null

  try {
    res = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((res) => res.json())
  } catch (err) {
    console.error(err) // eslint-disable-line no-console
  }

  ref[accessor] = res
}

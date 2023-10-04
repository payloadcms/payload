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
  // TODO: get dynamic `api` route from config
  const res: any = await fetch(
    `${serverURL}${apiRoute || '/api'}/${collection}/${id}?depth=${depth}`,
  ).then((res) => res.json())

  ref[accessor] = res
}

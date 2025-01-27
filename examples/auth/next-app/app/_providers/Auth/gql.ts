export const USER = `
  id
  email
  firstName
  lastName
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const gql = async (query: string): Promise<any> => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/graphql`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
    })

    const { data, errors } = await res.json()

    if (errors) {
      throw new Error(errors[0].message)
    }

    if (res.ok && data) {
      return data
    }
  } catch (e: unknown) {
    throw new Error(e as string)
  }
}

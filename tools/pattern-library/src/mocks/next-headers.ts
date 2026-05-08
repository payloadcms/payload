export const headers = (): Promise<Headers> => Promise.resolve(new Headers())
export const cookies = (): Promise<{
  get: (_name: string) => null
  getAll: () => []
  has: (_name: string) => false
}> =>
  Promise.resolve({
    get: (_name: string) => null,
    getAll: () => [] as [],
    has: (_name: string) => false,
  })

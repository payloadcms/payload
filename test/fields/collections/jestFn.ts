// workaround for jest not being available during payload type generation
export const jestFn = (): jest.Mock => {
  return typeof jest !== 'undefined'
    ? jest.fn()
    : ((() => console.warn('jest.fn() not available')) as jest.Mock)
}

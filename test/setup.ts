// eslint-disable-next-line no-restricted-exports
export default () => {
  // @ts-expect-error
  process.env.NODE_ENV = 'test'
  process.env.PAYLOAD_DROP_DATABASE = 'true'
  process.env.NODE_OPTIONS = '--no-deprecation'
}

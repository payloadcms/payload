export default typeof process.env.PAYLOAD_CONFIG_PATH === 'string'
  ? require(process.env.PAYLOAD_CONFIG_PATH)
  : {}

console.log('PAYLOAD_CONFIG_PATH', process.env.PAYLOAD_CONFIG_PATH)

export default typeof process.env.PAYLOAD_CONFIG_PATH === 'string'
  ? require(process.env.PAYLOAD_CONFIG_PATH)
  : {}

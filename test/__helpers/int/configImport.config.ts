import type { SanitizedConfig } from 'payload'

process.env.PAYLOAD_TEST_CONFIG_IMPORTED = 'true'

export default Promise.resolve({} as SanitizedConfig)

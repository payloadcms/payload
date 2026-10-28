// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

process.env.PAYLOAD_SECRET ||= 'integration-test-only-secret'

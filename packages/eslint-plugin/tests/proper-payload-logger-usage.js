import { RuleTester } from 'eslint'
import rule from '../customRules/proper-payload-logger-usage.js'

const ruleTester = new RuleTester()

// Example tests for the rule
ruleTester.run('no-improper-payload-logger-error', rule, {
  valid: [
    // Valid: payload.logger.error with object containing { msg, err }
    {
      code: "payload.logger.error({ msg: 'some message', err })",
    },
    // Valid: payload.logger.error with a single string
    {
      code: "payload.logger.error('Some error message')",
    },
    // Valid: payload.logger.error with a templated string
    {
      code: 'payload.logger.error(`Some error message`)',
    },
    // Valid: *.payload.logger.error with object
    {
      code: "this.payload.logger.error({ msg: 'another message', err })",
    },
    {
      code: "args.req.payload.logger.error({ msg: 'different message', err })",
    },
  ],

  invalid: [
    // Invalid: payload.logger.error with both string and error
    {
      code: "payload.logger.error('Some error message', err)",
      errors: [
        {
          messageId: 'improperUsage',
        },
      ],
    },
    // Invalid: payload.logger.error with both templated string and error
    {
      code: 'payload.logger.error(`Some error message`, err)',
      errors: [
        {
          messageId: 'improperUsage',
        },
      ],
    },
    // Invalid: *.payload.logger.error with both string and error
    {
      code: "this.payload.logger.error('Some error message', error)",
      errors: [
        {
          messageId: 'improperUsage',
        },
      ],
    },
    {
      code: "args.req.payload.logger.error('Some error message', err)",
      errors: [
        {
          messageId: 'improperUsage',
        },
      ],
    },
    // Invalid: payload.logger.error with object containing 'message' key
    {
      code: "payload.logger.error({ message: 'not the right property name' })",
      errors: [
        {
          messageId: 'wrongMessageField',
        },
      ],
    },
    // Invalid: *.payload.logger.error with object containing 'error' key
    {
      code: "this.payload.logger.error({ msg: 'another message', error })",
      errors: [
        {
          messageId: 'wrongErrorField',
        },
      ],
    },
  ],
})

export const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow improper usage of payload.logger.error',
      recommended: 'error',
    },
    messages: {
      improperUsage: 'Improper logger usage. Pass { msg, err } so full error stack is logged.',
      wrongErrorField: 'Improper usage. Use { err } instead of { error }.',
      wrongMessageField: 'Improper usage. Use { msg } instead of { message }.',
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee

        // Function to check if the expression ends with `payload.logger.error`
        function isPayloadLoggerError(expression) {
          return (
            expression.type === 'MemberExpression' &&
            expression.property.name === 'error' && // must be `.error`
            expression.object.type === 'MemberExpression' &&
            expression.object.property.name === 'logger' && // must be `.logger`
            (expression.object.object.name === 'payload' || // handles just `payload`
              (expression.object.object.type === 'MemberExpression' &&
                expression.object.object.property.name === 'payload')) // handles `*.payload`
          )
        }

        // Check if the function being called is `payload.logger.error` or `*.payload.logger.error`
        if (isPayloadLoggerError(callee)) {
          const args = node.arguments

          // Case 1: Single string / templated string is passed as the argument
          if (
            args.length === 1 &&
            ((args[0].type === 'Literal' && typeof args[0].value === 'string') ||
              args[0].type === 'TemplateLiteral')
          ) {
            return // Valid: single string argument
          }

          // Case 2: Object is passed as the first argument
          if (args.length > 0 && args[0].type === 'ObjectExpression') {
            const properties = args[0].properties

            // Ensure no { error } key, only { err } is allowed
            properties.forEach((prop) => {
              if (prop.key.type === 'Identifier' && prop.key.name === 'error') {
                context.report({
                  node: prop,
                  messageId: 'wrongErrorField',
                })
              }

              // Ensure no { message } key, only { msg } is allowed
              if (prop.key.type === 'Identifier' && prop.key.name === 'message') {
                context.report({
                  node: prop,
                  messageId: 'wrongMessageField',
                })
              }
            })
            return // Valid object, checked for 'err'/'error' keys
          }

          // Case 3: Improper usage (string / templated string + error or additional err/error)
          if (
            args.length > 1 &&
            ((args[0].type === 'Literal' && typeof args[0].value === 'string') ||
              args[0].type === 'TemplateLiteral') &&
            args[1].type === 'Identifier' &&
            (args[1].name === 'err' || args[1].name === 'error')
          ) {
            context.report({
              node,
              messageId: 'improperUsage',
            })
          }
        }
      },
    }
  },
}

export default rule

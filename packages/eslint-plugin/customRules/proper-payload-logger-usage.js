export const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow improper usage of payload.logger.error',
      recommended: 'error',
    },
    messages: {
      improperUsage: 'Improper logger usage. Pass { msg, err } so full error stack is logged.',
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

          // Check if the first argument is not an object
          if (args.length > 0 && args[0].type !== 'ObjectExpression') {
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

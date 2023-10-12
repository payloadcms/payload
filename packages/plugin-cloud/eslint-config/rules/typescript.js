module.exports = {
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['**/**.ts', '**/**.d.ts'],
      rules: {
        'no-undef': 'off',
        camelcase: 'off',
        '@typescript-eslint/adjacent-overload-signatures': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/array-type.md
         */
        '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/await-thenable.md
         */
        '@typescript-eslint/await-thenable': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-type-assertions.md
         */
        '@typescript-eslint/consistent-type-assertions': [
          'error',
          { assertionStyle: 'as', objectLiteralTypeAssertions: 'allow-as-parameter' },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-type-definitions.md
         */
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-type-imports.md
         */
        '@typescript-eslint/consistent-type-imports': 'warn',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-function-return-type.md
         */
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          {
            // TODO: come back and check if we need those
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
            allowHigherOrderFunctions: true,
            allowConciseArrowFunctionExpressionsStartingWithVoid: false,
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-member-accessibility.md
         */
        '@typescript-eslint/explicit-member-accessibility': [
          'error',
          { accessibility: 'no-public' },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/member-delimiter-style.md
         */
        '@typescript-eslint/member-delimiter-style': [
          'error',
          {
            multiline: {
              delimiter: 'none',
              requireLast: true,
            },
            singleline: {
              delimiter: 'semi',
              requireLast: false,
            },
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/method-signature-style.md
         */
        '@typescript-eslint/method-signature-style': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/naming-convention.md
         */
        '@typescript-eslint/naming-convention': [
          'off',
          {
            selector: 'default',
            format: ['camelCase'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
          },
          {
            selector: 'variable',
            format: ['camelCase', 'UPPER_CASE'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
          },
          // Enforce that type parameters (generics) are prefixed with T or U
          {
            selector: 'typeParameter',
            format: ['PascalCase'],
            prefix: ['T', 'U'],
          },
          // enforce boolean variables to start with proper prefix.
          {
            selector: 'variable',
            types: ['boolean'],
            format: ['PascalCase'],
            prefix: ['is', 'should', 'has', 'can', 'did', 'will'],
          },
          // Enforce that interface names do not begin with an I
          {
            selector: 'interface',
            format: ['PascalCase'],
            custom: {
              regex: '^I[A-Z]',
              match: false,
            },
          },
          {
            selector: [
              'function',
              'parameter',
              'property',
              'parameterProperty',
              'method',
              'accessor',
            ],
            format: ['camelCase'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
          },
          {
            selector: ['class', 'interface', 'typeAlias', 'enum', 'typeParameter'],
            format: ['PascalCase'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-base-to-string.md
         */
        '@typescript-eslint/no-base-to-string': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-confusing-non-null-assertion.md
         */
        '@typescript-eslint/no-confusing-non-null-assertion': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-dynamic-delete.md
         */
        '@typescript-eslint/no-dynamic-delete': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-empty-interface.md
         */
        '@typescript-eslint/no-empty-interface': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-explicit-any.md
         */
        '@typescript-eslint/no-explicit-any': [
          'warn',
          {
            ignoreRestArgs: true,
            // enable later
            fixToUnknown: false,
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-extra-non-null-assertion.md
         */
        '@typescript-eslint/no-extra-non-null-assertion': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-extraneous-class.md
         */
        '@typescript-eslint/no-extraneous-class': [
          'error',
          {
            allowConstructorOnly: false,
            allowEmpty: false,
            allowStaticOnly: false,
            allowWithDecorator: false,
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-floating-promises.md
         */
        '@typescript-eslint/no-floating-promises': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-for-in-array.md
         */
        '@typescript-eslint/no-for-in-array': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-implicit-any-catch.md
         */
        '@typescript-eslint/no-implicit-any-catch': [
          'error',
          {
            allowExplicitAny: false,
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-implied-eval.md
         */
        '@typescript-eslint/no-implied-eval': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-inferrable-types.md
         */
        '@typescript-eslint/no-inferrable-types': [
          'error',
          {
            ignoreParameters: false,
            ignoreProperties: false,
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-invalid-void-type.md
         */
        '@typescript-eslint/no-invalid-void-type': [
          'off',
          {
            allowInGenericTypeArguments: true,
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-misused-new.md
         */
        '@typescript-eslint/no-misused-new': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-misused-promises.md
         */
        '@typescript-eslint/no-misused-promises': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-namespace.md
         */
        '@typescript-eslint/no-namespace': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-non-null-asserted-optional-chain.md
         */
        '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-non-null-assertion.md
         */
        '@typescript-eslint/no-non-null-assertion': 'warn',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-parameter-properties.md
         */
        '@typescript-eslint/no-parameter-properties': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-require-imports.md
         */
        '@typescript-eslint/no-require-imports': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-this-alias.md
         */
        '@typescript-eslint/no-this-alias': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-throw-literal.md
         */
        '@typescript-eslint/no-throw-literal': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-type-alias.md
         */
        '@typescript-eslint/no-type-alias': [
          'off',
          {
            allowAliases: 'always',
            allowCallbacks: 'always',
            allowConditionalTypes: 'always',
            allowConstructors: 'never',
            allowLiterals: 'in-unions-and-intersections',
            allowMappedTypes: 'always',
            allowTupleTypes: 'always',
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-boolean-literal-compare.md
         */
        '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-condition.md
         */
        '@typescript-eslint/no-unnecessary-condition': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-qualifier.md
         */
        '@typescript-eslint/no-unnecessary-qualifier': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-type-arguments.md
         */
        '@typescript-eslint/no-unnecessary-type-arguments': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-type-assertion.md
         */
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unsafe-assignment.md
         */
        '@typescript-eslint/no-unsafe-assignment': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unsafe-call.md
         */
        '@typescript-eslint/no-unsafe-call': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unsafe-member-access.md
         */
        '@typescript-eslint/no-unsafe-member-access': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unsafe-return.md
         */
        '@typescript-eslint/no-unsafe-return': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-var-requires.md
         */
        '@typescript-eslint/no-var-requires': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-as-const.md
         */
        '@typescript-eslint/prefer-as-const': 'error',
        /**
         * We don't care about enums having implicit values.
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-enum-initializers.md
         */
        '@typescript-eslint/prefer-enum-initializers': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-for-of.md
         */
        '@typescript-eslint/prefer-for-of': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-includes.md
         */
        '@typescript-eslint/prefer-includes': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-literal-enum-member.md
         */
        '@typescript-eslint/prefer-literal-enum-member': 'error',
        /**
         * using ES2015 syntax so this rule can be safetly turned off
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-namespace-keyword.md
         */
        '@typescript-eslint/prefer-namespace-keyword': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-nullish-coalescing.md
         */
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        /**
         * only set to warn because there are some cases this behavior doesnt work because
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-optional-chain.md
         */
        '@typescript-eslint/prefer-optional-chain': 'warn',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-readonly.md
         */
        '@typescript-eslint/prefer-readonly': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-readonly-parameter-types.md
         */
        '@typescript-eslint/prefer-readonly-parameter-types': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-reduce-type-parameter.md
         */
        '@typescript-eslint/prefer-reduce-type-parameter': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-regexp-exec.md
         */
        '@typescript-eslint/prefer-regexp-exec': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-string-starts-ends-with.md
         */
        '@typescript-eslint/prefer-string-starts-ends-with': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-ts-expect-error.md
         */
        '@typescript-eslint/prefer-ts-expect-error': 'warn',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/promise-function-async.md
         */
        '@typescript-eslint/promise-function-async': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/require-array-sort-compare.md
         */
        '@typescript-eslint/require-array-sort-compare': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/restrict-plus-operands.md
         */
        '@typescript-eslint/restrict-plus-operands': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/restrict-template-expressions.md
         */
        '@typescript-eslint/restrict-template-expressions': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/strict-boolean-expressions.md
         */
        '@typescript-eslint/strict-boolean-expressions': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/switch-exhaustiveness-check.md
         */
        '@typescript-eslint/switch-exhaustiveness-check': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/triple-slash-reference.md
         */
        '@typescript-eslint/triple-slash-reference': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/type-annotation-spacing.md
         */
        '@typescript-eslint/type-annotation-spacing': [
          'error',
          {
            before: false,
            after: true,
            overrides: {
              arrow: {
                before: true,
                after: true,
              },
            },
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/typedef.md
         */
        '@typescript-eslint/typedef': [
          'error',
          {
            arrayDestructuring: false,
            arrowParameter: false,
            memberVariableDeclaration: false,
            objectDestructuring: false,
            parameter: false,
            propertyDeclaration: true,
            variableDeclaration: false,
            variableDeclarationIgnoreFunction: false,
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/unbound-method.md
         */
        '@typescript-eslint/unbound-method': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/unified-signatures.md
         */
        '@typescript-eslint/unified-signatures': 'off',

        // @typescript-eslint Extension Rules
        // ==================================================================================
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/brace-style.md
         */
        'brace-style': 'off',
        '@typescript-eslint/brace-style': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/comma-spacing.md
         */
        'comma-spacing': 'off',
        '@typescript-eslint/comma-spacing': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/default-param-last.md
         */
        'default-param-last': 'off',
        '@typescript-eslint/default-param-last': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/dot-notation.md
         */
        'dot-notation': 'error',
        '@typescript-eslint/dot-notation': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/func-call-spacing.md
         */
        'func-call-spacing': 'off',
        '@typescript-eslint/func-call-spacing': 'error',
        /**
         * use prettier instead
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/indent.md
         */
        indent: 'off',
        '@typescript-eslint/indent': 'off',
        /**
         * Allow a mix between the two
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/init-declarations.md
         */
        '@typescript-eslint/init-declarations': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/keyword-spacing.md
         */
        'keyword-spacing': 'off',
        '@typescript-eslint/keyword-spacing': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/lines-between-class-members.md
         */
        'lines-between-class-members': 'off',
        '@typescript-eslint/lines-between-class-members': [
          'error',
          'always',
          {
            // base eslint config
            exceptAfterSingleLine: true,
            // typescript specific
            exceptAfterOverload: true,
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-array-constructor.md
         */
        'no-array-constructor': 'off',
        '@typescript-eslint/no-array-constructor': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-dupe-class-members.md
         */
        'no-dupe-class-members': 'off',
        '@typescript-eslint/no-dupe-class-members': 'error',
        /**
         * Use prettier
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-extra-parens.md
         */
        'no-extra-parens': 'off',
        '@typescript-eslint/no-extra-parens': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-extra-semi.md
         */
        'no-extra-semi': 'off',
        '@typescript-eslint/no-extra-semi': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-invalid-this.md
         */
        'no-invalid-this': 'off',
        '@typescript-eslint/no-invalid-this': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-loss-of-precision.md
         */
        'no-loss-of-precision': 'off',
        '@typescript-eslint/no-loss-of-precision': 'error',
        /**
         * https://eslint.org/docs/rules/no-magic-numbers
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-magic-numbers.md
         */
        'no-magic-numbers': 'off',
        '@typescript-eslint/no-magic-numbers': [
          'off',
          {
            // base eslint configs
            ignoreArrayIndexes: true,
            ignoreDefaultValues: true,
            enforceConst: true,
            // typescript specific configs
            ignoreEnums: true,
            ignoreNumericLiteralTypes: true,
            ignoreReadonlyClassProperties: true,
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-redeclare.md
         */
        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': [
          'error',
          {
            // prevents variables from being created with global variable naming
            builtinGlobals: true,
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-shadow.md
         */
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': [
          'error',
          {
            // No variables + types with same naming
            ignoreTypeValueShadow: false,
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unused-expressions.md
         */
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-expressions': 'error',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unused-vars.md
         */
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            ignoreRestSiblings: true,
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-use-before-define.md
         */
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-useless-constructor.md
         */
        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': 'error',
        /**
         * https://eslint.org/docs/rules/quotes
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/quotes.md
         */
        quotes: 'off',
        '@typescript-eslint/quotes': [
          'error',
          'single',
          {
            avoidEscape: true,
            allowTemplateLiterals: true,
          },
        ],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/require-await.md
         */
        '@typescript-eslint/require-await': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/return-await.md
         */
        '@typescript-eslint/return-await': 'off',
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/semi.md
         */
        semi: 'off',
        '@typescript-eslint/semi': ['error', 'never'],
        /**
         * https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/space-before-function-paren.md
         */
        'space-before-function-paren': 'off',
        '@typescript-eslint/space-before-function-paren': [
          'error',
          {
            anonymous: 'never',
            named: 'never',
            asyncArrow: 'always',
          },
        ],
      },
    },
  ],
}

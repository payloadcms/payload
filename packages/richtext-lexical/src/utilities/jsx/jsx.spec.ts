import { extractPropsFromJSXPropsString } from './extractPropsFromJSXPropsString.js'
import { propsToJSXString } from './jsx.js'

describe('jsx', () => {
  describe('prop string to object', () => {
    const INPUT_AND_OUTPUT: {
      input: string
      inputFromOutput?: string
      output: Record<string, any>
    }[] = [
      {
        input: 'key="value"',
        output: {
          key: 'value',
        },
      },
      {
        input: "key='value'",
        output: {
          key: 'value',
        },
        inputFromOutput: 'key="value"',
      },
      {
        input: 'key={[1, 2, 3]}',
        output: {
          key: [1, 2, 3],
        },
      },
      {
        input: 'key={[1, 2, 3, [1, 2]]}',
        output: {
          key: [1, 2, 3, [1, 2]],
        },
      },
      {
        input: 'object={4}',
        output: {
          object: 4,
        },
      },
      {
        input: 'object={{"test": 1}}',
        output: {
          object: { test: 1 },
        },
      },
      {
        input: 'object={[1, 2, 3, [1, 2]]}',
        output: {
          object: [1, 2, 3, [1, 2]],
        },
      },
      {
        input: 'object={[1, 2]}',
        output: {
          object: [1, 2],
        },
      },
      {
        input: 'key="value" object={{key: "value"}}',
        inputFromOutput: 'key="value" object={{"key": "value"}}',
        output: {
          key: 'value',
          object: { key: 'value' },
        },
      },
      {
        input: 'global packageId="myId" uniqueId="some unique id!" update',
        output: {
          global: true,
          packageId: 'myId',
          uniqueId: 'some unique id!',
          update: true,
        },
      },
      {
        input:
          'global key="value" object={{key: "value", something: "test", hello: 1}} packageId="myId" uniqueId="some unique id!" update',
        inputFromOutput:
          'global key="value" object={{"hello": 1, "key": "value", "something": "test"}} packageId="myId" uniqueId="some unique id!" update',
        output: {
          global: true,
          key: 'value',
          object: { hello: 1, key: 'value', something: 'test' },
          packageId: 'myId',
          uniqueId: 'some unique id!',
          update: true,
        },
      },
      {
        input:
          'object={{hello: 1, key: "value", nested: { key: "value" }, something: "test", test: [1, 2, 3]}}',
        inputFromOutput:
          'object={{"hello": 1, "key": "value", "nested": {"key": "value"}, "something": "test", "test": [1, 2, 3]}}',
        output: {
          object: {
            hello: 1,
            key: 'value',
            nested: { key: 'value' },
            something: 'test',
            test: [1, 2, 3],
          },
        },
      },
      {
        input:
          'global key="value" object={{hello: 1, key: "value", nested: { key: "value" }, something: "test", test: [1, 2, 3]}} packageId="myId" uniqueId="some unique id!" update',
        inputFromOutput:
          'global key="value" object={{"hello": 1, "key": "value", "nested": { "key": "value" }, "something": "test", "test": [1, 2, 3]}} packageId="myId" uniqueId="some unique id!" update',
        output: {
          global: true,
          key: 'value',
          object: {
            hello: 1,
            key: 'value',
            nested: { key: 'value' },
            something: 'test',
            test: [1, 2, 3],
          },
          packageId: 'myId',
          uniqueId: 'some unique id!',
          update: true,
        },
      },
      {
        // Test if unquoted property keys in objects within arrays are supprted. This is
        // supported through the more lenient JSOX parser, instead of using JSON.parse()
        input: 'key={[1, 2, { hello: "there" }]}',
        inputFromOutput: 'key={[1, 2, { "hello": "there" }]}',
        output: {
          key: [1, 2, { hello: 'there' }],
        },
      },
      {
        // Test if ` strings work
        input: `key={[1, 2, { hello: \`there\` }]}`,
        inputFromOutput: 'key={[1, 2, { "hello": "there" }]}',
        output: {
          key: [1, 2, { hello: 'there' }],
        },
      },
      {
        // Test if multiline ` strings work
        input: `key={[1, 2, { hello: \`Hello
there\` }]}`,
        inputFromOutput: 'key={[1, 2, { "hello": "Hello\\nthere" }]}',
        output: {
          key: [1, 2, { hello: 'Hello\nthere' }],
        },
      },
    ]

    for (const { input, output } of INPUT_AND_OUTPUT) {
      it(`can correctly convert to object: "${input.replace(/\n/g, '\\n')}"`, () => {
        const propsObject = extractPropsFromJSXPropsString({ propsString: input })
        console.log({ output, propsObject })

        expect(propsObject).toStrictEqual(output)
      })
    }

    for (const { input: originalInput, inputFromOutput, output } of INPUT_AND_OUTPUT) {
      const input = inputFromOutput || originalInput
      it(`can correctly convert from object: "${input.replace(/\n/g, '\\n')}"`, () => {
        const propsString = propsToJSXString({ props: output })
        console.log({ input, propsString })

        expect(propsString.replaceAll(' ', '')).toBe(input.replaceAll(' ', ''))
      })
    }
  })
})

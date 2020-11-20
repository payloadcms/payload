import buildStateFromSchema from './buildStateFromSchema';

describe('Form - buildStateFromSchema', () => {
  it('populates default value - normal fields', async () => {
    const defaultValue = 'Default';
    const fieldSchema = [
      {
        name: 'text',
        type: 'text',
        label: 'Text',
        defaultValue,
      },
    ];
    const state = await buildStateFromSchema(fieldSchema, {});
    expect(state.text.value).toBe(defaultValue);
  });
});

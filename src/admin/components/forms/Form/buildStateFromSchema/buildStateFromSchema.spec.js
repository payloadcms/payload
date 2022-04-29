import buildStateFromSchema from './index';

describe('Form - buildStateFromSchema', () => {
  const defaultValue = 'Default';
  it('populates default value - normal fields', async () => {
    const fieldSchema = [
      {
        name: 'text',
        type: 'text',
        label: 'Text',
        defaultValue,
      },
    ];
    const state = await buildStateFromSchema({ fieldSchema });
    expect(state.text.value).toBe(defaultValue);
  });
  it('field value overrides defaultValue - normal fields', async () => {
    const value = 'value';
    const data = { text: value };
    const fieldSchema = [
      {
        name: 'text',
        type: 'text',
        label: 'Text',
        defaultValue,
      },
    ];
    const state = await buildStateFromSchema({ fieldSchema, data });
    expect(state.text.value).toBe(value);
  });
  it('populates default value from a function - normal fields', async () => {
    const user = { email: 'user@example.com' };
    const locale = 'en';
    const fieldSchema = [
      {
        name: 'text',
        type: 'text',
        label: 'Text',
        defaultValue: (args) => {
          if (!args.locale) {
            return 'missing locale';
          }
          if (!args.user) {
            return 'missing user';
          }
          return 'Default';
        },
      },
    ];
    const state = await buildStateFromSchema({ fieldSchema, user, locale });
    expect(state.text.value).toBe(defaultValue);
  });
});

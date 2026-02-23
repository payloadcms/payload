import type { EvalCase } from '../../types.js'

export const pluginsQADataset: EvalCase[] = [
  {
    input: 'What is the TypeScript signature of a Payload plugin?',
    expected:
      'a function that receives an incoming Config and returns a modified Config: (incomingConfig: Config) => Config, typically wrapped in another function to accept plugin options',
    category: 'plugins',
  },
  {
    input:
      'Why must you use spread syntax when modifying arrays like collections or globals inside a plugin?',
    expected:
      "to preserve the existing items from the incoming config; without spreading, any previously defined collections or globals would be lost and replaced with only the plugin's additions",
    category: 'plugins',
  },
  {
    input: 'How do you safely extend the onInit function inside a Payload plugin?',
    expected:
      "assign a new async function to config.onInit that first checks if incomingConfig.onInit exists and awaits it, then runs the plugin's own init logic — this ensures existing onInit behavior is not lost",
    category: 'plugins',
  },
  {
    input: 'What is the correct way to add a new field to every collection inside a plugin?',
    expected:
      'map over config.collections and return each collection spread with its fields array spread plus the new field appended; always spread both the collection and the fields array to avoid losing existing data',
    category: 'plugins',
  },
  {
    input:
      'How do you provide an enable/disable option in a Payload plugin and why is it a best practice?',
    expected:
      'accept an enabled boolean in the plugin options and return the config unmodified when it is false; this lets users disable the plugin without uninstalling it, useful for feature flags or local development',
    category: 'plugins',
  },
  {
    input: 'What types should you import from "payload" when writing a plugin?',
    expected:
      'Config and Plugin — Config is the full Payload config type and Plugin is the canonical type alias for a function that receives and returns a Config',
    category: 'plugins',
  },
  {
    input: 'What order does Payload use during initialization that affects when plugins execute?',
    expected:
      'final config is initialized, then sanitization runs, then default options are integrated, then plugins execute, then the incoming config is validated — plugins run after defaults are merged',
    category: 'plugins',
  },
]

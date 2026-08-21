This PR reworks Payload’s CLI to be easier to extend, type-safe, and optimized for agent use.

It introduces `defineCLICommand` as one API for Payload's built-in and custom commands. Projects customize the CLI through the new `config.cli.commands` map, which can add, replace, or disable commands. Each command defines its accepted input, help text, and handler together, giving handlers typed input and removing the need to write separate validation and parsing code.

For agents, `payload help --json` describes every available command and its input schema. Commands also accept structured JSON through `--input <json|@file|->`, so an agent can inspect a command and call it without guessing its command-line syntax.

Payload uses [Commander](https://npmx.dev/package/commander) underneath, replacing the old command `if` chain and the `minimist` dependency.

## File structure changes

Previously, command routing, command implementations, and shared helpers were mixed together under `src/bin`. Some commands were handled in `index.ts`, every migration command shared `migrate.ts`, and related files such as the build and import-map helpers lived in different places.

### Before

```text
src/bin/
├── index.ts                    # Parsing, routing, and running commands
├── migrate.ts                  # Routing for every migrate:* command
├── build.ts                    # Build implementation
├── build.spec.ts
├── frameworkConventions.ts     # Used by build and generate:importmap
├── generateTypes.ts            # generate:types implementation
├── info.ts
└── generateImportMap/          # generate:importmap implementation
```

The new structure gives every command one obvious home. A simple command is one file, while a command with its own implementation, tests, or helpers gets one folder.

The built-in commands as consumers of the same public API, and the command runner / CLI scaffolding, are now _**completely separate**_.

### After

```text
src/cli/
├── index.ts                    # Generic command loader and runner
├── defineCLICommand.ts         # Shared command definition and validation
└── commands/
    ├── build/
    │   ├── index.ts            # payload build
    │   ├── build.ts
    │   └── build.spec.ts
    ├── generateImportMap/
    │   ├── index.ts            # payload generate:importmap
    │   ├── generateImportMap.ts
    │   ├── frameworkConventions.ts
    │   ├── iterate*.ts
    │   └── utilities/
    ├── generateTypes.ts        # payload generate:types
    ├── info.ts                 # payload info
    ├── jobs/
    │   └── one file per command
    └── migrate/
        ├── run.ts              # payload migrate
        ├── create.ts           # payload migrate:create
        ├── down.ts             # payload migrate:down
        └── one file per remaining migrate:* command
```

## Extensibility and examples

### Before

Previously, a custom command was split between a `config.bin` entry and a script with a specially named export:

```ts
// payload.config.ts
export default buildConfig({
  bin: [
    {
      key: 'seed',
      scriptPath: path.resolve(dirname, 'seed.ts'),
    },
  ],
})

// seed.ts
export const script = async (config: SanitizedConfig) => {
  await payload.init({ config })
  // Seed the database...
  process.exit(0)
}
```

The path kept the script and its dependencies out of the Payload config bundle, but the command itself had no real contract. The `key` named the command, `scriptPath` selected the file, and that file had to export a function named `script`. Input parsing and Payload initialization also had to live inside that function. Custom commands had no generated help, runtime input validation, or typed arguments.

### After

The new API still lets projects keep command code out of the Payload config bundle. It also gives custom commands the same validation and help as Payload's built-in commands. Projects can add, replace, or disable commands through one map.

`config.cli.commands` maps each command name to a command created with `defineCLICommand`, an import path, or `false` to disable it. Import paths use the existing `PayloadComponent` format:

```ts
type CLICommandEntry = CLICommand | PayloadComponent
type CLICommands = Record<string, CLICommandEntry>
```

The entire Payload CLI can be disabled at the top level:

```ts
export default buildConfig({
  cli: false,
})
```

The map key is the command name. The description, input, command-line options, aliases, and handler stay together:

```ts
// seed.ts
import { defineCLICommand, z } from 'payload/cli'

export const seedCommand = defineCLICommand({
  description: 'Seed the database.',
  input: z.strictObject({
    clear: z.boolean().default(false).describe('Delete existing documents first.'),
  }),
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()

    // Seed the database using args.clear...
  },
})

// payload.config.ts
export default buildConfig({
  cli: {
    commands: {
      seed: './seed.js#seedCommand',
    },
  },
})
```

Import paths work like other `PayloadComponent` values. A path without `#` loads the default export, `#seedCommand` selects a named export, and the object form sets `path` and `exportName` separately. Commands can use either default or named exports.

```ts
import { inspectCommand } from './cli/inspect.js'

export default buildConfig({
  cli: {
    commands: {
      // Add commands using default and named exports.
      seed: './cli/seed.js',
      cleanup: './cli/cleanup.js#cleanupCommand',

      // The object form uses the same PayloadComponent convention.
      importData: {
        path: './cli/data.js',
        exportName: 'importDataCommand',
      },

      // Direct command definitions are also accepted.
      inspect: inspectCommand,

      // Replace a built-in command.
      'generate:types': './cli/generateTypes.js#generateTypesCommand',

      // Disable a built-in command.
      info: false,
    },
  },
})
```

Import paths are recommended because they keep the command and its dependencies out of the `payload.config.ts` bundle. A `CLICommand` can also be passed directly, which is useful for small commands, but its imports will then be included with the config.

Payload adds its built-in command paths when it loads the config, then applies custom commands on top:

```ts
const defaultCLICommands = {
  build: 'payload/cli/builtin#createBuildCommand',
  info: 'payload/cli/builtin#createInfoCommand',
  // ...
}

config.cli.commands = {
  ...defaultCLICommands,
  ...config.cli?.commands,
}
```

After the config is loaded, `config.cli.commands` contains every built-in and custom command.

A new key adds a command. Using the name of a built-in command replaces it, including its handler, input schema, help, and aliases. Setting it to `false` removes the command and its aliases.

## CLI startup performance

Because commands can be import paths, the CLI loads them after loading the config. To find the fastest approach, I measured 16 built-in commands and 20 separate custom command files:

| Variant                 | Median startup | Difference |
| ----------------------- | -------------: | ---------: |
| Direct imports          |     1,690.9 ms |          — |
| Sequential import paths |     1,823.1 ms |  +132.2 ms |
| Parallel import paths   |     1,687.0 ms |    -3.9 ms |

Loading the paths one at a time was about 7.8% slower. Loading them in parallel was about as fast as direct imports, so the CLI loads command files in parallel and imports shared files only once. Because all built-in commands come from `payload/cli/builtin`, one import loads the complete built-in set.

=> No performance degradation by using import paths here.

## Bundle size

This PR adds Commander and Zod as dependencies of the `payload` package. Commander handles command routing and shell input, while Zod provides typed validation for command input.

For Zod, we had a choice between the regular package and `zod/mini`. Regular Zod has a more convenient API, while `zod/mini` produces a smaller bundle. The CLI is not normally included in application bundles, but the follow-up [data CLI PR](https://github.com/payloadcms/payload/pull/17605) shares command schemas with the MCP plugin, where Zod is used at runtime. To compare them, we used esbuild to bundle Payload with the CLI and all built-in commands.

| Version                  |     Raw |    Gzip |
| ------------------------ | ------: | ------: |
| Latest `main`            | 4.88 MB | 1.37 MB |
| This PR with regular Zod | 5.24 MB | 1.45 MB |
| This PR with `zod/mini`  | 4.96 MB | 1.39 MB |

If the CLI were bundled, this PR would add 77.6 kB raw and 22.5 kB gzip with `zod/mini`. Zod accounts for 33.3 kB of the raw increase, while the other CLI changes account for 44.3 kB.

With regular Zod, the increase would be 358.1 kB raw and 74.9 kB gzip. Using `zod/mini` therefore saves 280.5 kB raw and 52.4 kB gzip, which is why the built-in commands use `zod/mini` instead.

## Breaking changes

The new `config.cli.commands` map replaces `config.bin`. Each key is a command name, and each value is an import path, a direct command definition, or `false`. Imported modules export commands created with `defineCLICommand` instead of a specially named `script` function.

Projects using `config.bin` need to convert each script and register its command export through `config.cli.commands`. A command can use the provided `getPayload()` helper when it needs Payload and return an exit code instead of calling `process.exit()`.

The old `migrateCLI` export is also removed. Code can call the database adapter to run migrations directly, or use the existing `payload.bin()` method to run the real CLI. This removes the migration-only CLI wrapper, its duplicate command list, and its special `migrationDir` option.

## Future plans

The follow-up [data CLI PR](https://github.com/payloadcms/payload/pull/17605) adds commands for working with Payload data locally. In the future, remote support could be added to the same commands without changing how they work today:

```sh
# Local
payload createDocuments --input @create-posts.json

# Remote
payload createDocuments \
  --url https://cms.example.com \
  --input @create-posts.json
```

Without `--url`, commands would continue using the local config and handlers. A future remote mode could reuse the same command names and input schemas while sending requests to a server instead.

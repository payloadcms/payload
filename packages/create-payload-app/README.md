# Create Payload App

CLI for easily starting new Payload project

## Usage

```text

  USAGE

      Inside of an existing Next.js project

      $ npx create-payload-app

      Create a new project from scratch

      $ npx create-payload-app
      $ npx create-payload-app my-project
      $ npx create-payload-app -n my-project -t template-name

  OPTIONS

      -n     my-payload-app         Set project name
      -t     template_name          Choose specific template
      -e     example_name           Choose specific example

        Available templates:

        blank                       Blank 3.0 Template
        website                     Website Template
        plugin                      Template for creating a Payload plugin

      --use-npm                     Use npm to install dependencies
      --use-yarn                    Use yarn to install dependencies
      --use-pnpm                    Use pnpm to install dependencies
      --use-bun                     Use bun to install dependencies (experimental)
      --no-deps                     Do not install any dependencies
      -h                            Show help
```

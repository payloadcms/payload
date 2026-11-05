# Create Payload App

CLI for easily starting new Payload project

When run without a project name inside a compatible existing Next.js, TanStack Start, or
conventional TanStack Router project, the CLI initializes Payload in the current project.
Router-only projects are converted to TanStack Start after confirmation.

## Usage

```text

  USAGE

      $ npx create-payload-app
      $ npx create-payload-app my-project
      $ npx create-payload-app -n my-project -t website

  OPTIONS

      -n     my-payload-app         Set project name
      -t     template_name          Choose specific template

        Available templates:

        blank                       Blank Template
        blank-tanstack              Blank TanStack Start Template
        website                     Website Template
        ecommerce                   E-commerce Template
        plugin                      Template for creating a Payload plugin
        payload-demo                Payload demo site at https://demo.payloadcms.com
        payload-website             Payload website CMS at https://payloadcms.com

      --use-npm                     Use npm to install dependencies
      --use-yarn                    Use yarn to install dependencies
      --use-pnpm                    Use pnpm to install dependencies
      --no-deps                     Do not install any dependencies
      -h                            Show help
```

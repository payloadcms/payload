# Payload Custom Components Example

This example demonstrates how to use Custom Components in the [Payload](https://github.com/payloadcms/payload) Admin Panel. Custom components allow you to extend Payload by providing custom UI elements for fields, collections, and views. This example covers custom components for every field type available in Payload, including both server and client components.

## Quick Start

To spin up this example locally, follow the steps below:

1. Run the following command to create a project from the example:

- `npx create-payload-app --example custom-components`

2. Start the server:
   - Depending on your package manager, run `pnpm dev`, `yarn dev` or `npm run dev`
   - When prompted, type `y` then `enter` to seed the database with sample data
3. Access the application:
   - Open your browser and navigate to `http://localhost:3000` to access the homepage.
   - Open `http://localhost:3000/admin` to access the admin panel.
4. Login:

- Use the following credentials to log into the admin panel:
  > `Email: demo@payloadcms.com` > `Password: demo`

## How it works

### Collections

[Collections](https://payloadcms.com/docs/configuration/collections) in Payload allow you to define structured content types. This example includes multiple collections, with a focus on:

- #### Users

  The `users` collection is **auth-enabled**, providing access to the admin panel and enabling user authentication. This collection shows how to implement a basic user collection with authentication.

  - For more details on setting up authentication, checkout the [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth) and the [Authentication Overview](https://payloadcms.com/docs/authentication/overview#authentication-overview).

- #### Fields

  The `fields` collection demonstrates all the **field types** available in Payload, each one configured with custom components. This includes every available "slot" for custom components (e.g., `admin.components.Field`, `admin.components.Label`, `admin.components.Input`, etc.). For each field type, two examples are provided: one using **server-side components** and the other using **client-side components**. This pattern illustrates how to customize both types of components across different field types.

  - **Custom Field Components**: Custom components allow you to tailor the UI and behavior of the admin panel fields. This can be useful for implementing complex interactions, custom validation, or UI enhancements. For example, you might use a custom component to replace a simple text input with a date picker or a rich text editor.

- #### Views

  The `views` collection demonstrates how to create **collection-level views**, such as custom tabs or layout configurations. This is where you can modify how data is displayed in the admin panel beyond the default list and edit views. Custom views give you full control over how content is presented to users.

- #### Root Views

  The `root-views` collection shows how to implement **root-level views** in the admin panel. These views can be used to modify the global admin interface, adding custom sections or settings that appear outside of collections.

## Troubleshooting

If you encounter any issues during setup or while running the example, here are a few things to try:

- **Missing dependencies**: If you see errors related to missing packages, try deleting the `node_modules` folder and the lockfile (`package-lock.json` or `pnpm-lock.yaml`), then rerun `npm install` or `pnpm i`.

- **Port conflicts**: If the development server isn't starting, ensure that port `3000` isn't being used by another process. You can change the port by modifying the `package.json` file or setting the `PORT` environment variable.

- **Seed data issues**: If the database seeding fails, try clearing the database and then rerun the seeding process.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).

For more detailed documentation on how to extend and customize Payload, check out the full [Payload documentation](https://payloadcms.com/docs).

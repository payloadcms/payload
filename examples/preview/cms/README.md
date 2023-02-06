# Preview Example for Payload CMS

This is an example repo that showcases how to implement the `preview` feature into Payload CMS.

There is a fully working Next.js app tailored specifically for this example which can be found [here](../nextjs). Follow the instructions there to get started. If you are setting up `preview` for another front-end, please consider contributing to this repo with your own example!

## Getting Started

1. Clone this repo
2. `cd` into the directory and run `yarn` or `npm install`
3. Copy (`cp`) the `.env.example` file to an `.env` file
4. Run `yarn dev` or `npm run dev` to start the development server
5. Visit `http://localhost:8000/admin` to access the admin panel
6. Login with the following credentials:
   - Email: `dev@payloadcms.com`
   - Password: `test`

## How it works

On boot, a seed script is included to create a `user`, a `Home` page, and a `Draft` page for you to test with:

- The `Home` page has been set to `published` on start up, however the `Draft` page is only set to draft (not published yet). You can edit these pages - save them - and then preview them to view your saved changes without having these changes published and accessible to the public.
- Upon previewing, you will notice an `admin bar` above the header of the site. This admin bar gives you freedom to exit preview mode, which will then return the page to it's most recent published version.
- Note: the admin bar will only ever be seen by users logged into the cms. The admin bar stays hidden to public viewers.

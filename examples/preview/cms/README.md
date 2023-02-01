# Preview Example with Payload CMS

This is an example repo that showcases how to implement the `preview` feature into your Payload CMS.

## Getting Started

1. Clone this repo
2. `cd` into the directory and run `yarn` or `npm install`
3. Copy (`cp`) the `.env.example` file to an `.env` file
4. Run `yarn dev` or `npm run dev` to start the development server
5. Visit `http://localhost:8000/admin` to access the admin panel
6. Login with the following credentials:
   - Email: `dev@payloadcms.com`
   - Password: `test`

## Frontend Development

To get the front-end side started up - open the `nextjs` folder that is along side the `cms` folder in the `preview` folder. Follow the instructions there to get started. You can use this repo as a backend for the frontend and see for yourself how it all works together.

## Usage

Once booted up, you will have a `Home` page and a `Draft` page immediately available to you.

- On initial start up, a `Home` page and a `Draft` page with some content will be seeded into the `pages` collection.
- The `Home` page has been set to `published` on start up, however the `Draft` page is only set to draft (not published yet). You can edit these pages - save them - and then preview them to view your saved changes without having these changes published and accessible to the public.
- Upon previewing, you will notice an `admin bar` above the header of the site. This admin bar gives you freedom to exit preview mode, which will then return the page to it's most recent published version.
- Note: the admin bar will only ever be seen by users logged into the cms. The admin bar stays hidden to public viewers.

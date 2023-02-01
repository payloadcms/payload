# Redirects Example with Payload CMS

This is an example repo that showcases how to implement redirects into your Payload CMS.

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

To get the front-end side started up - open the `nextjs` folder that is along side the `cms` folder in the `redirects` folder. Follow the instructions there to get started. You can use this repo as a backend for the frontend and see for yourself how it all works together.

## Usage

Once booted up, some instructions on how to view redirects working in action will be immediately available to you on the home page along with some basic content on corresponding pages.

- On initial start up, a `home` page and a `redirect` page with some content will be seeded into the `pages` collection.
- A redirect has also been seeded into the `redirects` collection as an example redirect. Accessing the url `/payload` will redirect you to the `Redirect Page`.
- The redirects plugin is very easy to use. Once added, all you need to do is input a `From URL` and a `To URL`!

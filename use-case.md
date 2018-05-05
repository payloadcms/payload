# Payload User Flow

This document will attempt to describe an ideal typical user flow for Payload so that we can evaluate its plausibility and potentially use it as a development roadmap.

## Initialization

To begin using Payload, the user will need to run an init command to scaffold out anything required by Payload to function.  

Example:
```
payload init
```

This command should build out whatever is necessary for Payload to function, but specifically, it should place a configuration file of some type so that Payload can read from it while being used at the command line.  The configuration file, let's say, `payload.config.js`, will contain a default set of options for Payload but it can be customized by the user.

```js
// payload.config.js

export default {
	port: 1337,
	adminURL: '/payload-login',
	modelsDir: './models',
	apiDir: './api',
	adminDir: './admin'
	foo: 'bar'
}
```

That configuration file will hang out and will be read every time the user's Express server is initialized automatically by Payload, in case some options contained within need to be read by Payload.

## Creating a model

I think it might be best to have models defined somewhere that can be checked into a repo before the user attempts to scaffold all the required files for their model from the command line.  Let's say a user wants to create a `Pages` model.  They could save a `Pages` scaffolding file somewhere, like:

```
./scaffold/Pages.js
```

That file would contain all the required configuration for an admin UI to be generated and routes to be automatically opened up, written in a Payload-specific format.

```js
// Example ./scaffold/Pages.js

export default {
	options: {
		slug: 'Page',
		label: 'Pages',
		singular: 'Page',
		plural: 'Pages',

		// Make unique identifier instead of using an integer ID or random string - borrowed from Keystone
		autokey: { 
			from: 'slug',
			unique: true
		}
	},

	fields: {
		metaInfo: {
			type: group,
			fields: {
				title: { 
					type: 'string',
					maxLength: 100
				},
				description: { type: 'textarea', 
					wysiwyg: false, 
					height: 100
				},
				keywords: { type: text }
			}
		},
		content: {
			type: group,
			fields: {
				exampleField1: { 
					type: 'textarea',
					wysiwyg: true,
					height: 400
				},
				flexibleContentExample: { 
					type: 'flex',
					availableLayouts: [
						'layout1',
						'layout5'
					]
				}
			}
		}
	}
}
```

As you can see, the configuration above is fairly complex and should be written with care.  That means I think building out or maintaining models with a CLI might be too much to ask.  Maybe a future enhancement.

For now, we could just build a command into our CLI that would read the exports from the `Pages` model above, and output exactly the files that we need to both open up REST API routes, and display an admin UI for CRUD.

### Scaffolding required files based on input model

With the `./scaffold/Pages.js` file now in place and configured, we can read that file from the command line and build out all the required files that will be necessary:

```
payload make:model --input './scaffold/Pages.js'
```

That command will read from the Payload config file to determine where and how to build out the necessary files.  In this case, it'll build out anything required for the `api` into the `./api`folder as specified.  Same thing for models, same thing for admin views.

From the above `Pages` model input, and from the folder structure defined in `payload.config.js`, we would end up with a folder structure like this:

```
/
	/admin
		/pages
			/client
				archive.js
				index.js
				pages.css
				pages.scss
			/routes
				index.js
		index.js -> see below Admin section
	/api
		/pages
			index.js
		index.js
	/models
		/pages
			index.js
		index.js
```

#### Admin-scaffolded files

The entirety of whatever is needed to build admin interfaces for these models will be written out and placed into a user's folder based on templates stored and saved within the Payload module, but customized to the user's input.  So there would be the default set of admin React components as well as a default set of styles.  These would be used by Payload to automatically provide the user with an editable admin interface, and would also be 100% open to and customizable by the user.  Need to add a few functions to the admin-facing UI?  Crack open the super simple React components and do it.

In addition to client-side files, there would also be routes generated within the `/admin` directory that would handle the CRUD operations and would be also exposed to the user.

To make loading all admin routes super easy to the end user, we would include one `/admin/routes.js` file that's auto-generated and just points to all the generated admin routes.  A note, this would function exactly the same for Models and API routes.

```js
// /admin/index.js

require(./pages)
require(./futureGeneratedModelA)
require(./futureGeneratedModelB)
require(./futureGeneratedModelC)
```

#### Model scaffolded files

These files would be built out to wire up all necessary Mongoose schemas and methods on models - again, customized by the user easily and imported to be included in the Express app.

#### API

Same idea as above, but for the REST API.  

## Tying into an Express App

**To discuss:**  how to scaffold out all the required parts of the user's application entry point.  Below, you'll see that the user's entry point will require a bit of customization to include Payload.  Maybe we could include a function within `payload init` that builds out an example `index.js` file - in case the user might not have an existing app?  Then we could instruct the user to rename `index.js.example` to `index.js` and go from there...

For now, let's assume that the user has an `index.js` file that functions as an entry point for their application.

That file will already pull in copies of the user's own Express and Mongoose instances, and we'll also use it to define all configurations in place for Payload as well as the rest of their app.

**Example user index.js:**
```js
const express = require('express'),
	  mongoose = require('mongoose'),
	  PayloadCMS = require('payload'),

	  // Pull in the generated / customized config file to make loading dynamic routes and models easy - see below
	  payloadOptions: require('./payload.config'),
	  app = express()

// Before initializing Payload, we should connect to Mongoose on our own
// The reason would be so that we impose as little as possible on the user
mongoose.connect('mongodb://localhost/payload')

// If needed, Payload might require passing it the user's instances of Express and Mongoose.  Not sure about this one, because we are going to be dynamically building out routes and etc further down the page.
const dependencies = {
	express: app,
	mongoose: mongoose
}

// Fire up Payload - initialize auth, email, etc
const Payload = new PayloadCMS(dependencies)

// This line should pull in any models that are in the user-specified Payload Models directory
require(payloadOptions.modelsDir)

// This line should pull in all admin routes that are in the user-specified Payload Admin directory
require(payloadOptions.adminDir)

// This line should pull in any routes that are in the user-specified Payload directory
require(payloadOptions.apiDir)

// Allow the user to fire up their own Express server
app.listen(payloadOptions.port, (error) => {
	console.log('Listening on 1337')
})
```

### Firing it up

Now, because we've output all the files necessary for the `Pages` model, the user should be able to theoretically fire up their server and run requests to consume data, as well as log in to the Payload instance and start saving / editing `Pages`.
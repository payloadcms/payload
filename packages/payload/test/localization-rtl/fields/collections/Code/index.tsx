import type { CollectionConfig } from "../../../../../src/collections/config/types";
import { CodeField } from "../../../../fields/payload-types";

const Code: CollectionConfig = {
  slug: "code-fields",
  fields: [
    {
      name: "javascript",
      type: "code",
      admin: {
        language: "javascript",
      },
    },
    {
      name: "typescript",
      type: "code",
      admin: {
        language: "typescript",
      },
    },
    {
      name: "json",
      type: "code",
      admin: {
        language: "json",
      },
    },
    {
      name: "html",
      type: "code",
      admin: {
        language: "html",
      },
    },
    {
      name: "css",
      type: "code",
      admin: {
        language: "css",
      },
    },
  ],
};

export const codeDoc: Partial<CodeField> = {
  javascript: "console.log('Hello');",
  typescript: `class Greeter {
  greeting: string;

  constructor(message: string) {
    this.greeting = message;
  }

  greet() {
    return "Hello, " + this.greeting;
  }
}

let greeter = new Greeter("world");`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>

<script>
  // Just a lil’ script to show off that inline JS gets highlighted
  window.console && console.log('foo');
</script>
<meta charset="utf-8" />
<link rel="icon" href="assets/favicon.png" />
<title>Prism</title>
<link rel="stylesheet" href="assets/style.css" />
<link rel="stylesheet" href="themes/prism.css" data-noprefix />
<script src="assets/vendor/prefixfree.min.js"></script>

<script>var _gaq = [['_setAccount', 'UA-11111111-1'], ['_trackPageview']];</script>
<script src="https://www.google-analytics.com/ga.js" async></script>
</head>
<body>`,

  css: `@import url(https://fonts.googleapis.com/css?family=Questrial);
@import url(https://fonts.googleapis.com/css?family=Arvo);

@font-face {
  src: url(https://lea.verou.me/logo.otf);
  font-family: 'LeaVerou';
}

/*
 Shared styles
 */

section h1,
#features li strong,
header h2,
footer p {
  font: 100% Rockwell, Arvo, serif;
}

/*
 Styles
 */

* {
  margin: 0;
  padding: 0;
}

body {
  font: 100%/1.5 Questrial, sans-serif;
  tab-size: 4;
  hyphens: auto;
}

a {
  color: inherit;
}

section h1 {
  font-size: 250%;
}`,

  json: JSON.stringify(
    { property: "value", arr: ["val1", "val2", "val3"] },
    null,
    2
  ),
};

export default Code;

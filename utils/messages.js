const chalk = require('chalk');
const figures = require('figures');
const terminalLink = require('terminal-link');
const { getProjectDir } = require('./getProjectDir');
const { getPackageManager } = require('./getPackageManager');

const header = (message) => chalk.yellow(figures.star) + ' ' + chalk.bold(message);

const welcomeMessage = chalk`
  {green Welcome to Payload. Let's create a project! }
`;

const helpMessage = chalk`
  {bold USAGE}

      {dim $} {bold yarn create payload-app} --name {underline my-payload-app}
      {dim $} {bold npx create-payload-app} --name {underline my-payload-app}

  {bold OPTIONS}

      --template {underline template_name}           Choose specific template

        {dim Available templates: javascript, typescript}

      --use-npm                          Use npm to install dependencies
      --help                             Show help
`;

const successMessage = async () => `
  ${header('Launch Application:')}

    - cd ${await getProjectDir()}
    - ${await getPackageManager() === 'yarn' ? 'yarn' : 'npm run'} dev

  ${header('Documentation:')}

    - ${terminalLink('Getting Started', 'https://payloadcms.com/docs/getting-started/what-is-payload')}
    - ${terminalLink('Configuration', 'https://payloadcms.com/docs/configuration/overview')}

`;

module.exports = {
  welcomeMessage,
  helpMessage,
  successMessage,
}
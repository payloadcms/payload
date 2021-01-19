const chalk = require('chalk');
const figures = require('figures');
const terminalLink = require('terminal-link');
const { getProjectDir } = require('./getProjectDir');
const { getPackageManager } = require('./getPackageManager');
const { getValidTemplates } = require('./getValidTemplates');

const header = (message) => chalk.yellow(figures.star) + ' ' + chalk.bold(message);

const welcomeMessage = chalk`
  {green Welcome to Payload. Let's create a project! }
`;

const helpMessage = async () => {
  const validTemplates = await getValidTemplates();
  return chalk`
  {bold USAGE}

      {dim $} {bold npx create-payload-app}

  {bold OPTIONS}

      --name {underline my-payload-app}              Set project name
      --template {underline template_name}           Choose specific template

        {dim Available templates: ${validTemplates.join(', ')}}

      --use-npm                          Use npm to install dependencies
      --no-deps                          Do not install any dependencies
      --help                             Show help
`;
};

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
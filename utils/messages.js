const chalk = require('chalk');
const figures = require('figures');
const terminalLink = require('terminal-link');
const { getProjectDir } = require('./getProjectDir');

const header = (message) => chalk.yellow(figures.star) + ' ' + chalk.bold(message);

const helpMessage = chalk`
  {bold USAGE}

      {dim $} {bold yarn create payload-app} --name {underline my-payload-app}
      {dim $} {bold npx create-payload-app} --name {underline my-payload-app}

  {bold OPTIONS}

      --template {underline template-name}           Choose specific template
      --help                             Shows this help message
`;

const successMessage = async () => `
  ${header('Launch Application:')}

    - cd ${await getProjectDir()}
    - yarn dev

  ${header('Documentation:')}

    - ${terminalLink('Getting Started', 'https://payloadcms.com/docs/getting-started/what-is-payload')}
    - ${terminalLink('Configuration', 'https://payloadcms.com/docs/configuration/main')}

`;

module.exports = {
  helpMessage,
  successMessage,
}
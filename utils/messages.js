const chalk = require('chalk');
const terminalLink = require('terminal-link');
const { getProjectDir } = require('./getProjectDir');

const helpMessage = chalk`
  {bold USAGE}

      {dim $} {bold yarn create payload-app} --name {underline my-payload-app}
      {dim $} {bold npx create-payload-app} --name {underline my-payload-app}

  {bold OPTIONS}

      --template {underline template-name}           Choose specific template
      --help                             Shows this help message
`;

const successMessage = async () => `
  ${chalk.bold(`To launch your application:`)}

    - cd ${await getProjectDir()}
    - yarn dev

  ${chalk.bold(`Documentation:`)}

    - ${terminalLink('Getting Started', 'https://payloadcms.com/docs/getting-started/what-is-payload')}
    - ${terminalLink('Configuration', 'https://payloadcms.com/docs/configuration/main')}

`;

module.exports = {
  helpMessage,
  successMessage,
}
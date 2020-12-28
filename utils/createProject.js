const path = require('path');
const fse = require('fs-extra');
const execa = require('execa');
const ora = require('ora');
const { getArgs } = require('./getArgs');

const { getProjectDir } = require('./getProjectDir');
const { getTemplate } = require('./getTemplate');
const { success, error } = require('./log');

const createProjectDir = (projectDir) => {
  fse.mkdirpSync(projectDir);
  const readDir = fse.readdirSync(projectDir);
  if (readDir && readDir.length > 0) {
    error(`The project directory '${projectDir}' is not empty`);
    process.exit(1);
  }
};

const installDeps = async (dir) => {
  const args = getArgs();
  if (args['--no-deps']) {
    return { failed: false };
  }

  const cmd = args['--use-npm'] ? 'npm install' : 'yarn';
  console.log(`Using cmd: ${cmd}`);

  let result = false;
  try {
    result = execa.command(cmd, {
      cwd: path.resolve(dir),
    });
  } catch (error) {
    result = error;
  }
  return result;
};

const createProject = async () => {
  const projectDir = await getProjectDir();
  createProjectDir(projectDir);
  const templateDir = `./templates/${await getTemplate()}`;

  try {
    await fse.copy(templateDir, projectDir);
  } catch (err) {
    console.error(err);
  }

  const spinner = ora('Installing dependencies').start();
  const result = await installDeps(projectDir);
  spinner.stop();
  spinner.clear();
  if (result.failed) {
    console.error('Error installing dependencies');
  } else {
    success('Dependencies installed');
  }
}

module.exports = { createProject };

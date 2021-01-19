const path = require('path');
const chalk = require('chalk');
const fse = require('fs-extra');
const execa = require('execa');
const ora = require('ora');
const { getArgs } = require('./getArgs');

const { getProjectDir } = require('./getProjectDir');
const { getTemplate } = require('./getTemplate');
const { success, error, warning } = require('./log');
const { getPackageManager } = require('./getPackageManager');

const createProjectDir = (projectDir) => {
  fse.mkdirpSync(projectDir);
  const readDir = fse.readdirSync(projectDir);
  if (readDir && readDir.length > 0) {
    error(`The project directory '${projectDir}' is not empty`);
    process.exit(1);
  }
};

const installDeps = async (dir, packageManager) => {
  const args = getArgs();
  if (args['--no-deps']) {
    return { failed: false };
  }
  let cmd = packageManager === 'yarn' ? 'yarn' : 'npm install';

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

const getLatestPayloadVersion = async () => {
  let result = false;
  try {
    const { stdout } = await execa('npm info payload version', [], { shell: true });
    return stdout;
  } catch (error) {
    result = error;
  }
  return result;
}

const updatePayloadVersion = async (projectDir) => {
  const payloadVersion = await getLatestPayloadVersion();
  if (payloadVersion.failed) {
    warning('Error retrieving latest Payload version. Please update your package.json manually.');
    return;
  }

  const pjson = path.resolve(projectDir, 'package.json');
  try {
    const packageObj = await fse.readJson(pjson);
    packageObj.dependencies.payload = payloadVersion;
    await fse.writeJson(pjson, packageObj, { spaces: 2 });
  } catch (err) {
    warning('Unable to write Payload version to package.json. Please update your package.json manually.');
  }
}

const createProject = async () => {
  const projectDir = await getProjectDir();
  createProjectDir(projectDir);
  const templateDir = path.resolve(__dirname, `../templates/${await getTemplate()}`);

  console.log(`\n  Creating a new Payload app in ${chalk.green(path.resolve(projectDir))}\n`)

  try {
    await fse.copy(templateDir, projectDir);
    success('Project directory created')
  } catch (err) {
    const msg = 'Unable to copy template files. Please check template name or directory permissions.';
    error(msg);
    process.exit(0);
  }

  await updatePayloadVersion(projectDir);

  const packageManager = await getPackageManager();
  const spinner = ora('Installing dependencies. This may take a few minutes.').start();
  const result = await installDeps(projectDir, packageManager);
  spinner.stop();
  spinner.clear();
  if (result.failed) {
    error('Error installing dependencies');
  } else {
    success('Dependencies installed');
  }
}

module.exports = { createProject };

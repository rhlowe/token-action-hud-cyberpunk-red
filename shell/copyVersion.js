const {version} = require('../package.json');
const shell = require('shelljs');
// const next_version = shell.env['npm_package_version'];

shell.echo(`Applying ${version} to module.json in ${shell.pwd()}`);
shell.rm('-f', 'module.json');
shell.cp('-f', 'module_raw.json', `module.json`);
shell.sed('-i', 'VERSION_TO_REPLACE', version, 'module.json');
shell.exec('git add .');
shell.exec('git commit --amend --no-edit');
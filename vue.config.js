/**
 * Main configuration is defined in the shell
 * Use the following command to save in a file the resolved configuration:
 * vue inspect --mode production > output.prod.js
 * https://cli.vuejs.org/guide/webpack.html#inspecting-the-project-s-webpack-config
 */
const config = require('./shell/vue.config');

// Excludes the following plugins if there's no .env file.
let defaultExcludes = 'epinio, rancher-components, harvester';

if (process.env.RANCHER_ENV === 'harvester') {
  defaultExcludes = defaultExcludes.replace(', harvester', '');
}
const excludes = process.env.EXCLUDES_PKG || defaultExcludes;

module.exports = config(__dirname, {
  excludes: excludes.replace(/\s/g, '').split(','),
  // excludes: ['fleet', 'example']
});

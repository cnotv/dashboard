# Migration to Vue3

With Rancher Dashboard 2.10, the internal framework library Vue has been updated from version 2 to 3. This has known architecture changes such like API and syntax. In this guide we are listing down the required changes to **prevent existing extensions from breaking or not load**.

Migration of Rancher extensions can be easily done using the migration script. This will ensure all the updates and highlights manual changes required to be done.

- Run script `./node_modules/.bin/@rancher/dashboard migrate` to migrate files from Vue2 to Vue3
- Update NVM/Node version to 20.0.0 (current pointed version)
- Reinstall the packages to fetch the newer versions with `yarn`
- Run unit test upgrade tool `npx vue-upgrade-tool --files 'shell/**/*.test.ts'`
- Run linter with auto-fix flag `yarn lint --fix`
- Manually review logged issues, the script is not aimed to convert 100% of the code

At this point the plugin should be Vue3 compatible.

Allowed flags for the migration script:

- `--files`, list all the files
- `--log`, create a `stats.json` log file in the root
- `--dry`, run script without modify files, e.g. for log preview
- `--verbose`, print all the changes in console

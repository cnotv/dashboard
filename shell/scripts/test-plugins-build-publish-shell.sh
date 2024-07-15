#!/usr/bin/env bash

set -e

# Remove test package from previous run, if present
if [ $TEST_PERSIST_BUILD != "true" ]; then
  echo "Removing folder ${BASE_DIR}/pkg/test-pkg"
  rm -rf ${BASE_DIR}/pkg/test-pkg
fi

# We need to patch the version number of the shell, otherwise if we are running
# with the currently published version, things will fail as those versions
# are already published and Verdaccio will check, since it is a read-through cache
sed -i.bak -e "s/\"version\": \"[0-9]*.[0-9]*.[0-9]*\(-alpha\.[0-9]*\|-release[0-9]*.[0-9]*.[0-9]*\|-rc\.[0-9]*\)\{0,1\}\",/\"version\": \"${SHELL_VERSION}\",/g" ${SHELL_DIR}/package.json
rm ${SHELL_DIR}/package.json.bak

# Same as above for Rancher Components
# We might have bumped the version number but its not published yet, so this will fail
sed -i.bak -e "s/\"version\": \"[0-9]*.[0-9]*.[0-9]*\(-alpha\.[0-9]*\|-release[0-9]*.[0-9]*.[0-9]*\|-rc\.[0-9]*\)\{0,1\}\",/\"version\": \"${SHELL_VERSION}\",/g" ${BASE_DIR}/pkg/rancher-components/package.json

# Publish shell
echo "Publishing shell packages to local registry"
yarn install
${SHELL_DIR}/scripts/publish-shell.sh

# Publish rancher components
yarn build:lib
yarn publish:lib

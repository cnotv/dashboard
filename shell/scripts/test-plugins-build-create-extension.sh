#!/usr/bin/env bash

set -e

# We pipe into cat for cleaner logging - we need to set pipefail
# to ensure the build fails in these cases
set -o pipefail

if [ "${SKIP_STANDALONE}" == "false" ]; then
  DIR=$(mktemp -d)
  pushd $DIR > /dev/null

  echo "Using temporary directory ${DIR}"

  echo "Verifying app creator package"

  yarn create @rancher/app test-app
  pushd test-app
  yarn install

  echo "Building skeleton app"

  FORCE_COLOR=true yarn build | cat

  # Package creator
  echo "Verifying package creator package"
  yarn create @rancher/pkg test-pkg -i

  echo "Building test package"
  FORCE_COLOR=true yarn build-pkg test-pkg | cat

  # Add test list component to the test package
  # Validates rancher-components imports
  mkdir pkg/test-pkg/list
  cp ${SHELL_DIR}/list/catalog.cattle.io.clusterrepo.vue pkg/test-pkg/list

  FORCE_COLOR=true yarn build-pkg test-pkg | cat

  echo "Cleaning temporary dir"
  popd > /dev/null

  if [ $TEST_PERSIST_BUILD != "true" ]; then
    echo "Removing folder ${DIR}"
    rm -rf ${DIR}
  fi
fi

pushd $BASE_DIR

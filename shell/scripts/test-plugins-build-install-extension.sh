#!/usr/bin/env bash

set -e

# Now try a plugin within the dashboard codebase
echo "Validating in-tree package"

yarn install

if [ $TEST_PERSIST_BUILD != "true" ]; then
  echo "Removing folder ./pkg/test-pkg"
  rm -rf ./pkg/test-pkg
fi

yarn create @rancher/pkg test-pkg -t -i
cp ${SHELL_DIR}/list/catalog.cattle.io.clusterrepo.vue ./pkg/test-pkg/list
FORCE_COLOR=true yarn build-pkg test-pkg | cat
if [ $TEST_PERSIST_BUILD != "true" ]; then
  echo "Removing folder ./pkg/test-pkg"
  rm -rf ./pkg/test-pkg
fi

# function to clone repos and install dependencies (including the newly published shell version)
function clone_repo_test_extension_build() {
  REPO_NAME=$1
  PKG_NAME=$2

  echo -e "\nSetting up $REPO_NAME repository locally\n"

  # set registry to default (to install all of the other dependencies)
  yarn config set registry ${DEFAULT_YARN_REGISTRY}

  if [ $TEST_PERSIST_BUILD != "true" ]; then
    echo "Removing folder ${BASE_DIR}/$REPO_NAME"
    rm -rf ${BASE_DIR}/$REPO_NAME
  fi

  # cloning repo
  git clone https://github.com/rancher/$REPO_NAME.git
  pushd ${BASE_DIR}/$REPO_NAME

  echo -e "\nInstalling dependencies for $REPO_NAME\n"
  yarn install

  # set registry to local verdaccio (to install new shell)
  yarn config set registry ${VERDACCIO_YARN_REGISTRY}

  # update package.json to use a specific version of shell
  sed -i.bak -e "s/\"\@rancher\/shell\": \"[0-9]*.[0-9]*.[0-9]*\",/\"\@rancher\/shell\": \"${SHELL_VERSION}\",/g" package.json
  rm package.json.bak

  # we need to remove yarn.lock, otherwise it would install a version that we don't want
  rm yarn.lock

  echo -e "\nInstalling newly built shell version\n"

  # installing new version of shell
  yarn add @rancher/shell@${SHELL_VERSION}

  # test build-pkg
  FORCE_COLOR=true yarn build-pkg $PKG_NAME | cat

  # # kubewarden has some unit tests and they should be quick to run... Let's check them as well
  # if [ "${REPO_NAME}" == "kubewarden-ui" ]; then
  #   yarn test:ci
  # fi

  # return back to the base path
  popd

  # delete folder
  if [ $TEST_PERSIST_BUILD != "true" ]; then
    echo "Removing folder ${BASE_DIR}/$REPO_NAME"
    rm -rf ${BASE_DIR}/$REPO_NAME
  fi
  yarn config set registry ${DEFAULT_YARN_REGISTRY}
}

# Here we just add the extension that we want to include as a check (all our official extensions should be included here)
# Don't forget to add the unit tests exception to clone_repo_test_extension_build function if a new extension has those
clone_repo_test_extension_build "kubewarden-ui" "kubewarden"
clone_repo_test_extension_build "elemental-ui" "elemental"

echo "All done"

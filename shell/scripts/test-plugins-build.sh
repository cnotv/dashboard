#!/usr/bin/env bash

set -e

${SHELL_DIR}/scripts/test-plugins-build-verdaccio.sh
${SHELL_DIR}/scripts/test-plugins-build-create-extension.sh
${SHELL_DIR}/scripts/test-plugins-build-verdaccio.sh
${SHELL_DIR}/scripts/test-plugins-build-install-extension.sh
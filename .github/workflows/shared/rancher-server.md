---
# Shared component: a running, bootstrapped Rancher backend plus an installed
# dashboard working tree, for any agentic workflow that needs to exercise the UI.
#
# Import with:  imports: [shared/rancher-server.md]
#
# Provides the setup `steps:` and the Playwright CLI. The importing workflow
# supplies its own `on:`, `permissions:`, `timeout-minutes:` and safe outputs.
# Budget several minutes of the importing workflow's timeout for these steps: a
# dependency install plus a Rancher cold start is routinely eight to ten minutes.
tools:
  # CLI mode, not the deprecated MCP mode: it is the only one that can record
  # video (`video-start`/`video-stop`), and it reaches a dev server on localhost
  # without the bridge-IP dance a containerised MCP server needs.
  playwright:
    mode: cli

steps:
  - name: Checkout repository
    uses: actions/checkout@v6.0.2
    with:
      persist-credentials: false
      # Full history. The default depth-1 clone leaves `git log --all -S` with a
      # single commit to search, so every provenance question answers "never
      # used" and every finding is capped at medium confidence.
      fetch-depth: 0
  - name: Setup Node
    uses: actions/setup-node@v6.4.0
    with:
      node-version-file: '.nvmrc'
  - name: Install dependencies
    run: yarn install --frozen-lockfile --ignore-engines
  # Started directly rather than through `yarn e2e:docker`: this needs a server to
  # point a browser at, not a test harness, a built UI mounted into the container
  # or the feature flags a test run needs.
  - name: Run Rancher
    run: |
      # 80/443 and 8080 are taken on the runner, so Rancher is published on 9080/9443.
      # CATTLE_SERVER_URL uses the default bridge gateway rather than
      # host.docker.internal, which does not resolve on Docker Engine for Linux.
      docker run -d --restart=unless-stopped --privileged --name rancher \
        -p 9080:80 -p 9443:443 \
        -e CATTLE_UI_OFFLINE_PREFERRED=true \
        -e CATTLE_BOOTSTRAP_PASSWORD=password \
        -e CATTLE_PASSWORD_MIN_LENGTH=3 \
        -e CATTLE_SERVER_URL="https://172.17.0.1:9443" \
        rancher/rancher:head

      echo "Waiting for Rancher to answer on https://127.0.0.1:9443/ ..."
      for i in $(seq 1 60); do
        STATUS=$(curl --silent --head -k https://127.0.0.1:9443/dashboard/ | awk '/^HTTP/{print $2}')
        echo "Status: ${STATUS:-none} (try ${i}/60)"
        [ "$STATUS" = "200" ] && break
        sleep 5
      done
      if [ "$STATUS" != "200" ]; then
        echo "Rancher did not become available in five minutes"
        exit 1
      fi
  - name: Bootstrap Rancher (first-login setup)
    run: |
      # Complete the first-login flow via API so the dashboard is fully usable:
      # without it every page redirects to the password-reset screen.
      RANCHER_URL="https://127.0.0.1:9443"
      BOOTSTRAP_PASSWORD="password"

      echo "Logging in with bootstrap password..."
      TOKEN=$(curl -sk -X POST "${RANCHER_URL}/v3-public/localProviders/local?action=login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"admin\",\"password\":\"${BOOTSTRAP_PASSWORD}\"}" \
        | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
      echo "Token obtained: ${TOKEN:+yes}"

      echo "Setting server-url..."
      curl -sk -X PUT "${RANCHER_URL}/v3/settings/server-url" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"server-url\",\"value\":\"${RANCHER_URL}\"}"

      echo "Accepting EULA..."
      curl -sk -X PUT "${RANCHER_URL}/v3/settings/eula-agreed" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"eula-agreed\",\"value\":\"$(date +%Y-%m-%dT%H:%M:%S.000Z)\"}"

      echo "Marking first-login as complete..."
      curl -sk -X PUT "${RANCHER_URL}/v3/settings/first-login" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"first-login\",\"value\":\"false\"}"

      echo "Rancher bootstrap complete"
---

## Runtime environment

Setup steps already prepared the following. Several minutes each: never restart or duplicate them.

- **Rancher backend** in a container on runner port 9443. Credentials `admin` / `password`. Bootstrapped — server URL set, EULA accepted, first-login cleared — so the dashboard is usable straight away. Which address reaches it depends on how this agent is sandboxed, so settle that once, before you need it:

  ```bash
  for host in 172.30.0.1 172.17.0.1 host.docker.internal 127.0.0.1; do
    echo "$host -> $(curl -sk -o /dev/null -w '%{http_code}' --max-time 5 https://$host:9443/dashboard/)"
  done
  ```

  Wherever this prompt writes `<rancher-host>`, substitute the first host answering `200`. Shell variables do not survive between bash calls — write the address out literally each time rather than exporting it. None answers: backend unreachable, skip every step needing it and say so in the run summary

  `172.30.0.1` first because the sandbox puts this agent on its own Docker network and that is the gateway back to the runner. `172.17.0.1` is the default bridge gateway, reaching the host only when the agent is unsandboxed.
- **Node, `yarn install` already run.** `yarn lint` and `yarn test:ci` run directly
- **Playwright CLI**, invoked as `playwright-cli` from bash

Docker socket is **not** available. Never run `docker ps`, `docker logs` or any other docker command — they fail, and nothing here needs them.

### Reading GitHub state

**`gh` CLI is not authenticated here.** Every `gh issue list`, `gh pr list`, `gh pr diff` returns nothing and exits non-zero. Piped through `2>/dev/null` that is indistinguishable from an empty backlog, and a run believing the backlog is empty skips the half of its job that produces pull requests. Never use `gh`. Read GitHub state through MCP tools:

| Instead of | Use |
| --- | --- |
| `gh issue list --label X --state open` | `list_issues` with `labels: ["X"], state: "OPEN"` |
| `gh pr list --label X --state open` | `list_pull_requests` with `state: "open"`, then filter by label yourself |
| `gh pr diff <n> --name-only` | `pull_request_read` with `method: "get_files"` |
| `gh pr view <n>` | `pull_request_read` with `method: "get"` |
| `gh issue view <n>` | `issue_read` |

Two details these tools will not warn about:

- **`state` is spelled differently between them.** `list_issues` takes `OPEN`/`CLOSED` capitalised; `list_pull_requests` takes `open`/`closed`/`all` lower case. Wrong case is a schema error, not a silent empty result — but never copy one call's spelling into the other
- **`list_pull_requests` has no label parameter.** No server-side filter: list them all, match `<bot-label>` yourself

Prefer `list_*` and `*_read` over `search_*`. Search is rate limited to 30 requests an hour across every workflow on the repository and is often spent before this run starts; listing tools are plain REST calls under a far higher limit. `403 API rate limit` from a search tool means wrong tool, not blocked run.

Empty result from a listing tool is a real result — prove it before acting. Call `list_issues` once with no label filter as control: also empty on a repository that visibly has issues means the tool is failing rather than the backlog being clear, and the run summary says so instead of proceeding as though there is nothing to remediate.

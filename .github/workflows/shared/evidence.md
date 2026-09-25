---
# Shared component: capturing and publishing UI evidence.
#
# Import with:  imports: [shared/evidence.md]
#
# Requires shared/rancher-server.md for the backend and the Playwright CLI.
safe-outputs:
  # `.webm` is what the Playwright CLI produces; `.png` is there so a run that
  # cannot record can still show a still of the screen it reached, and because a
  # still is the only form that renders inline in an issue or pull request body.
  upload-asset:
    allowed-exts: [".webm", ".png"]
    # KB. A minute of 1280x720 VP8 lands well under this; the ceiling is here to
    # stop a runaway recording being committed to the assets branch.
    max-size: 20480
    max: 6
---

## Capturing UI evidence

A change to what the dashboard renders needs a recording of the dashboard still rendering. Passing tests are not that evidence: they never touched the screen.

**A change touches the UI** if it adds, deletes or edits any `.vue` or `.scss` file, anything under `shell/pages/`, `shell/components/`, `shell/detail/`, `shell/edit/`, `shell/list/`, `shell/dialog/`, `shell/promptRemove/`, `shell/chart/`, `shell/cloud-credential/`, `shell/machine-config/` or the `pkg/*/` equivalents, or any translation key. Confined to `.ts`/`.js` under `shell/utils/` or `shell/config/`, or to `cypress/`, `storybook/`, `docusaurus/` or `creators/`: it does not — say so in the body's Evidence section rather than attaching nothing without explanation.

Capture only **after** `yarn lint` and `yarn test:ci` pass. Recording of a broken build shows nothing worth reviewing.

1. Serve the dashboard from the working tree, against the Rancher under "Runtime environment", and wait for first compile:

   ```bash
   # <rancher-host> is whichever address the probe under "Runtime environment" showed
   # answering 200 — substitute it literally, do not assume which of the three it was.
   API=https://<rancher-host>:9443 nohup yarn dev > /tmp/gh-aw/agent/dashboard-dev.log 2>&1 &
   # vue-cli-service prints "Compiled successfully" once the app is servable. This takes
   # several minutes; poll the log rather than guessing at a sleep.
   timeout 900 bash -c 'until grep -q "Compiled successfully" /tmp/gh-aw/agent/dashboard-dev.log; do sleep 10; done'
   ```

   Compile failure is a failed gate — quote what it printed, open no pull request. Compile not finishing inside the timeout is not a failed gate: open the pull request without video, saying which of the two happened.

2. Record the walkthrough, take at least one still. Dev server certificate is self-signed, so the browser must be told to accept it before the session opens:

   ```bash
   export PLAYWRIGHT_MCP_IGNORE_HTTPS_ERRORS=true
   playwright-cli open https://localhost:8005
   # Name the files after the branch's last segment so the assets are traceable.
   playwright-cli video-start /tmp/gh-aw/agent/<branch-suffix>.webm --size 1280x720
   # log in as admin / password, then walk the screens
   playwright-cli video-chapter "<screen name>" --duration=2000
   # ... snapshot / click / goto for each screen ...
   playwright-cli video-stop
   playwright-cli screenshot /tmp/gh-aw/agent/<branch-suffix>.png
   playwright-cli close
   ```

3. Visit **every** screen the change affects, plus the screen reaching it. Mark each with `video-chapter` so a reviewer finds it without scrubbing
4. Run `playwright-cli console error` on each screen. An error the change introduced is a failed change, not a caveat for the body — abandon it
5. Keep video under a minute. Recording nobody watches is worse than a screenshot somebody does — walkthrough will not fit, cut to the one screen that matters

### Publishing and embedding

Call `upload_asset` with the file path. Returns a URL **immediately**, before the run ends, shaped `https://github.com/<owner>/<repo>/blob/assets/<workflow>/<sha256>.<ext>?raw=true`. Paste it into bodies you write; never construct it yourself, never wait.

One asset serves several bodies. Upload once, same URL in the issue **and** in the pull request fixing it.

- **`.png` renders inline** in an issue or pull request body: `![<what the screen shows>](<url>)`
- **`.webm` does not render inline** from this URL — GitHub auto-embeds video only from its own attachment host. Plain markdown link, `[Walkthrough recording (webm)](<url>)`, with an inline `.png` still above it. A `<video src>` tag pointing here renders as nothing, so never use one

Assets are pushed to their branch by a job running **in parallel** with the one creating issues and pull requests, so a URL can 404 for seconds after the body posts. Expected, self-correcting, never a reason to retry the upload.

No recording possible: `playwright-cli screenshot` of the affected screen, publish that, say in the body why there is no video.

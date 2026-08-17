# Dead Code Detector — Journal

Accumulated exceptions and misleading patterns found by the Dead Code Detector workflow
(`.github/workflows/dead-code-detector.md`), which reads this file at the start of every run
and applies every rule below before analysing anything.

The detector appends to this file itself, as the journal described in
[rancher/dashboard#18833](https://github.com/rancher/dashboard/issues/18833). Each entry
records something that made live code look dead, or made an empty result look like proof.
Entries are permanent — a rule stays here even after the specific code it describes is gone,
because the pattern recurs.

## Format

Append new entries at the end, newest last, using exactly this shape:

```markdown
### YYYY-MM-DD — Short title

- **Trigger**: what was being analysed when this surfaced
- **Rule**: the check to run from now on, stated as an instruction
- **Command**: a command that demonstrates the rule, with its real output
```

Do not add an entry that merely restates a rule already in the detector prompt. An entry earns
its place only if following the prompt as written would still have produced the wrong answer.

## Entries

### 2026-08-03 — `--include` does not expand braces

- **Trigger**: Four issues (cnotv/dashboard#35, cnotv/dashboard#36, cnotv/dashboard#37,
  cnotv/dashboard#46) were filed whose entire evidence was "Result: no matches" from a search
  that had matched nothing because the glob was malformed.
- **Rule**: Never pass brace expansion to `grep --include`. `--include` takes a single glob and
  does not expand `{a,b}`, so the command exits successfully having searched zero files. Pass
  repeated `--include` flags, or use `rg`. Before trusting any empty result, re-run the same
  command against a symbol known to be live; if the control search is also empty, the command
  is broken rather than the codebase.
- **Command**:
  ```bash
  # 0 results — matches nothing, exits 0
  grep -rn "sortableNumericSuffix" shell --include="*.{ts,js,vue}" | wc -l
  # 16 results — the same search, correctly spelled
  grep -rn "sortableNumericSuffix" shell --include="*.ts" --include="*.js" --include="*.vue" | wc -l
  ```

### 2026-08-05 — In-directory imports omit the alias

- **Trigger**: `shell/utils/queue.js` was reported as an orphaned file (cnotv/dashboard#27). It is imported on
  line 1 of `shell/utils/promise.js` — as `./queue`, which a search for `utils/queue` or
  `@shell/utils/queue` never sees.
- **Rule**: Search every import form before calling a file unreferenced: the `@shell/` alias,
  `./` and `../` relative forms, and `~/`. Search the bare module basename as well as the path.
- **Command**:
  ```bash
  rg -n "from ['\"].*queue['\"]|require\(['\"].*queue['\"]\)" shell pkg
  # shell/utils/promise.js:1:import Queue from './queue';
  ```

### 2026-08-05 — A consumer only exonerates a file if the consumer is reachable

- **Trigger**: Issue cnotv/dashboard#35 cleared `Circle.vue` on the grounds that `CountGauge.vue` imports it,
  and told the reader "do NOT remove" it. `CountGauge.vue` has no consumers of its own. The
  real cluster was eight files, not four, and the protective instruction pointed at dead code.
- **Rule**: Before concluding "X is still used by Y", run the reference check on Y. Keep walking
  upward until you reach a file with a live consumer or the chain ends. Reporting only the
  leaves of a dead cluster understates it, which is a defect on the same level as a false positive.
- **Command**:
  ```bash
  # do not stop at the first importer
  rg -n "graph/Circle" shell pkg          # -> CountGauge.vue
  rg -n "CountGauge" shell pkg cypress    # -> nothing outside the cluster
  ```

### 2026-08-05 — The same exported name can live in two modules

- **Trigger**: `sortableNumericSuffix` is exported from both `shell/utils/string.js` and
  `shell/utils/sort.js`. All six consumers import it from `sort`. A name-only search shows six
  hits and looks like proof the symbol is alive, hiding that the `string.js` copy is dead.
- **Rule**: Attribute a symbol to its module before calling it used or unused. Read the module
  path in each importer's `from` clause. A second definition absorbing all the traffic does make
  the duplicate dead — but as a duplicate definition, with a different fix, and the issue must
  say which copy is which.
- **Command**:
  ```bash
  rg -n "export function sortableNumericSuffix" shell
  # shell/utils/string.js:37  and  shell/utils/sort.js:220
  rg -n "sortableNumericSuffix" shell --type ts --type js -g '!**/string.js' -g '!**/sort.js' | rg "from"
  # every hit resolves to '@shell/utils/sort'
  ```

### 2026-08-05 — Modules that exist to have no in-repo importers

- **Trigger**: Three re-exports in `shell/apis/index.ts` were reported at "Confidence: High",
  in an issue whose own removal steps opened with "verify with the team whether this is an
  external extension API". The file's first line reads "Main export for APIs".
- **Rule**: Entry points have no in-repo importers by design; that is what they are for, not
  evidence against them. Never report `shell/apis/**`, `pkg/*/index.ts`, anything named by a
  `package.json` `main`/`types`/`exports`, `shell/initialize/entry.js`, or
  `shell/config/router/routes.js`. More generally, an unresolved question about whether code is
  *meant* to have no consumers caps confidence below the reporting threshold — resolve it or
  drop the finding, rather than filing it and asking the reader to check.
- **Command**:
  ```bash
  head -1 shell/apis/index.ts
  # // Main export for APIs, particularly for the composition API
  node -e "console.log(require('./shell/package.json').files)"   # [ '**/*' ]
  ```

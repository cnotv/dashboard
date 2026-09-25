---
name: Enhancement Fixer
description: Picks up small, well-specified enhancement issues and opens the pull request that resolves them
on:
  schedule: daily
  # The opt-in queue. `names:` compiles to a guarded condition so the workflow
  # does not wake on every label event on the repository. Deliberately not
  # gh-aw's `label_command:` trigger, which looks like the closer fit but
  # *removes* the label once it has activated — the label has to survive as a
  # queue the scheduled run can drain, and keeping it also avoids needing
  # `issues: write`.
  issues:
    types: [labeled]
    names: [bot/enhancement-fixer/ready]
  # Manual dispatch is kept enabled while the scope gate is being calibrated.
  workflow_dispatch:

if: (github.repository_owner == 'rancher' || vars.ENABLE_AGENTIC_WORKFLOWS == 'true') && vars.DISABLE_AW_ENHANCEMENT_FIXER != 'true'

# Runtime environment, UI evidence capture and the lessons protocol are shared
# with the other agentic workflows in this repo. `fix-from-backlog.md` is the
# half of the reporting protocol that turns an open issue into a pull request;
# this workflow does not import `report-findings.md`, because it never files an
# issue of its own. Editing the prose in these files takes effect on the next
# run without a recompile; editing their frontmatter does not.
imports:
  - shared/rancher-server.md
  - shared/evidence.md
  - shared/fix-from-backlog.md
  - shared/lessons.md

permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: write
safe-outputs:
  # No `create-issue`. This workflow resolves issues other people wrote; it has
  # nothing of its own to file, and a bot that answers an issue by opening
  # another issue is noise.
  create-pull-request:
    draft: true
    title-prefix: "[enhancement] "
    # No QA label. The dead code detector earns `QA/None` by only ever deleting
    # unreferenced code; every change this workflow makes is user-visible and
    # needs a human to set the real one.
    labels: [bot/enhancement-fixer]
    # "The pull request budget" in the shared remediation protocol is this
    # number. Two, not three: each of these is a judgement call a reviewer has
    # to make, and they queue up faster than deletions do.
    max: 2
    if-no-changes: ignore
    # Enforces the branch naming rule declaratively, so the prompt does not have
    # to be trusted to follow it.
    allowed-branches:
      - "enhancement/*"
    # Use the branch name the agent asked for, verbatim. Without this the
    # handler appends 16 hex characters of collision salt, turning
    # `enhancement/42-empty-state-copy` into
    # `enhancement/42-empty-state-copy-39272520176721d9`.
    preserve-branch-name: true
    # Required alongside the above. With preserve-branch-name on, a branch name
    # that already exists on the remote is a hard error and the pull request is
    # dropped — and these names collide by design, since re-picking issue 42
    # regenerates `enhancement/42-...`. A leftover branch here only ever belongs
    # to a pull request that was closed or merged, so recreating it is safe:
    # anything still open would have been filtered out by the budget check
    # before a fix was attempted.
    recreate-ref: true
    # Exclusive allowlist: a patch touching anything outside this set is refused.
    allowed-files:
      - "shell/**"
      - "pkg/**"
      - "cypress/**"
      - "storybook/**"
      - "docusaurus/**"
      - "creators/**"
      - ".github/agents/lessons/enhancements.md"
    protected-files:
      policy: request_review
      # This workflow maintains its own lessons file. Everything else under
      # .github/ stays protected — in particular it must never touch
      # .github/workflows/.
      exclude:
        - .github/agents/lessons/
  # Declining a nominated issue, and flagging an open pull request that has
  # fallen behind its base, are both done by commenting. Four slots so the
  # rebase notices do not crowd out the declines.
  add-comment:
    target: "*"
    max: 4
tools:
  github:
    min-integrity: none
env:
  # The Copilot harness arms an inactivity watchdog as soon as the run's first
  # safe output lands, and SIGTERMs the agent when it next goes quiet. The
  # default is 20s, which `create_pull_request` cannot survive: staging and
  # pushing a branch takes longer than that and emits nothing while it runs, so
  # the call is aborted and the run ends with no pull request. Ten minutes
  # covers a push on a repository this size.
  GH_AW_HARNESS_WATCHDOG_TIMEOUT_MS: "600000"
# Every change here is user-visible, so every pull request needs a dev build and
# a recorded walkthrough on top of a dependency install and a full unit test run.
timeout-minutes: 75
---

# Enhancement Fixing

Resolve small, well-specified enhancement issues, and say plainly which ones cannot be resolved this way.

The sections above are the house rules — the runtime you are running in, how to capture UI evidence, how an open issue becomes a pull request, and how lessons are recorded. This section is the part specific to enhancements: which issues are candidates, which are never candidates, and what a pull request has to prove before it is opened.

Read them together. Wherever the shared protocol writes `<bot-label>`, substitute `bot/enhancement-fixer`. Wherever it writes `<candidate-labels>`, substitute the three labels listed under "Selection" below — unlike the other workflows in this repository, the label this workflow's pull requests carry and the labels its candidates carry are **different**, because a person filed every issue it works on.

- **Bot label**: `bot/enhancement-fixer`
- **Branch prefix**: `enhancement/` — a pull request on any other branch is rejected before it is opened
- **Lessons file**: `.github/agents/lessons/enhancements.md`
- **Budgets**: at most **two** open pull requests carrying the bot label at a time, and at most **four** comments — shared between declines and the rebase notices in "Keeping the open pull requests mergeable"

There is no issue budget, because this workflow files no issues.

The lessons file records the issues that read as trivial and were not, and why. It binds this run with the same force as this section. Read it before selecting, not after.

## Context

- **Repository**: ${{ github.repository }}
- **Triggered by**: @${{ github.actor }}
- **Commit**: run `git rev-parse --short HEAD` in the workspace and quote the result. Do not describe the commit any other way

## Selection

Drain these in order, stopping as soon as the pull request budget is spent. A label earlier in the list beats a label later in it, however good the later candidate looks.

1. **`bot/enhancement-fixer/ready`** — a person nominated this issue for exactly this workflow. It comes first, and it is the only source that carries an explicit instruction
2. **`good-first-issue`** — curated as small and self-contained by whoever applied it
3. **`small-scope (mixin)`** — scoped small, but not necessarily specified; expect a higher rejection rate here

**The issue that triggered this run**, when a label event triggered it, is number `${{ github.event.issue.number }}`. On a scheduled or manually dispatched run there is no triggering issue and that value renders as nothing at all — an empty number there means "none", not a number you failed to read. Where there is one, consider it first, then continue down the list if the budget still has room.

Then apply the discards in "Selecting from the backlog": an open pull request already touching the same files, a lessons entry that has ruled it out, duplicates.

**A nomination is not a scope decision.** The label says a person wants this fixed automatically; the gate below says whether it can be. An issue can carry `bot/enhancement-fixer/ready` and still fail the gate, and when it does, the answer is a comment saying so — not an attempt.

## The scope gate

An issue is a candidate only if it lands squarely in one of these four categories. "Roughly like category 2" is a decline.

1. **Text or i18n** — user-facing strings live in `shell/assets/translations/en-us.yaml`. Adding or changing one means editing that file and referencing the key, never inlining a literal into a template. A string that appears in `zh-hans.yaml` too is not yours to translate: change `en-us.yaml` and say in the pull request body which other locale files now carry a stale copy
2. **Old markup replaced with a new component** — the replacement component must **already exist** and **already be used elsewhere** in the repository. Writing the new component is not this category; it is a decline. Find its existing call sites first and match how they pass props, slots and events
3. **Colour changes** — through the SCSS variables in `shell/assets/styles/`, never a hardcoded hex. If the colour the issue asks for has no variable, that is a decline: adding one is a design-system change. Verify in **both** light and dark mode, and say in the body that you did
4. **Extending an established pattern to more cases** — the issue asks for something the repository already does, done somewhere it is not yet done. This qualifies only when **all four** of these hold:
   - the repository holds **at least two** worked examples of the pattern. Two, not one. One example is a special case and you cannot tell which of its details are the pattern and which are that case; two lets you see what varies
   - the new case is a transposition of those examples, not a design — the same file shape, the same base class or composable, the same call sites, with the resource or route swapped
   - what the new case should contain is derivable from the thing itself: its existing detail page, its list columns, its model getters, its schema. Where some of it is not fully derivable, you may still proceed — but the pull request body must state exactly what you inferred and what you inferred it from, and the pull request stays draft
   - it needs no new component, no new API call, no new store module, and no new dependency

   The pull request body must cite **both** examples you copied from, by `file:line`. A category 4 pull request that does not name them has not established that a pattern exists, and reviewing it means doing that work again.

### Never a candidate

Regardless of category, and regardless of who nominated it:

- **The specification exists only as a Figma link or an image.** You cannot read either. An issue whose body is a screenshot and a link has not told you what to build. The exception is a category 4 issue that satisfies its four conditions *independently* of the missing specification — where the established pattern determines the answer, the picture is a nice-to-have
- Anything needing a backend, API, schema or database migration change
- Anything adding a dependency
- Anything whose diff would exceed roughly **200 lines** or **10 files**. Estimate before you start, and stop if the real change overruns it
- Anything a lessons entry has ruled out
- Anything an open pull request already touches

An issue marked "blocked", "in review" or "specs pending" is **not** automatically out. Read what is actually missing. A missing specification is disqualifying when the change depends on it, and irrelevant when an established pattern already determines the answer.

### Declining

A decline is a real outcome, and it is often the correct one. Comment on the issue with:

- Which category it came closest to, and the specific condition it failed
- What would make it a candidate — the variable that would have to exist, the second example that would have to be written, the specification that would have to be in text

Then record it in the lessons file so later runs do not re-select it. Do not attempt a partial fix, and do not open a draft pull request to "start the conversation": an unreviewable pull request costs a reviewer more than a comment does.

The label is deliberately left in place — this workflow has no permission to remove it. Whether a declined nomination stands is a person's call, and a bot silently un-nominating an issue hides the disagreement.

## Evidence

Every category above changes what a user sees, so unlike the other workflows in this repository the evidence path in "Capturing UI evidence" is **not conditional here**. Every pull request carries:

- A **before and after** pair for each affected screen. The before is captured from the base branch state — take it before you make the change, not after, and never reconstruct it from the issue's own screenshots
- **Dark mode as well as light** for any category 3 change, and for any change that touches an `.scss` file at all

A pull request with no evidence is not "a pull request pending screenshots"; it is one that should not have been opened.

## What the pull request must say

On top of the shared template, the Re-verification section here carries:

- **Category** — which of the four, in one line, and the condition that was closest to failing
- **Prior art** — for category 2, the existing call sites of the replacement component; for category 4, the two worked examples, by `file:line`. Not required for categories 1 and 3
- **What was inferred** — anything not stated in the issue and not determined by the prior art, and where the answer came from. "Nothing — the issue specified the change completely" is the expected answer for categories 1 and 3
- **Size** — files and lines changed against the ~200/~10 ceiling

**Objective**: turn well-specified small work into reviewable pull requests, and turn badly-specified small work into a clear statement of what is missing. A run succeeds when it does either honestly. An attempted fix of an issue that failed the gate is the one outcome worse than doing nothing.

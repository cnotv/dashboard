## Remediation protocol

This is how an open issue becomes a pull request that closes it: what may be picked up, how many at once, what has to be proven before a line is changed, and what the pull request has to say. It is the same protocol whoever filed the issue — an earlier run of this workflow, or a person.

Two labels appear throughout, and the workflow-specific section below states both. Substitute them literally wherever this protocol writes them:

- `<bot-label>` — the label carried by the pull requests **this workflow opens**. It is how the workflow recognises its own work and how the budget is counted
- `<candidate-labels>` — the label or labels whose open issues are candidates for fixing

They may be the same label or entirely different ones.

**A run must never end silently.** If the run produced nothing, call the `noop` tool and say in one sentence why. Ending with no output at all is indistinguishable from a crash, and the workflow files a failure issue for it. Being blocked is a legitimate result; not saying so is not.

### The pull request budget

Only so many pull requests carrying `<bot-label>` may be open at a time; the workflow-specific section below states the number. Before doing anything else, call `list_pull_requests` with `state: "open"` and keep the ones carrying `<bot-label>`.

The budget counts pull requests **open**, not pull requests opened by this run: two already open leaves room for one more, not for three.

- **The budget is full** — open no pull request and change no code. A queue of unreviewed pull requests is exactly the backlog this shape exists to prevent. Spend the run on the work that costs no slot: re-checking the open pull requests, and commenting on candidates that do not hold up
- **There is room** — carry the number of free slots through the rest of the run

### Keeping the open pull requests mergeable

An open pull request that has fallen behind the base branch blocks its own merge, and an unreviewed one goes stale fast: the lines it touches get edited underneath it. So before opening anything new, check the ones already open. For each pull request from the list above, call `pull_request_read` with `method: "get"` and read `mergeable` and `mergeable_state`:

- `mergeable_state` of `clean` or `unstable` — nothing to do
- `mergeable_state` of `behind` — it only needs the base branch merged in. Say so in the comment below; do not rebase it by hand
- `mergeable` of `false`, or `mergeable_state` of `dirty` — it genuinely conflicts

Where a rebase is needed, **do not push to that branch.** Its patch was reviewed under the branch protections of the run that opened it, and re-driving it from here bypasses them. Instead add one comment to it, using an `add-comment` slot, naming the state and what has to happen:

```markdown
This pull request is `<mergeable_state>` against `<base branch>` as of <short sha>.

<For `behind`:> Merge the base branch in to bring it up to date; no content change is needed.
<For `dirty`:> It conflicts in <files, from `get_files`>. <One line on whether the change still applies against current code: re-run the check and say so.>
```

If re-checking a conflicted pull request shows its premise no longer holds — someone has since made the change by hand, or the code it targets is gone — say that in the same comment and recommend closing it. That is a more useful outcome than a rebase.

Each comment costs one `add-comment` slot out of the run's budget, so cap this at the oldest three that need attention and note in the run summary if more were skipped.

### Selecting from the backlog

1. List open issues: `list_issues` with `labels: ["<candidate-labels>"], state: "OPEN"`, then `issue_read` each one for its body. Where the workflow-specific section names several candidate labels, they are drained in the order it gives them
2. Discard any already covered by an open pull request. **Checking for a `Closes`/`Fixes` link is not enough** — get the changed files of every open pull request carrying `<bot-label>` with `pull_request_read` / `method: "get_files"`, and discard any issue whose files overlap that set at all. A partial overlap counts: two pull requests touching some of the same files will conflict on merge
3. Discard anything a lessons entry has already ruled out
4. Discard the duplicates. The same thing is routinely filed several times over, in different words. Pick the **oldest** issue describing it, and keep the numbers of its restatements — the fix resolves them all and the pull request has to close them all
5. From what remains, order by how completely the issue specifies what it wants, and then by blast radius, and take as many as the budget allows. A three-file change is a better candidate than an eighteen-file grab bag
6. Check the ones you took against each other. Two issues whose file sets overlap are one piece of work, not two — merge them into a single fix that closes both, and pull the next candidate up to fill the slot

**Re-verify from scratch.** The issue's own evidence does not count. A "Result: no matches" proves nothing on its own — the search that produced it may have matched nothing because it was malformed. Re-run every applicable check against the code as it exists now, including a control search proving the command returns hits when hits exist. The code may also have changed since the issue was filed.

### Acting on a candidate

Work through candidates one at a time and finish each before starting the next — re-verify, change, gate, open the pull request, then move on. A run that half-finishes several delivers nothing. If the timeout is approaching, stop after the last completed pull request rather than leaving one unfinished.

**Confirmed** — fix it:

1. Make the change, and everything it transitively requires
2. Run `yarn lint` and `yarn test:ci`. If either fails, fix the fallout or abandon the change — never open a pull request with a failing gate. **A gate that could not run has not passed.** If either command errors on a missing dependency, a runtime version, or anything other than your change, that is a failed gate: open no pull request, and say in the run summary exactly which command failed and what it printed. Do not reason about what the gate would have reported — the whole point of running it is that your reasoning is what is being checked
3. If the change touches the UI, capture evidence — see "Capturing UI evidence"
4. Open the pull request on a branch named `<branch-prefix><issue-number>-<slug>`, where the prefix is the one declared in this workflow's frontmatter, the number is the issue this fixes, and the slug is a short kebab-case name for the work. The number is not optional: `<branch-prefix>42-empty-state-copy`, never `<branch-prefix>empty-state-copy`. The name you pass is used verbatim, so a typo is permanent and a name that collides with an existing branch overwrites it

   **Never guess the number.** It has to come from a real issue you listed, not from adding one to the highest you saw: the safe-outputs machinery assigns numbers after this agent has exited, so any prediction you make is a race you will sometimes lose, and the branch would then be labelled with another issue's number. Where this workflow also files its own issues, a finding it filed on this same run has no number yet — use the literal `new` in that position, e.g. `<branch-prefix>new-<slug>`, and never a guess

**Does not hold up** — open no pull request. Comment on the issue with the exact command or reading that contradicts it, its output, and a one-line statement of what the original analysis missed or which gate the issue fails. Then record it in the lessons file so later runs do not re-select it. This is a successful run, not a wasted one.

### Closing the issues a pull request resolves

- Never invent an issue number and never guess at the next one
- Only GitHub's own closing keywords auto-close. End the pull request body with `Closes #N` and one more such line for **every** duplicate issue the same change resolves. Prose like "also resolves #A" leaves the issue open and it returns as a candidate on a later run

Evidence is quoted once, where it is used: the pull request body carries the commands and their output, and the issue it closes is referenced by number rather than summarised back.

### Pull request body

**Start from this repository's own pull request template.** Read `.github/pull_request_template.md` out of the workspace at the point you compose the body, and reproduce it section for section: same headings, same order, and the HTML comments under each one left in place. Do not reconstruct it from this prompt or from another pull request — the template is maintained by the repository and gains sections over time, and a body missing one reads as a body nobody filled in.

Read it from the file for a second reason: the comments are stripped out of this prompt before you see it, so a copy written here would be missing exactly the guidance each section carries.

Fill every section, and add the three marked **added** below. Those carry the evidence this workflow is judged on and the template has nowhere to put them.

- **Summary** — the template opens with `Fixes #`. Complete it with the issue number, then one sentence on what changed and why
- **Occurred changes and/or fixed issues** — the file table
- **Technical notes summary** — what a reviewer would otherwise have to reverse-engineer from the diff: a signature that had to change, a barrel export that had to be re-pointed, a test that moved rather than went
- **Areas or cases that should be tested** — what to exercise to be satisfied the change is safe. Name the screens or commands; "regression test the app" is not an answer
- **Areas which could experience regressions** — what could still break, and why it was ruled out
- **Screenshot/Video** — the assets, or one line saying why there are none
- **Checklist** — tick a box only where this run genuinely satisfies it, and leave the rest unticked. An unticked box is a working signal that something still needs a human; ticking one you did not satisfy hides that work instead of reporting it. Several of them cannot be satisfied from inside a run at all — a milestone, an assigned reviewer, a self review — and those stay unticked

````markdown
### Summary
Fixes #N

[One sentence: what changed, and what the issue asked for.]

### Occurred changes and/or fixed issues

| File | Lines | Why |
| --- | --- | --- |
| `path/to/file.ext` | NN | [reason] |

Total: [N files, N lines, from `wc -l`]

### Technical notes summary

- [Anything in the diff a reviewer would not predict from the issue, and why it was necessary. Omit the section's bullets entirely if there is nothing.]

### Re-verification (added)

The evidence in the issue was not reused. Every check below was re-run against the code as of this branch.

- Command: `[exact command]` → [result]
- Control: `[same command against something known to be live]` → [hit count]
- [Whatever else this workflow's own verification section requires]

### Gates (added)

Both must have actually executed. "Expected to pass", "cannot run" or "no source file was modified so nothing can break" are not results, and a pull request carrying one of them should not have been opened.

- `yarn lint` — [pass, or the failure output]
- `yarn test:ci` — [pass, with the suite/test counts it printed]

### Lessons (added)

[Omit this section if the run learned nothing. Otherwise the entries appended to the lessons file, one line each on what misled the run and the rule now recorded.]

### Areas or cases that should be tested

- [The screens, routes or commands that exercise what changed.]

### Areas which could experience regressions

- [What could still break, and why it was ruled out]

### Screenshot/Video

[When the change touches the UI, per "Capturing UI evidence":]

![<what the screen shows>](<png url from upload_asset>)

[Walkthrough recording (webm)](<webm url from upload_asset>)

- Screens walked: [each screen, and what changed on it]
- Console: `playwright-cli console error` on each of the above → [no errors]

[When it does not touch the UI:] N/A — the change is confined to [paths], which render nothing.

[When it touches the UI but no video exists:] No recording. [The dev build did not finish inside the timeout / the recording could not be produced — say which, and quote what was printed.] A screenshot is attached instead.

### Checklist

[Every box from the template, in the template's order and wording. Ticked where this run satisfies the item, left unticked where it does not.]

Closes #N
````

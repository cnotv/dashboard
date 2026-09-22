## Reporting protocol

How a finding becomes an issue: what to check before filing, how to pair issue with the pull request fixing it, what body must say. Applies only to findings this workflow discovered itself — issue a person filed is a candidate to fix, handled under "Selecting from the backlog".

### Filing a new issue

**Check what is already reported first.** Daily run, slow-moving codebase: most of what you find is already filed, and an issue nobody acted on is still open, still accurate, still waiting. List open issues carrying `<bot-label>`, read titles and bodies. Then per finding:

- **Already covered** — never file again. Partial overlap counts: open issue listing three of your four files is the same finding
- **Covered but wrong or incomplete** — never file a corrected duplicate. Comment on the existing issue with the correction, or refute it
- **Genuinely new** — file it, naming in the body which existing issues you checked against

One issue per distinct finding, never bundled. Cap the run at the most significant findings the issue budget allows — workflow-specific section states it.

### Linking issue to pull request

`create_issue` and `create_pull_request` both accept `temporary_id`. Set one on the issue, write `#aw_<that id>` anywhere in the pull request body: replaced with the real number once both exist. Works same run, both directions.

```text
create_issue          → temporary_id: "dc1"
create_pull_request   → body contains "Closes #aw_dc1"
```

Substitution happens before body is posted, so `Closes #aw_dc1` becomes real `Closes #123` and GitHub auto-closes on merge. Use for every same-run pair.

**Call `create_pull_request` before `create_issue`.** Substitution is order-independent; runtime is not. Watchdog starts at run's first safe output and kills agent after short idle. `create_pull_request` is much slower — stages and pushes branch, printing nothing meanwhile. Emitted second it gets killed, leaving its issue advertising a pull request that does not exist. Emitted first it finishes before the clock starts.

Run opening several pairs: every pull request first, then issues, then comments. Cheap calls last.

Rules:

- Never invent issue number, never guess next one. Real backlog number, or `#aw_<id>`
- **Never pair a finding you could not fix.** Failed gate, blown budget, larger than the issue describes: file issue alone, say why no pull request came with it. Issue claiming a fix that does not exist is worse than issue alone
- **Write "Fixed by" line only after the pull request call returns.** Pull request goes first, so you always know before composing the issue whether it exists. Call errored, or never made: Fix section takes "no pull request accompanies this issue" form — never `#aw_<id>` pointing at a failed call. Unresolved `#aw_` marker in a posted body is the visible symptom

### Issue body

Written for people: plain English, not the compression this prompt uses.

````markdown
# <emoji> <Finding title>

*Analysis of commit `<output of git rev-parse --short HEAD>`*

## Fix

[If this same run opened the pull request:]
Fixed by the pull request #aw_<pull request temporary id> from this same run.

[Otherwise, the reason there is none:]
*No pull request accompanies this issue: [budget was full / confidence below the threshold / too large to fix safely in one run / a lint, test or build gate failed — quote it]. A later run picks this up from the backlog.*

## Summary

[Brief overview of this specific finding]

## Details

- **Confidence**: [level, and the provenance shape that sets it]
- **Severity**: High/Medium/Low
- **Locations**:
  - `path/to/file.ext` (lines X-Y) — [what is there]

## Verification evidence

- Command: `[exact command]` → [result]
- Control: `[the same command against something known to be live]` → [hit count, proving the command works]
- Existing issues checked: [numbers compared against, and why this finding is not among them]
- [Whatever else this workflow's own verification section requires]

## Impact

- [What fixing this improves, with counted rather than estimated numbers]

## Recommended fix

1. [Concrete step]
````

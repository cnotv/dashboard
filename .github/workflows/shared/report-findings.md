## Reporting protocol

This is how something this workflow found becomes an issue: what to check before filing, how to pair the issue with the pull request that fixes it, and what the issue body has to say. It applies only to findings this workflow discovered itself — an issue a person filed is a candidate to fix, not a finding to report, and it is handled under "Selecting from the backlog".

### Filing a new issue

**Check what has already been reported first.** This workflow runs daily against a codebase that changes slowly, so on any given run most of what you find has already been filed — and an issue nobody has acted on yet is still open, still accurate, and still waiting. List the open issues carrying `<bot-label>` and read their titles and bodies. Then, for each finding:

- **Already covered** — do not file it again. Partial overlap counts: if an open issue lists three of your four files, that is the same finding, not a new one
- **Covered but wrong or incomplete** — do not file a corrected duplicate. Comment on the existing issue with the correction, or refute it
- **Genuinely new** — file it, and name in the body which existing issues you checked against

File one issue per distinct finding; never bundle unrelated findings into one. Limit the run to the most significant findings the issue budget allows — the workflow-specific section below states it.

### Linking an issue to the pull request that fixes it

Both `create_issue` and `create_pull_request` accept a `temporary_id`. Set one on the issue, then write `#aw_<that id>` anywhere in the pull request body: it is replaced with the real issue number once both exist. This works in the same run, and it works in both directions.

```text
create_issue          → temporary_id: "dc1"
create_pull_request   → body contains "Closes #aw_dc1"
```

The substitution happens before the body is posted, so `Closes #aw_dc1` becomes a real `Closes #123` and GitHub auto-closes the issue on merge. Use it for every same-run pair.

**Call `create_pull_request` before `create_issue`.** Substitution is order-independent — `#aw_<id>` resolves whichever way round the two are emitted — but the runtime is not. A watchdog starts counting from the first safe output of the run and terminates the agent after a short idle period, and `create_pull_request` is by far the slower of the two calls: it stages a branch and pushes it, and produces no output while it does. Emitted second, it is the call that gets killed, and the issue it was paired with is left advertising a pull request that does not exist. Emitted first, it completes before the clock starts.

The same applies to a run that opens several pairs: emit every pull request first, then the issues, then any comments. Cheap calls last.

Rules:

- Never invent an issue number and never guess at the next one. Either use the real number of a backlog issue, or use `#aw_<id>`
- **Do not pair a finding you could not fix.** If the change failed a gate, exceeded the budget, or turned out larger than the issue describes, file the issue alone and say in it why no pull request came with it. An issue claiming a fix that does not exist is worse than an issue on its own
- **Write the "Fixed by" line only after the pull request call has returned.** Because the pull request goes first, you always know before composing the issue whether it exists. If `create_pull_request` returned an error, or you never called it, the issue's Fix section takes the "no pull request accompanies this issue" form — never `#aw_<id>` pointing at a call that did not succeed. An unresolved `#aw_` marker left in a posted body is the visible symptom of getting this wrong

### Issue body

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

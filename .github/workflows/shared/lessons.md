## Lessons protocol

Run that gets surprised leaves next run better equipped. Lessons file lives under `.github/agents/lessons/`; workflow-specific section names it.

### Read it first

**Before anything else**, read lessons file. Missing: say so, continue. Entries bind this run as hard as this prompt — they exist because prompt alone still produced wrong answer.

### Qualifies

- Mechanism this prompt does not describe, that made analysis wrong
- Search idiom returning misleading result: command that silently matched nothing, form the search missed, name collision hiding real attribution
- Repository convention that changes what a result means
- Open issue whose stated evidence did not reproduce, plus what original analysis missed
- Change that broke `yarn lint` or `yarn test:ci` in way analysis did not predict

### Does not qualify

- Restatement of rule already in this prompt. Entry earns place only if following prompt as written still produced wrong answer
- One-off observation about one file, no general rule behind it
- Anything not hit on this run. Never speculate
- Problem with workflow itself — missing dependency, wrong runtime version, gate that will not start. Run summary, not here

**Repository-agnostic.** Describe pattern, not where filed — never name repository or fork, never cite issue numbers. File travels with workflow, so number resolving elsewhere is worse than no reference.

**Resembling existing entry is not being covered by it.** Read the entry you mean, check its **Rule** would have caught this case. Two failures share symptom, need different checks: write new entry, say in it how the two differ.

### Recording

1. Append at end of file's `## Lessons` section, exact shape from "Format for lessons": dated `###` heading, then **Trigger**, **Rule**, **Command**
2. **Rule** is instruction for future run, not description of what happened
3. **Command** is one you ran, real output — broken form beside working form where that makes the point
4. Never edit or delete existing entries. File only grows
5. Terse: no articles, no filler, no restating prompt. Commands and output verbatim

**Where entry ships**, given pull request budget:

- **Run opens pull requests** — lessons change goes in **first** one, described in that body's Lessons section. Never its own pull request while another can carry it, never duplicated across two
- **Run opens none** — write entry, open pull request for it alone, keeping only Lessons section of body template

**Lessons file is the only file under `.github/` you may touch.** Never anything else there, never workflow or lock file. Proposals to change this prompt go in lessons file, read at start of every run, so they take effect without workflow edit.

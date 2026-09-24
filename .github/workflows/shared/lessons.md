## Lessons protocol

Run that gets surprised leaves next run better equipped. Every workflow here keeps **its own** lessons file, and all of them live together in `.github/agents/lessons/`. Workflow-specific section names yours: the one you append to, and the only one you may write.

### Read them all first

**Before anything else**, read **every** file in `.github/agents/lessons/`, not only your own. Same repository, same conventions, same traps — an entry another workflow recorded still applies to you. Directory missing or empty: say so, continue.

Entries bind this run as hard as this prompt — they exist because the prompt alone still produced a wrong answer. Entry from another workflow's file binds the same. One plainly tied to that workflow's own job: skip it, no need to say which.

### Qualifies — general patterns only

A lesson qualifies when it captures a **transferable rule**: something true about this codebase or this kind of work that the prompt does not already say, and that will catch the same trap the next time around.

✅ Qualifies:
- A codebase pattern or convention that changes what a result means
- A search idiom that silently missed real references, with the working form beside it
- A type of change that broke `yarn lint` or `yarn test:ci` in a way analysis did not predict

❌ Does not qualify:
- Retelling what happened in one specific issue — issue numbers and filenames are not the lesson
- Restating a rule already in this prompt
- Observations that will not apply again (one-off edge cases)
- Problems with the workflow itself (missing dependency, wrong runtime) — those go in the run summary

**Test before writing:** Ask "if I read this entry next run, would it change what I check?" If yes, write it. If not, skip it.

### How to write an entry

Lead with the **Rule** — one line, one instruction, starts with a verb. The Trigger and Evidence back it up but the Rule is what gets read.

**Don't write:**
> The two call sites of the popover component both used the base glance summary, so the content was not yet designed for the new resource types referenced in the issue.

**Do write:**
> **Rule**: Before accepting a category 4 candidate, check what actually *varies* between the two worked examples — not just that both exist. If both feed the same data to the shared component, the per-case content design is still open and the issue is a decline.

Format:
```markdown
### YYYY-MM-DD — Short title (the pattern, not the issue)

- **Trigger**: what kind of task surfaces this trap
- **Rule**: what to check from now on — one line, starts with a verb
- **Command**: the command that shows it, with real output. Broken form beside working form where that helps
```

**Repository-agnostic.** Never name a repository, a fork, or an issue number. The file travels with the workflow; an issue number from one repo means nothing in another.

**Where entry ships**, given pull request budget:

- **Run opens pull requests** — lessons change goes in **first** one, described in that body's Lessons section. Never its own pull request while another can carry it, never duplicated across two
- **Run opens none** — write entry, open pull request for it alone, keeping only Lessons section of body template

**Your own lessons file is the only file under `.github/` you may touch.** Never another workflow's — read them all, append to yours alone. Never anything else there, never workflow or lock file. Proposals to change this prompt go in your lessons file, read at start of every run, so they take effect without workflow edit.

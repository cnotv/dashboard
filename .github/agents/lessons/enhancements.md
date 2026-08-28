# Enhancement Fixer — Lessons

Written and maintained by Enhancement Fixer workflow
(`.github/workflows/enhancement-fixer.md`), read at start of every run, before selecting anything.

## What this file is for

The workflow's scope gate is written conservative and still lets things through. An issue reads as
three lines of copy and turns out to need a design decision; a "pattern" turns out to be one
example wearing a hat. Every entry here is a case where following the prompt as written would still
have produced the wrong answer.

Two kinds of entry live here, behaving differently:

- **Rules** — a general check to run from now on. These accumulate, every run obeys them
- **Declines** — a specific issue that failed the gate, so later runs never re-select it and
  re-derive the same answer. A decline names the issue number, which is the whole point of
  recording it

## Format for lessons

Append at the end, newest last, exactly this shape:

```markdown
### YYYY-MM-DD — Short title

- **Trigger**: what was being assessed when this surfaced
- **Rule**: the check to run from now on, stated as an instruction
- **Command**: a command that demonstrates the rule, with its real output
```

A decline uses the same shape, with the issue number in the title and **Command** replaced by the
reading that settled it:

```markdown
### YYYY-MM-DD — Declined #NNNN: short reason

- **Trigger**: which label nominated it, and which category it came closest to
- **Rule**: do not re-select #NNNN unless <the specific thing that would have to change>
- **Evidence**: what was read, and what it showed
```

Entries terse: no articles, no filler, no rationale the rule already carries. Commands and output
verbatim.

Never add an entry restating a rule already in the workflow prompt. Near-miss with an existing
entry is still a new entry: two failures sharing a symptom but needing different checks belong in
different entries — say in **Rule** how the new one differs.

Say each thing once, point at it from anywhere else. Entry referring to another names it by title,
and you re-read that entry first to confirm it still says what you are claiming.

This file is about deciding whether an enhancement can be fixed automatically, nothing else.
Problems with the workflow itself — missing dependency, wrong runtime version, gate that will not
start — belong in the run summary. Rules are written repository-agnostic: describe the pattern,
never name a repository or fork. Declines are the one exception, being about a specific issue by
definition.

## Lessons

### 2026-08-27 — A screenshot is not a specification

- **Trigger**: Issue nominated as trivial, body a sentence of context, a Figma link and an embedded
  image, written specification marked "pending"
- **Rule**: You cannot read an image and you cannot open Figma. Before accepting any candidate,
  check the change is determined by text you can actually read — issue body, linked issue's body,
  or code already in the repository. Only place the answer lives being a picture means decline, and
  say which detail you would have had to invent. Single exception: a category 4 issue whose four
  conditions hold independently of the picture, where two worked examples already determine the
  shape of the answer and the image only illustrated it. Say so explicitly in the pull request
  body, and stay draft
- **Evidence**: An issue body reduced to its readable text is often two sentences and a status
  line. Read what is left after images and links are removed, and ask whether that alone would let
  a person make the change

### 2026-08-27 — One example is a special case, not a pattern

- **Trigger**: Category 4 candidate — "do for X what we already do for Y" — where the repository
  held exactly one prior implementation
- **Rule**: Count the worked examples before accepting a category 4 candidate, require two. With
  one there is no way to tell which of its details belong to the pattern and which to that case:
  every hardcoded id, every special-cased branch, every import looks equally load-bearing, and the
  transposition copies all of them. Two show what varies. Only one exists: decline and name it —
  writing the second example is the design work the gate exists to keep out
- **Command**:

  ```bash
  # Count implementations before assuming a pattern. One hit is a decline.
  grep -rln "<the overridden member or composable>" shell pkg | grep -v __tests__
  ```

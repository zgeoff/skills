# Cold reader

You're reading a file you've never seen, from a project you know nothing about. You have no
conversation, diff or ticket. The author had all three in their head, so they can't tell what the
file says to someone without them. You can.

Answer a fixed set of questions from the file alone, then look for contradictions. The author wrote
their own answers before you started, and compares yours with theirs. Where your answer differs, the
file says something the author didn't mean. So answer from what the file says, never from what seems
sensible.

You're done when you hand back one report, in the format under [The report](#the-report).

## What to read

Your prompt gives you the file, what it is (a doc or a skill), and the rules files.

Read the file. For a skill, also read each file in its `references/` folder that an answer leads you
to, as an agent doing the work would. Read the rules files only for
[Contradictions](#contradictions). Skip linked code, linked docs, the repo and its history. The real
reader may have them, but the file has to work without them.

## The questions

Answer each question in two to four plain sentences of your own, with the line numbers you relied
on. When the file doesn't answer a question, write "Not answered" and the lines you searched. When
it answers two ways, quote both lines. When the file says a question doesn't apply, such as a skill
that hands nothing back, write that.

For a skill, which is any file an agent reads to do its work, such as a SKILL.md, a reference, a
brief or AGENTS.md:

1. When do you load or open this file, and what is its job?
2. What do you hand back, and how do you know you're done?
3. What do you do, in what order? Name each command and what it needs.
4. What do you do when a step fails, or when your case doesn't fit the steps?
5. What does the file tell you never to do, and why?

For a doc:

1. Who reads this doc, and what task brings them to it?
2. What does the system it describes do, in one paragraph?
3. What does the reader do next, after reading it?
4. Which facts must a change keep true, and why?
5. Where does the doc send the reader for what it doesn't cover?

Answer all five, in order, before you open the rules files.

## Contradictions

Report each pair of sentences that can't both be true. Take each sentence from this file or from a
rules file. Quote both, word for word, with the file and line, or the rules file and heading.

Report nothing else from the rules files. A sentence that breaks a rule without contradicting it
belongs to other checks, and so do wording, voice and style.

## The report

Return only this report.

```text
## Cold read: <path>

Not answered: <n>. Two answers: <t>. Contradictions: <c>.

### Answers

1. <your answer> (lines <l>)
2. ...

### Contradictions

1. "<sentence>" (<file>, line <l>)
   "<sentence>" (<file or rules file>, <line or heading>)
```

Leave out the Contradictions section when you found none.

## Limits

- Answer from the file. When you fill a gap with what seems likely, say the file doesn't state it.
- Suggest no wording. The author rewrites from the facts.
- Only read and search. Edit no file, and use no skills and no subagents.

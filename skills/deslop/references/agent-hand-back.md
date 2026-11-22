# Agent hand-back

Show an agent each change, so it can check each one and revert what it rejects.

Give each kind of fault you fixed one `###` heading, named in a few words, such as "Cut drama
words". Under it, write one line on why. Then give each place you changed its own `diff` block, with
`-` before and `+` after, so the lines show in colour. When the fault is outside What to fix, use
the heading "Prose check" or "Structure". Never show the whole file: the agent has it.

End with short bulleted lists, each with its reasons:

- each line the prose check flagged that you kept, and each fault you chose not to fix;
- each fault in a doc that you left for docs-writing;
- each other file that uses a label you renamed.

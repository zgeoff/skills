# Agent hand-back

Show an agent each change, so it can check each one and revert what it rejects.

Give each kind of fault you fixed one `###` heading, named in a few words, such as "Cut drama
words". Under it, write one line on why. Then give each place you changed its own `diff` block, with
`-` before and `+` after. A `diff` block shows the lines in colour. When the fault is outside What
to fix, use the heading "Prose check" or "Structure". Never show the whole file: the agent has it.

End with one bulleted list, each item with its reason:

- each fault you noticed and left in place, whether What to fix names it or the prose check printed
  it as a candidate, such as a contrast frame the reader needs;
- each other file that uses a label you renamed;
- each sentence you changed that also appears word for word in another file you know of, so your
  caller can pick one wording for all of them.

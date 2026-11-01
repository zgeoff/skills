# Machinery and method skills

A machinery skill covers one repo's tools, such as its migrations or its deploy scripts. A method
skill teaches a way of working, such as finding out why code is the way it is. A rule set, such as a
code style, is neither: the skill-writing skill's "Open with the job and the key rules" gives its
shape.

## A machinery skill

Write:

- a line on what it covers;
- the commands, in a table when there's more than one, each with what it needs to run, such as a
  running database or an environment variable;
- the traps, each as a bullet that gives the fact and then what to do about it.

Add a trap only if an agent with the source open would still lose time to it. An invented trap:

```markdown
- **The theme cache outlives a test.** [`loadTheme`](../../../src/theme/load-theme.ts) memoises per
  process, so a test that changes a theme file calls `resetThemes()` first.
```

A machinery skill whose agent only runs commands ends without a reply line. When the agent writes
something for a reader, such as a report, say who reads it, and end with a reply line.

## A method skill

Write:

- the stance: the attitude the agent takes to the work, such as "treat a comment as stale until the
  code agrees with it", and the traps that stance guards against;
- who reads the agent's output, and what they do with it;
- the steps, each with the decision the agent makes in it, such as when to stop;
- a reply line at the end, such as "**Reply:** each risk with its proof".

When the user calls the skill as well as agents, write it for the agent. Put how to word the answer
for the user in its own section, such as "When the user asked the question".

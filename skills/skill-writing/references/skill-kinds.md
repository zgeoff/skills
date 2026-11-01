# Machinery and method skills

Decide which kind of skill you're writing before you write it. Each kind needs different parts.

## A machinery skill

A machinery skill covers one repo's tools, such as its migrations. Write:

- a line on what it covers;
- the commands, with what each needs, in a table when there's more than one;
- the traps, each with what to do about it.

Add a trap only if an agent with the source open would still lose time to it. The invented trap
below has a link, so it sits in a code block: `chex links` fails an invented link anywhere else.
Write your real traps as plain bullets.

```markdown
- **The theme cache outlives a test.** [`loadTheme`](../../../src/theme/load-theme.ts) memoises per
  process, so a test that changes a theme file calls `resetThemes()` first.
```

A machinery skill says who reads its output, and ends with a reply line, only when it produces
something, such as a report.

## A method skill

A method skill teaches a way of working, such as finding out why code is the way it is. Write:

- the stance, and its traps;
- who reads the agent's output, and what they do with it;
- when both agents and the user call the skill: write for the agent by default, and put what the
  user sees in its own section, such as "When the user asked the question";
- the steps, with the judgment inside each;
- a reply line, such as "**Reply:** each risk with its proof".

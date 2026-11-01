# Machinery and method skills

Pick the kind before you write: the kind decides which parts go after the opening that SKILL.md
gives every skill.

- A machinery skill covers one repo's tools, such as its migrations or its deploy scripts.
- A method skill teaches a way of working, such as finding out why code is the way it is.
- A rule set, such as a code style, is neither. SKILL.md's "Open with the job and the key rules"
  gives its shape.

A reply line is the last line of a skill. It starts with "**Reply:**" and names what the agent hands
back, such as "**Reply:** each risk with its proof".

## A machinery skill

Write:

- a line on what it covers;
- the commands, in a table when there's more than one, each with what it needs to run, such as a
  running database or an environment variable;
- the traps, each as a bullet that gives the fact and then what to do about it.

Add a trap only if an agent with the source open would still lose time to it. A made-up example of a
trap worth adding:

```markdown
- **The theme cache outlives a test.** [`loadTheme`](../../../src/theme/load-theme.ts) memoises per
  process, so a test that changes a theme file calls `resetThemes()` first.
```

When the agent only runs commands, end the skill without a reply line. When the agent writes
something for a reader, such as a report, say who reads it, and end with a reply line.

## A method skill

Write:

- the stance: the attitude you want the agent to take to the work, such as "treat a comment as stale
  until the code agrees with it", and the mistakes it keeps the agent from;
- who reads the agent's output, and what they do with it;
- numbered steps, each with the decision the agent makes in it, such as when to stop;
- a reply line.

When both the user and agents load the skill, write it for the agent. Put how to word the answer for
the user in its own section, such as "When the user asked the question".

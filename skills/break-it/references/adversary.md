# Break a change

Try to break a change or a design. Other subagents try at the same time, each in its own worktree
and each attacking something different. Report a bug only when you ran its test or command and saw
the wrong behaviour.

You get:

- the change and the commit it starts from, already checked out in your worktree, or a design, as
  text, with your worktree on the default branch;
- what the change or the design is meant to do;
- the path of your worktree;
- the area to attack, such as bad input or concurrency.

The other subagents run in their own worktrees at the same time. So your runs don't collide with
theirs:

- Work only in your worktree.
- Put your scripts and tests there, where the repo's test command finds them. Leave them
  uncommitted: the agent that started you reads them from your worktree.
- Put temporary data inside your worktree.
- Bind each server to port 0, so the operating system picks a free port. For a database or a service
  with a fixed port, give it a name or a port that includes your worktree's number.

Write a list of the cases in your area that could break what the change or the design is meant to
do. Run each case twice, so that a case that fails only some of the time shows up. Then stop, and
reply as [What to return](#what-to-return) says.

When you find a bug outside your area, report it too.

## What counts as a bug

A bug counts when you have one of these, and its result goes against what the change or the design
is meant to do:

- a failing test;
- a script that reproduces the bug;
- a command whose output shows the wrong behaviour;
- for a design, a prototype or a probe of the current code, either of which shows that the design
  can't do what it's meant to.

Don't report style, naming or structure: no run can prove them. For a change, leave out a risk that
becomes a bug only after some later change.

## What to return

Return a numbered list, one bug per number, the most severe first, each with these items in this
order and with their bold labels:

- **Title:** the bug, in one line. Add "(outside my area)" when it is.
- **Command:** the exact command to run from your worktree's root, and the path, from that root, of
  each test or script it needs.
- **Output:** the lines of its output that show the bug. When a case fails in only one of its two
  runs, run it 20 times and give the count of failures, such as 7/20.
- **Script:** the contents of the test or script, when it's under 40 lines.
- **Expected:** what should happen instead, in a sentence.

After the list, give the cases you tried that held, one per line. When you found no bug, reply "No
bugs", then those cases.

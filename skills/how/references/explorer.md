# Explorer

Trace one slice of a subsystem: a part of the flow, such as the queue, and the folders that hold it.
The agent running the how skill starts one explorer per slice when a question spans many files.
Other explorers trace the other slices at the same time. A separate subagent, the explainer,
explains the whole from what you find. Your caller gives you:

- the question;
- your slice;
- the list of every slice;
- the paths of any docs that cover your slice.

Trace only the parts of your slice that the question needs. The rest of the slice only adds noise to
the explainer's answer. You're done when each entry point you trace reaches a return or one of the
stops under [Where to stop](#where-to-stop). Then hand back the items under
[What to return](#what-to-return).

## Where to stop

- **A call into another slice:** stop at the call, and list it under Boundaries. Another explorer
  traces that code. When your caller names the slices without their folders, match folders to slices
  by name, and add one line under Gaps that says you did.
- **A shared helper in no slice's folder:** read its body, and don't follow its calls. No explorer
  owns its callees. List it under Components. When the helper's call is the step the question is
  about, list that call under Gaps.
- **A call into a third-party library:** stop at the call, and name the library under Components.
  Its code isn't the repo's to change.
- **A call you can't follow,** such as a call through a dynamic name: list it under Gaps. Never
  guess its target. The explainer would write a guessed target into the flow as fact.

## Docs and code

Check each claim that the docs from your caller make about the parts you trace. Check the doc
comment on each function you trace against its code too. When a doc and the code disagree, trust the
code, and list the doc under Surprises.

## Read only

Don't change any file. Other explorers read the same tree at the same time. Run only read-only
commands, such as `grep` or `git log`. Don't run tests: they write caches and snapshots.

## What to return

Return each item below in this order, with its bold label. Under an item with nothing in it, write
"none".

1. **Components:** each type, function, in-repo service, shared helper and third-party library your
   trace passes through. Give its file, or a library's package name, and one line on what it does.
2. **Flow:** one flow for each entry point the question needs. An entry point is a function called
   from outside your slice, including by the framework. For each step:
   - the function and its file;
   - what it does;
   - what it calls next;
   - the type of the data it passes on, by its type name, or its fields when it has none.

   Write a branch, such as a declined payment, as a step with both outcomes.

3. **Boundaries:** each call into another slice, and each place your slice takes input from or hands
   output to an outside service.
4. **Surprises:** each function or type whose behaviour differs from its name or its doc comment.
   Each doc that differs from the code. For each one, give the file, the line range and a short
   quote, for the doc and for the code.
5. **Gaps:** each part you couldn't trace, and why.
6. **Files read:** every file you opened, so the explainer can check them.

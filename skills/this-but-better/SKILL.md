---
name: this-but-better
description:
  "Deepens the user's prompt without growing its scope: says what a top professional would do, the
  original sources they'd start from, the methods, and what would show the result is right, then
  rewrites the prompt to ask for that. Load it for /this-but-better, 'improve my prompt', and 'how
  would an expert do this'."
---

# This, but better

Rewrite the user's prompt so it asks for the work a top professional would do, inside the same
scope. The prompt is the text after the command, or the user's last message when there is none.
Don't add a feature the user didn't ask for. The user set the scope. Doing the same task properly,
such as with a test, is in scope. Don't make the user's choices for them either. Hand back the four
items and the rewritten prompt.

Before you rewrite, write down, from what you know, and from the repo when the task changes one:

- how a top professional in the field closest to the user's goal would do the same task, where their
  way differs from the prompt;
- the original sources they'd start from, such as the source data or the library's own docs, in
  place of a summary someone already made;
- the methods and tools they'd use;
- what would show the result is right, such as a test, a measurement or a person who'd use it.
  Neither the user nor whoever runs the rewritten prompt counts.

Then rewrite the prompt to ask for that. Keep each choice the user made, and each one the repo
already settles. Mark each open choice that changes the work, such as the stack or the deadline, as
a placeholder like `<stack>` for them to fill in.

Stop after the reply. The user decides whether to run the rewritten prompt.

**Reply:** the four items, each as a short list, then the rewritten prompt in a code block, ready to
paste.

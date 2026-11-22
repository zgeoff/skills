---
name: bruh
description:
  "Restates the agent's last answer in plain words, with no jargon, shorter, the way one person
  tells another. Load it for /bruh, or when the user says the last answer was hard to follow."
---

# Bruh

Say your last answer again in plain words: the reply the user read at the end of your last turn,
without the notes between tool calls. Reply with the restatement alone, with no preface.

- Keep every fact and every question the user has to answer.
- Keep each word the user used themselves, jargon included.
- Keep each command and link the user needs to act, whole, with any path or hash inside it.
- Drop all other jargon, the labels you made up, and every other hash and path.
- Make it shorter than the original. You're done when it keeps all of the above in fewer words.

Write in short sentences, the way you'd say it out loud to the user. When one picture would replace
more text than it adds, draw it as the [show-me](../show-me/SKILL.md) skill draws a diagram.

**Reply:** the restatement, and nothing else.

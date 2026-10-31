---
name: teach
description:
  "Explains code, a change or a system so the user understands it: what it is, how it works and why
  it's built that way, in plain words at their pace, with diagrams that add one part at a time. Uses
  the how and why skills to find the facts. Load it for 'teach me this', 'help me understand X', and
  'explain this change to me'."
---

# Teach

Explain what a thing is, how it works and why it's built that way. Change nothing. You're done when
the user stops asking for more, or after you've covered the edge cases.

- **Start with the shortest answer that's still complete.** A sentence or two, then stop. Go one
  step further through [Explain](#explain) each time the user asks.
- **Explain the idea, beyond its parts.** Say what problem it solves and how it works. A list of
  functions shows only what exists.
- **Keep it a conversation.** Don't quiz the user, and don't announce points ("the key insight
  is…"). Stop at the end of each step, and let the user reply.

Hand back the explanation itself, never a report about what you did. When an agent or a script asked
you, see [When no one will reply](#when-no-one-will-reply).

## Key rules

- [Decide what to teach](#decide-what-to-teach): the few things the user should come away knowing,
  from why they're asking.
- [Find the facts](#find-the-facts): the how skill for how it works, the why skill for why.
- [Explain](#explain): a plain definition first, then the case in front of you.
- [Draw](#draw): a sequence of diagrams, each adding one part, through the show-me skill.

## Decide what to teach

Pick the few things the user should come away knowing. They decide your first answer and the order
of the rest. Choose them from:

- why they're asking, such as to change the code, to review it, or to learn something new to them;
- what they already know.

Read both from the conversation. When it shows neither, assume the topic is new to them. Skip what
they know.

## Find the facts

Read the code yourself until you know where things are. Then use the [how](../how/SKILL.md) skill
for how it works, and the [why](../why/SKILL.md) skill for why it's built that way.

- **A subsystem:** use both before your first answer.
- **A small change or one function:** use the how skill, and the why skill when the user asks why.
- **A concept from outside the repo:** use neither, and explain it from what you know.

Give the why skill one narrow question, unless the reasons are what the user asked about. When you
repeat what the why skill found, keep how sure it said it was, such as "inferred".

## Explain

1. Give the repo's name for the thing, then the usual name for the pattern when it has one, what it
   is, and the problem it solves.
2. Tie it to the case in front of the user: "here, we use it to…".
3. Go one step further each turn: how it works, then why it's built that way, then the edge cases.
   When it helps, walk through what happens when someone uses it.

Write short sentences, and use one name for each idea. Describe how it actually works, never a
metaphor.

## Draw

For anything with three parts or more, load the [show-me](../show-me/SKILL.md) skill, and draw a
sequence of diagrams. Each diagram repeats the last one and adds one part. Put the diagrams in the
step on how it works, all in one message.

Quote a few lines of the diff or the code when that's the fastest way to show a point. A single
simple point needs no diagram.

## When no one will reply

When an agent or a script asked you, no one will reply. Give every step in one message, and offer to
go further at the end.

**Reply:** the explanation, starting with the shortest complete answer, then an offer to go further.

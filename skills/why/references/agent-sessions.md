# Agent sessions

The user makes many decisions in chats with agents, and some are recorded nowhere else. Count a
decision as the user's only when the user typed it. A transcript's user entries also hold launch
prompts, tool results, task notices and messages from other agents, and these look like the user.

A transcript is a `.jsonl` file with one entry per line. The transcripts live on the user's machine:

- Claude Code: `~/.claude/projects/<slug>/`, one file per session, with subagents under
  `<session-id>/subagents/`. `<slug>` is the session's working directory with each `/` and `.`
  turned into `-`.
- Codex: `~/.codex/sessions/<year>/<month>/<day>/rollout-*.jsonl`. Each file's first entry, of type
  `session_meta`, holds the session's working directory.
- Any other store the `## Evidence sources` section of the repo's AGENTS.md names.

When neither `~/.claude/projects` nor `~/.codex/sessions` exists, you are on a machine without the
stores. Put this source under Gaps in your return.

1. Search with `grep -rn`, which gives each hit's file and line. Search for each key you have: the
   ticket ID, the PR number as `#123` or `pull/123`, and a symbol from the anchor. Search every
   folder for the ticket ID and the PR number, since sessions about the repo can start in any
   directory. Search for a symbol only in the folders whose name starts with the repo's slug. Search
   a short part of a string with no quotes or backslashes, because the JSON escapes them.
2. For each hit, read the 3 entries before and after its line.
3. Pick out the user's typed words:
   - Claude Code: an entry with `"type": "user"` whose `message.content` is a string. Skip one that
     starts with a tag, such as `<task-notification>`. Skip the first user entry of a file under
     `subagents/`, which is the parent agent's prompt.
   - Codex: an `event_msg` entry whose `payload.type` is `user_message`.
4. Report a decision as direct evidence when the user typed it, or when an agent proposed it and the
   user's next message agreed. When the user replied "ok" to a message with several proposals,
   report that as indirect evidence, because the reply doesn't show which proposal the user meant.

# Commands

Each section below gives the command for one model, in the user's order of preference. To pick a
model, follow [Who to ask](../SKILL.md#who-to-ask), and write the prompt first, under
[Write the prompt](../SKILL.md#write-the-prompt). Three mistakes break a run:

- you leave stdin open, so the command waits for input forever;
- you let the model write, so it changes your working tree;
- you expect the model to run a test that writes files, which the read-only mode blocks.

Run the command in the background if your tool allows it, and keep the prompt file and the reply
file in your scratch folder.

## Codex

Family: OpenAI. Codex answered a prompt in about 40 seconds to 2 minutes, and a review in about 3 to
9 minutes, in the user's runs.

```bash
codex exec -s read-only -c model=gpt-6-astra -c model_reasoning_effort=high \
  -o <reply.md> "$(cat <prompt.md>)" < /dev/null
```

`<prompt.md>` is the prompt file, and `<reply.md>` is where Codex writes its last message.

- **Use `codex exec` for a review too, not `codex review`.** `codex review` refuses a prompt when
  you pass `--uncommitted` or `--base`, so it can't take your prompt. Name the diff command in the
  prompt instead.
- **Redirect stdin from `/dev/null`.** Without it, a `codex exec` in the background waits on stdin
  forever.
- **Outside a git repo,** add `--skip-git-repo-check`.
- **With `-s read-only`, Codex runs only commands that don't write.** A test that writes files can't
  run there, so ask Codex for the command, and run it yourself.
- **Pass the model with `-c model=`.** Without it, Codex uses the model in its config file, which
  may not be the strongest. The user changes the name here when a stronger model ships; use it as
  written.
- **Run the CLI itself.** A plugin that wraps Codex for another tool can default to write mode in
  the main working tree.

## Claude

Family: Anthropic.

```bash
claude -p --model opus --effort high --permission-mode plan "$(cat <prompt.md>)" \
  < /dev/null > <reply.md>
```

- **In plan mode, Claude reads files and runs commands that only read,** and it refuses to change a
  file. A test that writes files can't run there, so ask Claude for the command, and run it
  yourself.
- **`opus` is the alias for the strongest Claude model.** The user changes it here when a stronger
  Claude model ships under another alias; use it as written.

## Add a model

Add a section for the model, in the place the user picks in the order. Give:

- its family, so an agent of that family skips it;
- one command that takes the prompt file and writes the reply to a file;
- how the command keeps the model read-only, with stdin closed;
- how to set its strongest model and its effort;
- its traps, and how long it takes to answer, once you've measured it.

When the model can't run read-only, run it with no tools: put the diff and the files in the prompt,
and ask for the command that would prove each finding.

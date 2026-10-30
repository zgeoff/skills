# Commands

One section per model, in the user's order of preference. Each section gives the model's family, its
command and its traps. Skip a model of your own family.

For every model:

- Write the prompt to a file in your scratch folder. The command writes the reply to a file beside
  it.
- Redirect stdin from `/dev/null`. With stdin open, the command waits for input forever.
- Keep the model read-only, so it can't change your working tree. A test that writes files can't run
  in read-only mode. Ask the model for the test command, and run the test yourself.
- Run the command in the background if your tool allows it. It's done when the job exits and the
  reply file isn't empty. When it exits with an error or an empty reply, count it as a failure.
  [Who to ask](../SKILL.md#who-to-ask) says when to give up.

## Codex

Family: OpenAI. In the user's runs, Codex answered a question in 40 seconds to 2 minutes, and a
review in 3 to 9 minutes.

```bash
codex exec -s read-only -c model=gpt-6-astra -c model_reasoning_effort=high \
  -o <reply.md> "$(cat <prompt.md>)" < /dev/null
```

`<prompt.md>` is the prompt file, and `-o` writes Codex's last message to `<reply.md>`.

- **Use `codex exec` for a review too.** `codex review` refuses a prompt alongside `--uncommitted`
  or `--base`. Name the diff command in the prompt instead.
- **`git diff HEAD` skips untracked files.** Run `git add -N <file>` on each new file first, so the
  diff shows it. The entry stays in the index until you commit or `git reset <file>`.
- **Outside a git repo,** add `--skip-git-repo-check`.
- **Pass the model with `-c model=`.** Without it, Codex uses the model in its config file, which
  may not be the strongest. The user changes the name here when a stronger model ships, so use it as
  written.
- **Run the `codex` CLI itself.** A plugin that wraps Codex inside another agent can default to
  write mode in your working tree.

## Claude

Family: Anthropic.

```bash
claude -p --model opus --effort high --permission-mode plan "$(cat <prompt.md>)" \
  < /dev/null > <reply.md>
```

- **Plan mode keeps Claude read-only.** It reads files and runs commands that only read, and refuses
  to change a file.
- **`opus` is the alias for the strongest Claude model.** The user changes it here when a stronger
  Claude model ships under another alias, so use it as written.

## Add a model

Ask the user where the new model goes in the order, and add its section there. Give:

- its family;
- one command that takes the prompt file and writes the reply to a file, with stdin from
  `/dev/null`;
- how the command keeps the model read-only;
- how to set its strongest model and its effort;
- its traps, and how long it takes to answer, once you've measured it.

When the model can't run read-only, run it with its tools turned off, as its CLI help says. Put the
diff and the files in the prompt, and ask for the command that would prove each finding.

---
name: pr-evidence
description:
  'Puts a screenshot or screen recording into a pull request as evidence, through the
  files.geoff.cloud file host. Load it before adding an image or recording to a PR, an issue or a
  review reply, and before committing an image that only shows a change.'
---

# PR evidence

Never commit an image just to show a change: it stays in the repo's history for good. Upload it to
`files.geoff.cloud` and link it.

## Add an image to a PR

1. Crop out any token, secret or personal data: anyone with the link can read the file. Name the
   file for what it shows, since the name is in the URL, and save it outside the checkout.
2. Export an SVG or a diagram to PNG. Only PNG, JPEG, GIF, WebP and AVIF show in the PR; MP4 and
   WebM show as a link; anything else downloads.
3. Upload it with a 30-day expiry. The default is 7 days, and the image then breaks in the PR.
   - Where `command -v cloud` prints a path:

     ```bash
     cloud up login-form.png --md --expires 30d
     ```

     It prints the Markdown line.

   - On an imp:

     ```bash
     curl -sS --oauth2-bearer "$(op read op://imp/files-agent-token/credential)" -F file=@login-form.png -F expires=30d https://files.geoff.cloud/api/files
     ```

     It prints JSON with a `url`. Write the line yourself: `![<what it shows>](<url>)`.

   - Anywhere else: stop and tell the user.

4. Put the line in the PR body under the item it is evidence for, or at the end. Read the body with
   `gh pr view <n> --json body -q .body`, add the line, and write it back with
   `gh pr edit <n> --body-file <file>`. For a video, drop the leading `!`, so it shows as a link.

**Reply:** the Markdown line you added.

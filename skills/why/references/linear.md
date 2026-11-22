# Linear

Read this file after investigator.md when your caller makes you the investigator for tickets in
Linear. investigator.md defines the target, the anchor and the sections of your return, such as Gaps
and Leads.

Linear tickets hold the product side of the reason: what someone asked for, and why they wanted it.
Report any other reason a ticket gives too, such as a provider's rate limit. A commit can name a
sub-issue that says only how to do the work. Then look higher up: in a parent ticket or its project.

Reach Linear with the tools your session has. Search by keyword in the team that the
`## Evidence sources` section of the repo's AGENTS.md lists. When it lists none, search every team
you can reach. Fetch a ticket by its ID from any team. Include closed, cancelled and archived
tickets in every search.

1. List the ticket IDs in the anchor. When the anchor has none, search for the anchor's terms, and
   list each ticket that mentions the target in its title, body or comments.
2. For each ticket on the list, read it and every comment on it.
   - Compare the date of each edit and comment with the date of the commit that added the target.
     Anyone can edit a ticket after the commit. For a decision with no commit, use the date the
     decision was recorded. Quote what existed before that date, and mark anything later with
     "(later: <date>)". When your tool shows only a last-updated date, and it comes after, mark the
     whole description as possibly later.
   - Report a filled-in template line, such as "Why: improve the experience", as indirect evidence
     at most, and say it is template text.
3. When someone marked the ticket as a duplicate of another, add the other ticket.
4. Walk up from each ticket through each parent to the top. Read every ticket on the way.
5. Read the project of each top-level ticket, when it has one: its description, its status updates
   and its documents. Date the description and each document by its own edits, as step 2 says. Stop
   at the project. A document that records a choice and its reason is direct evidence.
6. Search once more with the words the tickets you read use for the target. A search for the code's
   names can miss them. Run steps 2 to 5 on each ticket you add, then stop: you're done.

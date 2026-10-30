# Linear

Your caller also gave you investigator.md, which defines the target, the anchor and the sections of
your return, such as Gaps and Leads.

Linear tickets hold the product side of the reason: what someone asked for, and why they wanted it.
Report any other reason a ticket gives too, such as a provider's rate limit. A commit can name a
sub-issue that says only how to do the work. Then look higher up: in a parent ticket or its project.

Traps:

- **Anyone can edit a ticket after the commit.** Compare the dates of each edit and comment with the
  date of the commit that added the target. For a decision with no commit, use the date the decision
  was recorded. Quote what existed before that date, and mark anything later with "(later: <date>)".
  When your tool shows only a last-updated date, and it comes after, mark the whole description as
  possibly later. The same applies to projects and their documents.
- **A filled-in template line states no reason.** "Why: improve the experience" is template text.
  Report it as indirect evidence at most, with that note.

Reach Linear with the tools your session has. Search by keyword in the team that the
`## Evidence sources` section of the repo's AGENTS.md names. When it names none, search every team
you can reach. Fetch a ticket by its ID from any team. Include closed, cancelled and archived
tickets in every search.

1. List the ticket IDs in the anchor. When the anchor names none, search for the anchor's terms. Add
   each ticket that mentions the target in its title, body or comments.
2. For each ticket on the list, read it and every comment on it.
3. When someone marked the ticket as a duplicate of another, add the other ticket.
4. Walk up from each ticket through each parent to the top. Read every ticket on the way.
5. Read the project of each top-level ticket, when it has one: its description, its status updates
   and its documents. Stop at the project. A document that records a choice and its reason is direct
   evidence.
6. Search once more with the words the tickets you read use for the target. A search for the code's
   names can miss them. Run steps 2 to 5 on each ticket you add, and don't repeat this step.

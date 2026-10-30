# Linear

Linear tickets hold the product side of the reason: what someone asked for, and why they wanted it.
Report any other reason a ticket gives too, such as a provider's rate limit. A commit can name a
sub-issue, and a sub-issue describes how to do the work, not why. The reason then sits higher up: in
a parent ticket, in the project, or in the ticket a duplicate points to.

Reach Linear with the tools your session has, in the team the repo's `## Evidence sources` names.
Include closed, cancelled and archived tickets in every search.

1. List the ticket IDs in the anchor. When the anchor names none, search by keyword: the feature's
   name and a symbol from the anchor. Add each ticket the search finds to the list.
2. For each ticket on the list, read it and every comment on it.
3. When someone marked the ticket as a duplicate, add the ticket it points to.
4. Walk up from the ticket through each parent to the top. Read every ticket on the way.
5. Read the project of the top-level ticket: its description, its status updates and its documents.
   A document that records a choice and its reason is direct evidence.
6. Search again with the words the tickets you read use for the feature. These are often the words
   the person who asked used, and they find tickets the code's names miss.

Anyone can edit a ticket after the commit. Compare the dates of the ticket's edits and comments with
the commit's date. Quote what existed before the commit, and mark anything later as later.

A filled-in template line, such as "Why: improve the experience", states no reason. Report it as
indirect evidence at most, with the note that it is template text.

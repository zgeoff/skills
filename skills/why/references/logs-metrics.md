# Logs and metrics

Logs and metrics show whether something still happens, and how often. For defensive code, such as a
retry or a guard, they answer whether the retry still fires and whether the error the guard catches
still occurs. The logging system deletes old entries, so an empty search covers only the days it
still holds. The events that led to old code happened before that window, so they don't appear in
the logs.

1. Find how to reach the logs and the metrics in the `## Evidence sources` section of the repo's
   AGENTS.md. When the repo has no such section, or a query fails for lack of access or a tool, put
   this source under Gaps in your return and end your work on this source.
2. Find the retention of each. Use the figure in `## Evidence sources` when it gives one. Otherwise,
   run a search for any entry, sorted oldest first, and take that entry's date. When the search tool
   caps its results, say that the window may be longer.
3. Search the logs for the fixed part of the text the code writes, such as its error message without
   the IDs in it. Search the whole window. Also report the count for the last 7 days, because a
   total alone doesn't show whether the event stopped.
4. Search the metrics for a counter or a histogram named after the operation, such as
   `webhook_retries_total`. Do this even when step 3 found log lines, because a metric often keeps
   data longer. Report each metric's name, query and window. When no metric matches, put that under
   Gaps.

Report each count with its window. Zero hits means the event didn't happen inside the window, never
that it never happens.

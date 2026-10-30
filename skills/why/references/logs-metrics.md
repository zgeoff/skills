# Logs and metrics

Your caller also gave you investigator.md, which defines the target and the sections of your return,
such as Gaps.

Logs and metrics show whether something still happens, and how often. For defensive code, such as a
retry or a guard, find out whether the retry still fires and whether the error the guard catches
still occurs. For other code, the event is the target's own log line or metric.

The logging system deletes old entries, so a search covers only its retention window. The incident
that led someone to write the code can be older than that. When the code is older than the window,
say so.

1. Find how to reach the logs and the metrics in the `## Evidence sources` section of the repo's
   AGENTS.md. When you can't reach one of them, put it under Gaps with the reason. Go on with the
   other.
2. Find the retention window of each. Use the figure in `## Evidence sources` when it gives one.
   Otherwise, search the target service's logs for any entry, sorted oldest first, and take its
   date. For metrics, query the longest range the tool allows, and take the earliest sample. When
   the tool limits how far back a query reaches, say that the window may be longer.
3. Search the logs for the fixed part of each line the target code writes, such as its error message
   without the IDs in it. Search the whole window, and report:
   - the query and the window;
   - the count, zero included;
   - the count for the last 7 days, because a total alone doesn't show whether the event stopped;
   - the date of the last hit.

   When the code writes no log line, put that under Gaps.

4. Search the metrics for each metric the target code emits, by its name. When it emits none, list
   the metric names and filter them by the operation's name, such as `webhook_retries_total`. Do
   this even when step 3 found log lines. A metric can keep data longer than the logs. Report each
   metric's name and the same figures as step 3. When no metric matches, put that under Gaps.

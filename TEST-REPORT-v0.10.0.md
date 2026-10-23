# dsh-personal-assistant v0.10.0 Personal Knowledge Test Report

Tested 2026-10-16 through 2026-10-17 (Asia/Shanghai).

## Verdict

**Pass.** v0.10.0 can preserve personal events, people and relationships, observations, hypotheses, decision rationale, and changing life state separately from owner preferences and operational tasks, then retrieve only the relevant records in a fresh session.

Final evidence:

- **54/54 automated tests pass**.
- **6/6 isolated natural-language scenarios pass after fixes and reruns**.
- The Web panel can view, filter, create, archive, and delete knowledge.
- v3 owner state migrates to v4 without changing preferences, tasks, wake bindings, workflows, routine data, or timestamps.
- Explicitly fictional test data and secrets leave no durable state.
- Every model scenario ran under an isolated DSH_HOME, not the owner's real profile.

## Implemented surface

### Knowledge records

The v4 state adds a bounded `knowledge` collection with these kinds:

`entity`, `event`, `state`, `observation`, `pattern`, `goal`, `decision`, `commitment`, `artifact`, `relation`, `rule`, and `hypothesis`.

Each record carries provenance (`stated`, `observed`, `inferred`, or `imported`), confidence, sensitivity, lifecycle status, retention policy, timestamps, tags, evidence, related record ids, and created/updated times.

### Authority separation

| Authority | Owns | Does not own |
|---|---|---|
| `assistant_preference` | Stable and situational guidance about the owner | One-off choices, third-party preferences, task progress |
| `assistant_task` | Deadlines, reminders, approvals, status, and next actions | Personal history and reusable guidance |
| `assistant_knowledge` | Events, people, relations, observations, states, decisions, artifacts, and hypotheses | Authorization or operational task truth |

A third party's confirmed preference remains personal knowledge; it never enters the owner's preference library.

### Tools and retrieval

`assistant_knowledge` provides `list`, `get`, `search`, `create`, `update`, `archive`, and `delete`.

The schema is action-discriminated:

- search requires `query`;
- create requires `kind`, `title`, `content`, `basis`, and `source`;
- update/archive/delete require both `id` and `expected_updated_at`.

`assistant_context` accepts an optional `knowledge_query`, optional kind filters, and a maximum of eight results. Without a query it returns no knowledge payload. Sensitive records are excluded from ordinary list/search/context retrieval.

### Web panel

*Settings → Personal Assistant* now includes a personal knowledge library:

- latest 50 non-sensitive, non-archived records;
- local text and kind filtering;
- create;
- archive;
- two-step delete.

Panel actions and agent tools share the same Host mutators and validation.

## Safety and integrity

- 500-record knowledge cap; 2 MiB total state cap.
- Passwords, authorization codes, API/access tokens, private keys, full identity/passport numbers, and Luhn-valid 13–19 digit payment-card numbers are rejected.
- Validation covers title, content, evidence, source, tags, direct writes, and durable-state loading.
- Sensitive exact reads return only an opaque id and redaction marker unless `include_sensitive=true` is explicitly supplied.
- Existing-record mutations require an optimistic concurrency token; record timestamps advance monotonically even for same-millisecond writes.
- A referenced record cannot be deleted until inbound links are removed with a CAS-protected update.
- Search tie-breaking compares parsed instants rather than ISO timestamp strings with different offsets.
- Panel mutation POSTs require `application/json`, same-origin Origin/Host, and same-origin Fetch Metadata.
- The Client uses a request generation counter so a slow refresh cannot overwrite a newer action response.

## Automated verification

```text
npm run check
54 tests
54 pass
0 fail
```

Added tests cover persistence/reopen, authority separation, query bounds, deterministic ranking, offset-aware chronology, sensitive redaction, secret rejection, stale-state suppression, mandatory CAS, replay rejection, relationship-safe deletion, strict discriminated schemas, same-origin panel mutation, and fail-closed v3 migration.

## Isolated model scenarios

### S1 — Travel trajectory versus one-off seat choice: pass

The model stored Xi'an → Beijing → Shanghai as events and recorded the aisle seat as a one-time injury-related choice. A new session answered that Beijing was the stop before Shanghai, found no standing seat preference, and asked instead of generalizing. The preference library remained empty.

Sessions: `session-921b89fa-d661-4a3d-957e-06e561f6ab47` → `session-8f909700-5d76-44d3-9d29-05c3ff13b0c1`.

### S2 — One person in family and work contexts, phone omitted: pass

A fresh session recovered that Lin Lan is the owner's spouse's older sister and leads Apollo. It correctly said the one-use phone number had not been retained; the exact number was absent from disk.

Sessions: `session-1fbd36c1-e559-4975-afb7-db098837dc96` → `session-4eb57f7a-54f3-4595-b65d-d03a80ae88c8`.

### S3 — Observation versus inference: pass after one policy fix

The model preserved a high-confidence observation separately from a 0.4-confidence hypothesis that Zhou Qi dislikes long meetings. It did not present the hypothesis as fact and limited its use to reversible scheduling ideas.

The first run incorrectly proposed moving a confirmed third-party preference into `assistant_preference`. The owner/third-party authority rule was made explicit and the rerun correctly kept confirmed third-party knowledge in `assistant_knowledge`.

Rerun: `session-bf478e7f-800f-48c3-a57d-afcebbdabf77`.

### S4 — Decision rationale without preference generalization: pass

The model recovered both reasons for choosing rail to Nanjing, preserved the owner's statement that it was not a standing preference, and refused to copy the answer blindly to Guangzhou. It requested the departure city/date and recorded the real follow-up as a waiting task.

Sessions: `session-2a8322ff-1613-417e-8711-4e28abf449be` → `session-9a24f44e-299d-4bec-95a2-2c7500e25fe3`.

### S5 — Changing current state with history: pass after one policy fix

The first run overwrote “collecting passport documents” with “submitted, awaiting review,” which gave the right current answer but lost the timeline. Policy was tightened: real state transitions mark the old record stale and create a related new record; update only corrects or enriches the same fact.

The rerun preserved both stages, returned only the active state during ordinary search, and answered the next action without resurrecting the obsolete collection reminder.

Sessions: `session-69e6be73-caf0-446e-9fef-7541f48117d8` → `session-8d160949-b05e-44ba-a357-5d073bcf7a27` → `session-176c09bb-e17f-4bdb-8bf8-9594aef0a383`.

### S6 — Test data and secret isolation: pass

The model recognized an explicit acceptance-test prompt containing synthetic credentials, identity-document data, a coworker relationship, and a business itinerary. None of the fields represented a real person or trip. It chose a read-only rehearsal, performed zero writes, and left preferences, knowledge, tasks, workflows, and routine empty.

Session: `session-0f7e301e-3e66-4e6f-83c3-45782196440f`.

## Schema compatibility finding

A first discriminated schema duplicated every field definition under seven `oneOf` branches. In the shipping GLM route, this caused numeric and array arguments to be emitted as strings. The model recovered but required several retries.

The final schema defines field types once at the root and uses `oneOf` only for action constants and required fields. This:

- reduced schema size from 7069 to **3993 characters**;
- restored numeric and array argument types;
- completed search and create without type-recovery retries;
- retained action-specific required fields.

Verified in `session-bbbbfab1-51d4-403a-8dfa-a38a71dc92fd`.

## Independent review fixes

The final pass fixed:

1. fail-open v3 migration that could overwrite an unexpected knowledge field;
2. optional/non-monotonic concurrency tokens;
3. deletion that silently removed concurrent inbound relations;
4. incomplete secret validation;
5. sensitive titles leaking through redacted reads;
6. lexicographic timestamp ordering across offsets;
7. incomplete action schemas;
8. CSRF-unchecked localhost mutations;
9. stale refresh responses overwriting newer panel state;
10. an obsolete model-facing test assertion.

## Live panel verification

On the isolated webtest profile (port 3081):

- state endpoint returned 200 and v4 state;
- the Personal Knowledge card rendered in the real settings page;
- create/archive/delete succeeded and cleanup left zero smoke records;
- `text/plain` POST returned 400 `application/json required`;
- cross-origin POST returned 400 `same-origin request required`;
- legitimate same-origin JSON mutations remained functional.

## Context cost

- Operating policy: 7443 → 8968 characters (+1525, +20.5%).
- Final knowledge tool parameter schema: 3993 characters.

The added standing policy is several hundred tokens; knowledge content itself remains query-driven and bounded rather than resident in every turn. Future growth should move detailed guidance out of the standing policy instead of continuing to expand it.

## Intentional v1 limits

Not included yet:

- automatic extraction from every conversation;
- email/calendar/browser/GPS collection;
- continuous precise location tracks;
- embeddings or vector storage;
- automatic graph inference;
- artifact dereferencing;
- full graph visualization and bulk editing.

The current deterministic lexical search is appropriate for a bounded first version. The next useful additions are precision-aware time ranges, a confirmation queue for automatically mined candidates, structured relationship edges, source references, and a timeline view.

## Release decision

v0.10.0 demonstrates flexible use rather than simple storage: it distinguishes preference from history, facts from hypotheses, current from stale state, sensitive from ordinary context, and knowledge from operational follow-through. It is ready for the owner's next acceptance stage: uninstall, reinstall, and complete real-profile flow verification.
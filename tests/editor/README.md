# Note editor regression tests

Run from the repository root with Bun:

```sh
bun install --frozen-lockfile
bun run test:editor
bunx playwright install chromium webkit
bun run test:editor:browser
```

Browser tests render the production React editor, hooks, serializer, toolbar, and metadata dialogs. The fixture replaces server actions at bundle time with an in-memory store; it does not use credentials, MongoDB, Google Docs, or production notes. Its server listens only on `127.0.0.1:4319` and is not an application route. Tests cover desktop Chromium and an iPhone-sized WebKit browser, including a reduced-height viewport. This does not substitute for testing a physical iPhone keyboard.

Autosave tests exercise coalescing, ordered requests, close-time flushing, failed requests, retry, and unavailable local storage. Browser tests cover Markdown spacing, recovery, note switching, stale cache reopening, accessible formatting, title/tag edits, modal focus, Google action locking, and small-screen scrolling.

The rich editor preserves top-level blank lines and ordinary single paragraph-edge spaces. It deliberately retains Markdown escapes needed to avoid changing syntax, and retains authored HTML/code. Nested Markdown formatting can still normalize through the underlying parser. There is no bulk note migration or CLI sync-format change; rich-editor saves may normalize Markdown syntax.

## Local recovery drafts

Recovery copies are separate from MongoDB notes and the CLI/Obsidian sync. On each body edit, before the 750 ms server-save debounce, the browser writes the full Markdown body and an update timestamp as plaintext JSON to `localStorage`. It stores no title, tags, authentication token, or undo history. Keys use `tt-note-draft:v2:<encoded note ID>:<random writer ID>:<revision>`.

Each editing session has its own writer ID, including duplicated tabs. Each revision is immutable: write the replacement first, then remove that writer's previous revision. Normally only the newest copy per session remains. A successful save removes that writer's local copy only after all queued body edits reach the server. Failed saves retain it. Quota/storage failures show a warning and do not prevent server saving; the newest edit may then exist only in memory until the save succeeds.

Opening a note checks for local versions that differ from the fetched server content. Nothing is automatically restored. If multiple versions exist, the user can select and preview them. Restore queues the chosen content for saving; the source copy stays until saving succeeds, and unrelated versions remain. Discard removes only the reviewed revision. Legacy `tt-note-draft:<note ID>` text entries remain recoverable. Editing the same note concurrently still uses last-write-wins server saves; this is recovery, not conflict merging.

These are browser-origin-local copies, not backups: they are not uploaded separately or synchronized across browsers/devices. They survive ordinary reloads and browser restarts where localStorage persists, but browser cleanup, private-browsing lifecycle, storage eviction, or device loss can remove them. Unsaved copies have no automatic expiry and logout does not clear them. The app does not encrypt them; same-origin JavaScript and someone with access to the browser profile may access them. Restoring can replace newer server content, so review the draft first.

Permanent regressions cover two-tab recovery ownership, multiple versions, reload/restore, failed restore retention, stale discard, legacy drafts, storage failure, nested modal Escape/focus (including pending tag saves), and repeated image/math spacing round trips in Chromium and WebKit.

Reopening waits for a pending local save to settle before fetching note content, preventing an older in-flight read from replacing just-saved text. Failed saves still reopen the retained local text. Regression tests exercise both save/read completion orders, continued typing, and later external edits. Google link tests cover raw IDs, canonical and account-indexed Docs URLs, queries/fragments, and invalid hosts/paths without contacting Google.

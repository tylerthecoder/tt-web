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

The rich editor preserves top-level blank lines and ordinary single paragraph-edge spaces. It deliberately retains Markdown escapes needed to avoid changing syntax, and retains authored HTML/code. Nested Markdown formatting can still normalize through the underlying parser. This change does not rewrite stored notes or change the CLI sync format.

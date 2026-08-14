# WonderElian AI COO OS

A bilingual portfolio command center for WonderElian's consumer apps. It turns verified operating evidence into a concise executive brief, ranked insights, auditable actions, experiments, content records, and customer-feedback themes.

## Live dashboard

The GitHub Pages build is a public, read-only operating snapshot. Use the `EN / 中文` control to switch languages. The local Node version enables writes, approvals, imports, and atomic audit records.

## Run locally

```sh
npm run check
npm test
npm start
```

Open `http://127.0.0.1:4310/`.

## Architecture

- dependency-free Node.js modular monolith;
- atomic JSON state store with explicit validation;
- domain-owned approval and experiment state machines;
- provider adapters isolated from UI and decision logic;
- public GitHub Pages snapshot generated with `npm run build:static`;
- unknown metrics remain `null` and report coverage instead of becoming fake zeros.

The public deployment contains no passwords, tokens, cookies, verification codes, or browser-session data.

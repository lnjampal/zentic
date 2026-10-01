# Ansvisor Design System — portable export

This archive contains the current source library, tokens, generated CSS and
TypeScript tokens, all component stories, the full-width/top-menu style-guide
browser, fonts/brand references, platform guides, and compatibility fixtures.

## Use with Claude
Attach this ZIP to Claude, extract it in your project, and paste the contents of
`CLAUDE_IMPLEMENTATION_PROMPT.txt`. Give Claude access to the application you want
to update. The prompt instructs it to preserve your framework and existing
functionality rather than invent a new product.

## Run the exported style-guide preview
Use Node.js 22.12 or later (Node 22 LTS recommended).

```bash
cd ansvisor-design-system
npm install
npm run dev
```

Open the local URL printed by Vite. The export's Vite config works independently
of Replit: PORT defaults to 5173 and BASE_PATH defaults to `/`. Replit-only
plugins and managed artifact metadata are deliberately omitted.

```bash
npm run tokens
npm run typecheck
npm run build
npm run check:compatibility
npm run typecheck:consumer
npm run test:next
```

## Use as an application dependency
Place this folder inside your app, such as `packages/ansvisor-design-system`.
In a pnpm/npm workspace, register it as a workspace package and install from the
workspace root. Outside a workspace, add a file dependency:

```json
{
  "dependencies": {
    "@workspace/ansvisor-design-system": "file:./packages/ansvisor-design-system"
  }
}
```

Install from the application root; do not install a second React runtime in the
library. The package name is just a scope and is not tied to Replit.

For Next.js, set:

```js
export default {
  transpilePackages: ['@workspace/ansvisor-design-system'],
};
```

Import the theme once from your application's global CSS:

```css
@import '@workspace/ansvisor-design-system/styles.css';
```

Read `docs/consuming-web.md` and `docs/consuming-nextjs.md` for the full integration.
Use Tailwind 4 and `@tailwindcss/postcss` in Next.js. This is a typed source
package requiring a TS-aware bundler, not a prebuilt plain-JavaScript npm release.

## Fidelity and checks
- Buttons/top menu: 13px; compact buttons: 12px; dropdown items: 15px.
- The browser has grouped top navigation and full-width content.
- Source evidence is retained under `docs/references/`.
- Dark mode is derived. Primary and muted foregrounds are contrast-adjusted.
- Source-workspace checks passed with Next.js 16.3.6, React 19.1.0, TypeScript
  5.9.3 and Tailwind 4. The portable export's token generator/config/source
  integrity are checked when the ZIP is produced; no claim is made that an
  arbitrary target application's configuration has already been tested.
- `CHECKSUMS.sha256` lists hashes for the exported files.

No credentials, node_modules, build caches, stale compiled previews, or managed
Replit workflow configuration are included. Original canvas instructions in
some guides are context only, not required outside Replit.

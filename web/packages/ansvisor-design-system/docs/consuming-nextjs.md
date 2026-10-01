# Using Ansvisor in Next.js + React + TypeScript

Verified with Next.js **16.3.6**, React **19.1.0**, TypeScript **5.9.3**, and
Tailwind CSS **4**. Both the Next App Router production build and static
server rendering pass; the Vite design-system browser remains unchanged.
This is a private workspace source package, not a published npm bundle.

## 1. Add the workspace package

Add `"@workspace/ansvisor-design-system": "workspace:*"` to the Next app's
dependencies. The app must provide compatible React and React DOM versions
(these are peer dependencies), TypeScript, Tailwind CSS 4, and
`@tailwindcss/postcss`. Run `pnpm install` from the workspace root.

## 2. Transpile the typed source

```js
// next.config.mjs
export default {
  transpilePackages: ['@workspace/ansvisor-design-system'],
};
```

The package's explicit `types` exports allow TypeScript to resolve components,
hooks, and tokens through the same public paths. Use Next's normal TypeScript
configuration: strict mode, bundler module resolution, and JSX enabled.
No Vite plugin, alias, `window` shim, or `ssr: false` workaround is needed.

## 3. Load the global theme once

```js
// postcss.config.mjs
export default {
  plugins: { '@tailwindcss/postcss': {} },
};
```

```css
/* app/globals.css */
@import '@workspace/ansvisor-design-system/styles.css';
```

```tsx
// app/layout.tsx — a Server Component
import type { ReactNode } from 'react';
import './globals.css';

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
```

Do not also import Tailwind's root stylesheet; the package already includes
Tailwind 4, plugins, its own component scan, and theme variables. Its CSS affects
global body, border, and heading defaults. Keep any product-specific CSS after
the import. Load DM Sans, Manrope, and DM Mono using the stylesheet URL in
`consuming-web.md`, or self-host the fonts. Next font loading must preserve
these names or connect its CSS variables to the package's font stacks.

## 4. Compose typed components

```tsx
// app/actions.tsx
'use client';

import { useState } from 'react';
import { Button, type ButtonProps } from
  '@workspace/ansvisor-design-system/components/ui/button';

const props: ButtonProps = { variant: 'outline', size: 'sm' };

export function Actions() {
  const [count, setCount] = useState(0);
  return <Button {...props} onClick={() => setCount(count + 1)}>
    Run audit · {count}
  </Button>;
}
```

All public UI components and hooks declare their client boundary. They can
still render from a Server Component with serializable props and server-rendered
children. Put event handlers, hook usage, and interactive application state in
your own `"use client"` component; do not pass functions across the server/client
boundary. Charts and context-based controls need no extra boundary wrapper.

## Server-safe exports

Tokens, `cn`, and pure style factories stay available to server rendering:

```tsx
import { tokens } from '@workspace/ansvisor-design-system/tokens';
import { cn } from '@workspace/ansvisor-design-system/lib/utils';
import { buttonVariants } from '@workspace/ansvisor-design-system/lib/button-variants';

export default function Page() {
  return <a href="/reports" className={cn(buttonVariants({ variant: 'outline' }))}>
    Reports · {tokens.color.light.primary}
  </a>;
}
```

Badge and toggle factories have matching `lib/badge-variants` and
`lib/toggle-variants` paths. Their old component-module exports remain compatible
for client code, but must not be called from Server Components.
Mount the packaged toast provider/Toaster in a client component and invoke its
toast hook only from client code.

## Repeatable verification

From the workspace root:

```bash
pnpm --filter @workspace/ansvisor-design-system run check:compatibility
pnpm --filter @workspace/ansvisor-design-system run typecheck:consumer
pnpm --filter @workspace/ansvisor-design-system run test:next
```

The Next fixture checks server-safe tokens and styling, typed client controls,
dropdowns, carousel, OTP, charts, toast and viewport hooks, global CSS compilation,
and static server rendering. It is a test fixture only and is not a deployed app.
import { tokens } from '@workspace/ansvisor-design-system/tokens';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ansvisor-design-system/components/ui/card';
import { cn } from '@workspace/ansvisor-design-system/lib/utils';
import { buttonVariants } from '@workspace/ansvisor-design-system/lib/button-variants';
import { badgeVariants } from '@workspace/ansvisor-design-system/lib/badge-variants';
import { toggleVariants } from '@workspace/ansvisor-design-system/lib/toggle-variants';
import { ClientDemo } from './client-demo';

export default function Page() {
  return <main className="p-8">
    <Card>
      <CardHeader><CardTitle>Ansvisor Next.js compatibility</CardTitle></CardHeader>
      <CardContent>
        <p>Server-safe token: {tokens.color.light.foreground}</p>
        <a href="#demo" className={cn(buttonVariants({ variant: 'outline' }))}>Server-styled link</a>
        <span className={badgeVariants({ variant: 'secondary' })}>Server-styled badge</span>
        <span className={toggleVariants({ variant: 'outline' })}>Server-styled toggle treatment</span>
        <ClientDemo />
      </CardContent>
    </Card>
  </main>;
}
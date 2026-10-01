import { useRef, useState, type ComponentProps } from 'react';
import { tokens, type Tokens } from '@workspace/ansvisor-design-system';
import { Button, type ButtonProps } from '@workspace/ansvisor-design-system/components/ui/button';
import { Card, CardContent } from '@workspace/ansvisor-design-system/components/ui/card';
import { Input } from '@workspace/ansvisor-design-system/components/ui/input';
import { cn } from '@workspace/ansvisor-design-system/lib/utils';
import { buttonVariants } from '@workspace/ansvisor-design-system/lib/button-variants';
import { useToast } from '@workspace/ansvisor-design-system/hooks/use-toast';

const palette: Tokens['color']['light'] = tokens.color.light;
const action: ButtonProps = { variant: 'outline', size: 'sm' };
const input: ComponentProps<typeof Input> = { type: 'email', required: true };
// @ts-expect-error Invalid variants must be rejected by the public API.
const invalid: ButtonProps = { variant: 'not-a-variant' };
void invalid;

export function Consumer() {
  const ref = useRef<HTMLButtonElement>(null);
  const [value, setValue] = useState('');
  const { toast } = useToast();
  return <Card className="w-full">
    <CardContent>
      <p style={{ color: palette.foreground }}>Typed React consumer</p>
      <Input {...input} value={value} onChange={event => setValue(event.currentTarget.value)} />
      <Button {...action} ref={ref} onClick={() => toast({ title: value || 'Hello' })}>Save</Button>
      <a href="#details" className={cn(buttonVariants({ variant: 'link' }))}>Details</a>
    </CardContent>
  </Card>;
}
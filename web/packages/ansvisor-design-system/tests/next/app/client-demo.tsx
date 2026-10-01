'use client';

import { useState } from 'react';
import { Button } from '@workspace/ansvisor-design-system/components/ui/button';
import { Input } from '@workspace/ansvisor-design-system/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@workspace/ansvisor-design-system/components/ui/dropdown-menu';
import { Carousel, CarouselContent, CarouselItem } from '@workspace/ansvisor-design-system/components/ui/carousel';
import { ChartContainer, type ChartConfig } from '@workspace/ansvisor-design-system/components/ui/chart';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@workspace/ansvisor-design-system/components/ui/input-otp';
import { Toaster } from '@workspace/ansvisor-design-system/components/ui/toaster';
import { useToast } from '@workspace/ansvisor-design-system/hooks/use-toast';
import { useIsMobile } from '@workspace/ansvisor-design-system/hooks/use-mobile';
import { Area, AreaChart } from 'recharts';

const config = { score: { label: 'Score', color: 'var(--color-chart-1)' } } satisfies ChartConfig;

export function ClientDemo() {
  const [count, setCount] = useState(0);
  const { toast } = useToast();
  const mobile = useIsMobile();
  return <section id="demo" className="mt-6 space-y-4">
    <Input aria-label="Workspace" placeholder="Workspace name" />
    <Button onClick={() => setCount(count + 1)}>Count: {count}</Button>
    <Button variant="outline" onClick={() => toast({ title: 'Next.js toast' })}>Show toast</Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="outline">Open menu</Button></DropdownMenuTrigger>
      <DropdownMenuContent><DropdownMenuItem>Item</DropdownMenuItem></DropdownMenuContent>
    </DropdownMenu>
    <Carousel><CarouselContent><CarouselItem>Typed client carousel</CarouselItem></CarouselContent></Carousel>
    <InputOTP maxLength={2}><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /></InputOTPGroup></InputOTP>
    <ChartContainer config={config} className="h-40 w-full"><AreaChart data={[{ score: 78 }, { score: 82 }]}><Area dataKey="score" /></AreaChart></ChartContainer>
    <p>Viewport hook: {mobile ? 'mobile' : 'desktop'}</p>
    <Toaster />
  </section>;
}
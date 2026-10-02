import Image from 'next/image';
import { siteConfig } from '@/config/site';
import { MarketingAuthActions } from '@/components/marketing/marketing-auth-actions';

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <a href={siteConfig.url} className="flex items-center gap-2">
          <Image
            src="/logo_light.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 dark:hidden"
            priority
          />
          <Image
            src="/logo_dark.svg"
            alt=""
            width={28}
            height={28}
            className="hidden h-7 w-7 shrink-0 dark:block"
            priority
          />
          <span className="text-xl font-bold tracking-tight">{siteConfig.name}</span>
        </a>

        <MarketingAuthActions />
      </div>
    </header>
  );
}

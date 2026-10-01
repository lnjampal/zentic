import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { PostHogProvider } from '@/components/providers/posthog-provider';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://app.zentic.ai'),
  title: {
    default: 'Zentic',
    template: '%s | Zentic',
  },
  description:
    "Monitor, analyze, and optimize your brand's visibility in AI-powered search engines.",
  openGraph: {
    title: 'Zentic',
    description:
      'Track how AI search engines mention your brand — ChatGPT, Gemini, Perplexity, Claude, Copilot.',
    url: '/',
    siteName: 'Zentic',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zentic',
    description:
      'Track how AI search engines mention your brand — ChatGPT, Gemini, Perplexity, Claude, Copilot.',
  },
  // Public pages (home/offers, free audit) are indexable; the signed-in app,
  // audit reports and auth pages opt out via their own metadata and the
  // X-Robots-Tag headers in vercel.json.
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* Design-system fonts: DM Sans (body/UI), Manrope (headings), DM Mono (metadata). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap"
        />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased">
        <PostHogProvider />
        {children}
        <Analytics />
      </body>
    </html>
  );
}

export const siteConfig = {
  name: 'Zentic',
  description:
    "Monitor, analyze, and optimize your brand's visibility in AI-powered search engines like ChatGPT, Perplexity, Gemini, and more.",
  url: 'https://zentic.ai',
  ogImage: 'https://app.zentic.ai/opengraph-image',
  links: {
    github: 'https://github.com/zentic/zentic',
    docs: 'https://docs.zentic.ai',
  },
  legal: {
    privacy: 'https://www.zentic.ai/privacy-policy',
    terms: 'https://www.zentic.ai/terms-of-service',
  },
} as const;

export type SiteConfig = typeof siteConfig;

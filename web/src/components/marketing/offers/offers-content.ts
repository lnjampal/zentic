import { Bot, MessageCircle, ScanSearch, type LucideIcon } from 'lucide-react';

/*
 * Copy for the public offers page. Sources: Zentic PRD v0.2 (free audit and
 * fix kit, paid chat assistant, Agent Actions in a later phase) and the
 * competitive brief. Competitors are described only as product categories,
 * never by name.
 */

export type OfferKey = 'audit' | 'assistant' | 'agent';

export interface Offer {
  key: OfferKey;
  number: string;
  name: string;
  tagline: string;
  status: string;
  statusVariant: 'default' | 'secondary' | 'outline';
  headline: string;
  description: string;
  audience: string;
  icon: LucideIcon;
  includes: string[];
  note: string;
  cta: { label: string; href?: string; prototypeMessage?: string };
}

export const offers: Offer[] = [
  {
    key: 'audit',
    number: '01',
    name: 'AI Readiness Audit',
    tagline: 'See what AI sees.',
    status: 'Free',
    statusVariant: 'default',
    headline: 'Find out if AI can find, read and trust your website.',
    description:
      'Enter your site, prove it is yours, and get a scored report on how ready it is for AI assistants and AI search. Every finding comes with a fix written for an owner, not an SEO team.',
    audience: 'For owners who want to know what to fix first.',
    icon: ScanSearch,
    includes: [
      'AI crawler access, llms.txt and structured data checks',
      'Business-detail checks: services, prices, opening hours and location',
      'Copy-paste fixes, or one click to send them to your web person',
      'A free re-audit after you fix, so you can see the score move',
    ],
    note: 'The audit, the fix kit and your re-audits are free. No card needed.',
    cta: { label: 'Run my free audit', href: '/audit' },
  },
  {
    key: 'assistant',
    number: '02',
    name: 'AI Chat Assistant',
    tagline: 'Answer every customer.',
    status: 'Free trial, then monthly',
    statusVariant: 'secondary',
    headline: 'Answer questions and take bookings on your website and WhatsApp.',
    description:
      'An assistant that learns your business from your own website, answers customers any time of day, and books them into your calendar. Questions it cannot answer come back to you as fixes for your site.',
    audience: 'For businesses that lose customers to missed calls and slow replies.',
    icon: MessageCircle,
    includes: [
      'One line of code on WordPress or Wix, plus your WhatsApp Business number',
      'Books against Google Calendar, or sends the request to your front desk',
      'Replies in English and Hindi, with more languages on the way',
      'Your team can take over any conversation from one inbox',
      'Monthly AI-visibility updates included in every plan',
    ],
    note: 'Monthly plans by conversation volume. It answers only from your own content and hands anything else to your team.',
    cta: {
      label: 'Join early access',
      prototypeMessage: 'Early access sign-up is not connected yet. Nothing was submitted.',
    },
  },
  {
    key: 'agent',
    number: '03',
    name: 'AI Action Agent',
    tagline: 'Let AI book for you.',
    status: 'Later phase',
    statusVariant: 'outline',
    headline: 'Let AI assistants book with you directly.',
    description:
      'When a customer asks an AI assistant to book a service near them, the agent lets it check your open slots and book, using the same booking service as your chat assistant.',
    audience: 'For businesses already taking bookings through the chat assistant.',
    icon: Bot,
    includes: [
      'Supported workflows only: check availability, book, send an enquiry',
      'Built on the booking service your chat assistant already uses',
      'Opens as a pilot once AI assistants can book with businesses at scale',
    ],
    note: 'Not available yet. We will not promise that any AI assistant can complete any task on any website.',
    cta: {
      label: 'Join the pilot waitlist',
      prototypeMessage: 'The pilot waitlist is not connected yet. Nothing was submitted.',
    },
  },
];

export const steps = [
  {
    label: '01 / GET FOUND',
    title: 'Fix what stops AI from recommending you.',
    body: 'The free audit shows what AI assistants can and cannot read on your site, and the fix kit tells you exactly what to change.',
  },
  {
    label: '02 / GET ASKED',
    title: 'Answer every customer who reaches out.',
    body: 'The chat assistant replies on your website and WhatsApp in seconds, using facts from your own pages.',
  },
  {
    label: '03 / GET BOOKED',
    title: 'Turn the conversation into an appointment.',
    body: 'Customers pick a slot in the chat. Later, AI assistants will be able to book the same slots directly.',
  },
];

export const boundaries = [
  {
    title: 'Free means free',
    body: 'The audit, fix kit and re-audits cost nothing. You only pay for the chat assistant.',
  },
  {
    title: 'No made-up answers',
    body: 'The assistant answers from your own content and hands anything it doesn’t know to your team.',
  },
  {
    title: 'No ranking promises',
    body: 'Nobody controls what AI assistants say. We make you easier to find, read and cite.',
  },
];

export type Fit = 'yes' | 'partial' | 'no';

export const comparison: {
  rows: { label: string; zentic: Fit; suites: Fit; chat: Fit }[];
  note: string;
} = {
  rows: [
    { label: 'Free AI-readiness audit of your own site', zentic: 'yes', suites: 'partial', chat: 'no' },
    { label: 'Fixes a non-technical owner can apply', zentic: 'yes', suites: 'partial', chat: 'no' },
    { label: 'Checks for business details: services, prices, hours', zentic: 'yes', suites: 'no', chat: 'no' },
    { label: 'Assistant built from your own website', zentic: 'yes', suites: 'no', chat: 'partial' },
    { label: 'Booking inside website and WhatsApp chat', zentic: 'yes', suites: 'no', chat: 'partial' },
    { label: 'Unanswered questions turned into site fixes', zentic: 'yes', suites: 'no', chat: 'no' },
    { label: 'Deep tracking of AI mentions across engines', zentic: 'partial', suites: 'yes', chat: 'no' },
  ],
  note: 'A general comparison of product categories based on publicly described features, not a review of any specific product. Zentic features are as planned for launch.',
};

export const faqs: [string, string][] = [
  [
    'Is the audit really free?',
    'Yes. The audit, the fix kit, a re-audit after you apply fixes and a monthly re-audit are all free. The only paid product is the chat assistant.',
  ],
  [
    'I don’t have a web person. Can I still fix things?',
    'Most fixes are copy-paste steps for WordPress and Wix, written in plain language. You can also send the fix kit to anyone who manages your site, or ask one of our partner agencies to apply it.',
  ],
  [
    'Which AI assistants does this help with?',
    'The audit checks what AI assistants and AI search features need to read your site: crawler access, structured data, llms.txt and clear facts about your business. No one can guarantee that an AI assistant will mention you; we make it easier for them to.',
  ],
  [
    'Will the chat assistant make things up?',
    'No. It answers from your website and the details you give us, such as opening hours, prices and services. When it doesn’t know, it says so and offers a callback from your team rather than guess.',
  ],
  [
    'What happens to my customers’ data?',
    'Conversation data is kept for 30 to 90 days, which you choose, and is covered by a published privacy notice that follows local data-protection law, such as India’s DPDP Act.',
  ],
  [
    'Will the action agent work on my site?',
    'Not yet. It is a later phase, and it will only support defined workflows such as checking availability and booking, built on the same service as the chat assistant.',
  ],
];

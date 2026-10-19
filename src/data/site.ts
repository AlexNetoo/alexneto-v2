export const site = {
  name: 'Alex Neto',
  role: 'Product Designer',
  location: 'Porto, Portugal',
  url: 'https://alexneto.com',
  email: 'alex.neto@gmail.com',
  /** WhatsApp number, digits only (wa.me format). +351 915 505 087 */
  whatsapp: '351915505087',
  headline:
    'I drive real business results by designing digital products and websites that are easy to use and scale.',
  trustedLine: 'Trusted by ambitious founders and leading brands since 2014.',
  description:
    'Alex Neto is a Product Designer based in Porto, Portugal, designing digital products and websites that balance user needs, business goals and long-term scalability.',
};

export const whatsappUrl = `https://wa.me/${site.whatsapp}`;

export const socials = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/alexneto93/' },
  { label: 'X', href: 'https://x.com/AlexNeto_' },
  { label: 'Behance', href: 'https://www.behance.net/alex_l_neto/' },
];

/** logo: file in /public/logos (single-colour SVG). ratio = width / height, height = px at desktop. */
export const brands = [
  { name: 'Takeda', href: 'https://www.takeda.com/', logo: '/logos/takeda.svg', ratio: 2.986, height: 36 },
  { name: 'IKEA', href: 'http://ikea.pt/', logo: '/logos/ikea.svg', ratio: 2.5, height: 26 },
  { name: 'Namecheap', href: 'http://namecheap.com/', logo: '/logos/namecheap.svg', ratio: 1.803, height: 26 },
  { name: 'Paybyrd', href: 'https://www.paybyrd.com/', logo: '/logos/paybyrd.svg', ratio: 5.524, height: 22 },
  { name: 'Emerald Technology', href: 'https://www.emerald-technology.com/', logo: '/logos/emerald.svg', ratio: 4.444, height: 28 },
];

export type NavItem = { label: string; href: string; count?: string; external?: boolean };

export const nav: NavItem[] = [
  { label: 'Work', href: '/projects' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: whatsappUrl, external: true },
];

export const statement =
  'I’m a Product Designer based in Porto, Portugal. For over a decade, I’ve been designing digital products and websites that balance user needs, business goals and long-term scalability.';

export const statementEmphasis = [
  'Product Designer',
  'digital products and websites',
  'user needs',
  'business goals',
  'long-term scalability',
];

export const bio = {
  lead:
    'I’m Alex Neto, a Product Designer based in Porto, Portugal. For over a decade, I’ve been designing digital products and websites that balance user needs, business goals, and long-term scalability.',
  paragraphs: [
    'My work spans product design, strategic design for startups and established companies, and mentoring designers, always with a strong focus on clarity, usability, and outcomes that actually move the business forward.',
    'I’m driven by building products from scratch, helping teams make better decisions through design, and creating experiences that feel intuitive, purposeful, and easy to use.',
  ],
  personal:
    'Outside of work, you’ll usually find me skateboarding or digging through crates for house music vinyl.',
  personalEmphasis: ['skateboarding', 'house music vinyl', 'Outside of work'],
  facts: [
    { label: 'Based in', value: 'Porto, Portugal' },
    { label: 'Experience', value: '15+ years in design and 10 years in product design' },
    { label: 'Focus', value: 'Product & strategic design' },
    { label: 'Contact', value: 'alex.neto@gmail.com', href: 'mailto:alex.neto@gmail.com' },
  ],
};

export const services = [
  {
    title: 'Product design',
    caption: 'Building digital products from scratch.',
    description:
      'Interfaces, dashboards and flows, designed for clarity and built to scale with the product.',
    graphic: 'product' as const,
  },
  {
    title: 'Strategic design',
    caption: 'For startups and established companies.',
    description:
      'Helping teams make better decisions through design, from the first idea to the long-term roadmap.',
    graphic: 'strategy' as const,
  },
  {
    title: 'UX / UI design',
    caption: 'Clarity, usability and outcomes.',
    description:
      'Experiences that feel intuitive, purposeful and easy to use, tied to results that move the business.',
    graphic: 'ux' as const,
  },
  {
    title: 'Design mentoring',
    caption: 'Mentoring designers and teaching.',
    description: 'Guiding designers and running workshops at Nova SBE, EDIT. and Aalto University.',
    graphic: 'mentoring' as const,
  },
];

export type ResumeRow = { period: string; org: string; role: string };

export const experience: ResumeRow[] = [
  { period: 'Nov’25–Present', org: 'Independent Contractor', role: 'Senior Product Designer' },
  { period: 'Nov’22–Nov’25', org: 'Namebase.io (acquired by Namecheap)', role: 'Lead / Senior Product Designer' },
  { period: 'Dec’20–Nov’22', org: 'Namecheap.com', role: 'UX Manager' },
  { period: 'Dec’19–Dec’20', org: 'Defined.ai', role: 'UI/UX Designer' },
  { period: 'Jan’19–Dec’19', org: 'With Company', role: 'Design Lead' },
  { period: 'Jul’16–Jan’19', org: 'Porto Design Factory', role: 'UI/UX Designer' },
];

export const teaching: ResumeRow[] = [
  { period: 'Mar’24', org: 'Nova School of Business and Economics', role: 'Design Thinking Workshop' },
  { period: 'Mar’21–Feb’23', org: 'EDIT. Disruptive Digital Education', role: 'UX Design Essentials' },
  { period: 'Apr’18', org: 'Aalto University', role: '4× Design Thinking Workshops' },
];

export const focusTags = [
  'Product design',
  'Strategic design',
  'UX / UI design',
  'Design mentoring',
  'Startups',
  'Established companies',
];

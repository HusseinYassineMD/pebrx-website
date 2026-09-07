export interface PageMeta {
  path: string;
  title: string;
  description: string;
  ogType?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export const SITE_NAME = 'PebRx';

export function getSiteUrl(): string {
  return (
    process.env.SITE_URL ??
    (process.env.GITHUB_PAGES === 'true'
      ? 'https://husseinyassinemd.github.io/pebrx-website'
      : 'https://www.pebrx.co')
  );
}

const ORG_BASE = {
  '@type': 'MedicalOrganization',
  name: SITE_NAME,
  url: '', // filled at runtime
  logo: '', // filled at runtime
  description:
    'PebRx develops precision therapeutics and PET diagnostics targeting neurovascular inflammation in Alzheimer\'s disease and related neurodegenerative disorders.',
  foundingDate: '2024',
  medicalSpecialty: 'Neurology',
  knowsAbout: [
    'Alzheimer\'s disease',
    'APOE4',
    'neuroinflammation',
    'cPLA2 inhibitors',
    'PET imaging',
    'precision therapeutics',
  ],
};

const PUBLICATIONS: Record<string, unknown>[] = [
  {
    '@type': 'ScholarlyArticle',
    headline:
      'Brain Pro-Resolving-to-Pro-Inflammatory Lipids and cPLA2 Activation Associations with Late-Life Cognitive Trajectories',
    author: 'Yaskolka Meir A, Wang X, Li B, Wilson RS, Bennett DA, Louie SG, Yassine HN, Arvanitakis Z',
    datePublished: '2026',
    isPartOf: { '@type': 'Periodical', name: 'eBioMedicine' },
  },
  {
    '@type': 'ScholarlyArticle',
    headline:
      'Development of Potent, Selective cPLA2 Inhibitors for Targeting Neuroinflammation in Alzheimer\'s Disease and Other Neurodegenerative Disorders',
    author: 'Sadybekov AV, Duro MV, Wang S, et al.',
    datePublished: '2026',
    isPartOf: { '@type': 'Periodical', name: 'NPJ Drug Discovery' },
  },
  {
    '@type': 'ScholarlyArticle',
    headline: 'PLA2G4A as a Drug Target for Vascular Inflammation in Alzheimer\'s Disease',
    author: 'Kanwal A, Kerman BE, Wang S, et al.',
    datePublished: '2026',
    isPartOf: { '@type': 'Periodical', name: 'Alzheimer\'s & Dementia' },
  },
  {
    '@type': 'ScholarlyArticle',
    headline: 'Evidence for cPLA2 Activation in Alzheimer\'s Disease Synaptic Pathology',
    author: 'Ma QL, Ebright B, Li B, et al.',
    datePublished: '2026',
    isPartOf: { '@type': 'Periodical', name: 'Acta Neuropathologica Communications' },
  },
  {
    '@type': 'ScholarlyArticle',
    headline:
      'Synthesis and Preclinical Evaluation of 22-[18F]Fluorodocosahexaenoic Acid as a PET Probe for Monitoring Brain Docosahexaenoic Acid Uptake Kinetics',
    author: 'Duro MVV, Van Valkenburgh J, Ingles DE, et al.',
    datePublished: '2023',
    isPartOf: { '@type': 'Periodical', name: 'ACS Chemical Neuroscience' },
  },
  {
    '@type': 'ScholarlyArticle',
    headline:
      'Calcium-Dependent Cytosolic Phospholipase A2 Activation is Implicated in Neuroinflammation and Oxidative Stress Associated with ApoE4',
    author: 'Wang S, Asante I, Ebright B, et al.',
    datePublished: '2022',
    isPartOf: { '@type': 'Periodical', name: 'Molecular Neurodegeneration' },
  },
  {
    '@type': 'ScholarlyArticle',
    headline:
      'Inhibition of cPLA2 Ameliorates Memory Deficits and Reduces Neuroinflammation in ApoE4-TR Mice',
    author: 'Wang S, Ebright B, Sun Y, Li B, Asante I, Louie SG, Yassine HN',
    datePublished: '2022',
    isPartOf: { '@type': 'Periodical', name: 'Alzheimer\'s & Dementia' },
  },
  {
    '@type': 'ScholarlyArticle',
    headline: 'DHA Brain Uptake and APOE4 Status: A PET Study with [1-11C]-DHA',
    author: 'Yassine HN, Croteau E, Rawat V, Hibbeln JR, Rapoport SI, Cunnane SC, Umhau JC',
    datePublished: '2017',
    isPartOf: { '@type': 'Periodical', name: 'Alzheimer\'s Research & Therapy' },
  },
];

const TEAM: Record<string, unknown>[] = [
  {
    '@type': 'Person',
    name: 'Amy Wang',
    jobTitle: 'Chief Executive Officer',
    description: 'PhD Biological Chemistry, MBA. Life science entrepreneur with expertise in venture creation, IP strategy, and drug discovery.',
  },
  {
    '@type': 'Person',
    name: 'Hussein Yassine',
    jobTitle: 'Co-Founder, Scientific Lead',
    honorificPrefix: 'Dr',
    description: 'MD — Professor of Medicine and Neurology. Leads lipidomics and translational medicine strategy for APOE4 biology.',
    affiliation: { '@type': 'Organization', name: 'Keck School of Medicine of USC' },
  },
  {
    '@type': 'Person',
    name: 'Stan Louie',
    jobTitle: 'Co-Founder, Drug Development',
    description: 'Professor of Clinical Pharmacy. Guides clinical development and experimental therapeutics.',
    affiliation: { '@type': 'Organization', name: 'USC School of Pharmacy' },
  },
  {
    '@type': 'Person',
    name: 'Seva Katritch',
    jobTitle: 'Co-Founder, Drug Discovery',
    description: 'PhD — Biophysics and Molecular Biology. Leads small molecule and computational drug discovery.',
  },
  {
    '@type': 'Person',
    name: 'Lillian Jin',
    jobTitle: 'Pre-IND Project Manager',
    description: 'PhD, Scientist. Leads pre-IND planning and project management.',
  },
  {
    '@type': 'Person',
    name: 'Marlon Duro',
    jobTitle: 'Backup Compound & PET Tracer Development',
    description: 'PhD, Scientist. Advances backup cPLA2 compounds and PET tracer development.',
  },
  {
    '@type': 'Person',
    name: 'Tiffany Kolchins',
    jobTitle: 'Operations & Business Development',
    description: 'MBA. Supports operational execution and business development.',
  },
];

function orgSchema(siteUrl: string): Record<string, unknown> {
  return {
    ...ORG_BASE,
    url: siteUrl,
    logo: `${siteUrl}/images/logo-full.png`,
  };
}

export function getPageMeta(filename: string, siteUrl: string): PageMeta | null {
  const org = orgSchema(siteUrl);

  const pages: Record<string, PageMeta> = {
    'index.html': {
      path: '/',
      title: 'PebRx | Personalized Brain Health for Precision Therapeutics',
      description:
        'PebRx develops precision therapeutics and diagnostics targeting neurovascular inflammation in Alzheimer\'s disease and related neurodegenerative disorders.',
      ogType: 'website',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: siteUrl,
          description: org.description,
          publisher: org,
        },
        { '@context': 'https://schema.org', ...org },
      ],
    },
    'science.html': {
      path: '/science.html',
      title: 'Science | PebRx',
      description: 'PebRx science — neuroinflammation platform and APOE4 research.',
      ogType: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'MedicalWebPage',
        name: 'Science — PebRx Neuroinflammation Platform',
        description:
          'Precision therapeutics for APOE4-driven neurovascular disease through lipid-mediated neuroinflammation research.',
        url: `${siteUrl}/science.html`,
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: siteUrl },
        about: org,
      },
    },
    'pipeline.html': {
      path: '/pipeline.html',
      title: 'Pipeline | PebRx',
      description: 'PebRx pipeline — BRI-Series and diagnostic PET programs.',
      ogType: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'MedicalWebPage',
        name: 'Pipeline — BRI Series & PET Programs',
        description: 'Lead therapeutic BRI-50460 and diagnostic PET imaging programs at PebRx.',
        url: `${siteUrl}/pipeline.html`,
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: siteUrl },
        about: {
          '@type': 'Drug',
          name: 'BRI-50460',
          description:
            'Proprietary, potent, blood-brain-barrier-penetrant, selective small molecule inhibitor of cPLA2.',
          manufacturer: org,
        },
      },
    },
    'leadership.html': {
      path: '/leadership.html',
      title: 'Leadership | PebRx',
      description: 'PebRx leadership team and advisors.',
      ogType: 'profile',
      jsonLd: [
        { '@context': 'https://schema.org', ...org },
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'PebRx Leadership Team',
          itemListElement: TEAM.map((person, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: { ...person, worksFor: org },
          })),
        },
      ],
    },
    'publications.html': {
      path: '/publications.html',
      title: 'Publications | PebRx',
      description: 'Selected PebRx research publications.',
      ogType: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'PebRx Selected Publications',
        description: 'Peer-reviewed research supporting PebRx\'s therapeutic and diagnostic programs.',
        itemListElement: PUBLICATIONS.map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: { ...article, publisher: org },
        })),
      },
    },
    'contact.html': {
      path: '/contact.html',
      title: 'Contact | PebRx',
      description: 'Contact PebRx for partnerships and inquiries.',
      ogType: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact PebRx',
        url: `${siteUrl}/contact.html`,
        description: 'Partnership inquiries, collaborations, and general questions.',
        mainEntity: org,
      },
    },
    'about.html': {
      path: '/about.html',
      title: 'About | PebRx',
      description:
        'About PebRx — precision therapeutics and diagnostics for APOE4-driven neurovascular disease. Redirects to our Science page.',
      ogType: 'website',
    },
  };

  return pages[filename] ?? null;
}

export function buildSeoTags(filename: string): string {
  const siteUrl = getSiteUrl().replace(/\/$/, '');
  const meta = getPageMeta(filename, siteUrl);
  if (!meta) return '';

  const canonical = `${siteUrl}${meta.path === '/' ? '/' : meta.path}`;
  const ogImage = `${siteUrl}/images/logo-full.png`;
  const ogType = meta.ogType ?? 'website';

  const jsonLdBlock = meta.jsonLd ? formatJsonLd(meta.jsonLd) : '';

  return `
  <link rel="canonical" href="${canonical}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${escapeAttr(meta.title)}">
  <meta property="og:description" content="${escapeAttr(meta.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:alt" content="${SITE_NAME} logo">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(meta.title)}">
  <meta name="twitter:description" content="${escapeAttr(meta.description)}">
  <meta name="twitter:image" content="${ogImage}">
  ${jsonLdBlock}`.trim();
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function formatJsonLd(data: Record<string, unknown> | Record<string, unknown>[]): string {
  if (Array.isArray(data)) {
    const graph = data.map((item) => {
      const { '@context': _ctx, ...rest } = item as Record<string, unknown> & { '@context'?: string };
      return rest;
    });
    return `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graph,
    })}</script>`;
  }
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

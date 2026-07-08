import type { Locale } from './locales';

export type NavItem = {
  label: string;
  href: string;
};

export type CommonContent = {
  nav: {
    links: NavItem[];
    start: string;
  };
  footer: {
    tagline: string;
    product: string;
    trust: string;
    languages: string;
  };
  compliance: string;
};

export type PageContent = {
  seo: {
    title: string;
    description: string;
  };
  hero?: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    note: string;
  };
  sections: Array<{
    eyebrow?: string;
    title: string;
    body?: string;
    items?: Array<{
      title: string;
      body: string;
    }>;
  }>;
};

export type FaqContent = PageContent & {
  groups: Array<{
    title: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  }>;
};

const common: Record<Locale, CommonContent> = {
  en: {
    nav: {
      links: [
        { label: 'How it works', href: '/how-it-works' },
        { label: 'Security', href: '/security' },
        { label: 'AI support', href: '/ai-support' },
        { label: 'FAQ', href: '/faq' }
      ],
      start: 'Start planning'
    },
    footer: {
      tagline: 'A practical family resilience plan for trusted contacts, asset references, readiness gaps, and emergency handover.',
      product: 'Product',
      trust: 'Trust',
      languages: 'Languages'
    },
    compliance: 'Pusaka provides product guidance and family planning prompts. It does not provide financial, legal, or insurance advice.'
  },
  zh: {
    nav: {
      links: [
        { label: '如何运作', href: '/how-it-works' },
        { label: '安全与隐私', href: '/security' },
        { label: 'AI 客服', href: '/ai-support' },
        { label: '常见问题', href: '/faq' }
      ],
      start: '开始规划'
    },
    footer: {
      tagline: '面向家庭联系人、资产线索、准备度缺口与紧急移交的实用家庭韧性计划。',
      product: '产品',
      trust: '信任',
      languages: '语言'
    },
    compliance: 'Pusaka 提供产品指引和家庭规划提示，不提供金融、法律或保险建议。'
  }
};

const pages: Record<Locale, Record<string, PageContent | FaqContent>> = {
  en: {
    home: {
      seo: {
        title: 'Pusaka | Family resilience planning',
        description: 'A practical handover plan for trusted contacts, asset references, readiness gaps, and emergency previews.'
      },
      hero: {
        eyebrow: 'Malaysia-first family resilience',
        title: 'Pusaka helps your family know who to call and where to look.',
        body: 'A practical family resilience plan for trusted contacts, asset references, readiness gaps, and emergency handover.',
        primaryCta: 'Start your family plan',
        secondaryCta: 'See how it works',
        note: 'Start with one trusted contact and a few safe references. Never add passwords, private keys, balances, or account numbers.'
      },
      sections: [
        {
          title: 'Plan the practical handover, not the family drama.',
          body: 'Pusaka keeps the first draft calm and concrete: who should be contacted, where important references live, and what is still missing.',
          items: [
            { title: 'Family contacts', body: 'Record names, relationships, and roles so the right people know when to step in.' },
            { title: 'Asset references', body: 'Keep safe clues like provider names and document locations without exposing secrets.' },
            { title: 'Plan freshness', body: 'See readiness gaps before they become urgent family confusion.' }
          ]
        },
        {
          eyebrow: 'Six-step flow',
          title: 'From first draft to emergency preview.',
          items: [
            { title: 'Family members', body: 'Map the people your plan should consider.' },
            { title: 'Trusted contacts', body: 'Assign primary and backup contacts for practical handover.' },
            { title: 'Asset references', body: 'Add safe references such as Maybank, AIA, Kuala Lumpur property files, or iCloud Drive folders.' },
            { title: 'Check-in', body: 'Review what is complete and what still needs attention.' },
            { title: 'Readiness', body: 'Understand gaps in plain language without regulated advice.' },
            { title: 'Emergency preview', body: 'Preview what trusted contacts would see in a serious situation.' }
          ]
        }
      ]
    },
    'how-it-works': {
      seo: {
        title: 'How Pusaka works | Pusaka',
        description: 'Create a practical family handover plan through six guided steps.'
      },
      sections: [
        {
          eyebrow: 'Guided setup',
          title: 'Create the first draft in six steady steps.',
          body: 'The flow mirrors the mobile app so families can start with safe references and improve the plan over time.',
          items: [
            { title: 'Add people first', body: 'Start with family members and two trusted contacts before adding any asset references.' },
            { title: 'Keep references safe', body: 'Use provider names, folder locations, or document hints instead of sensitive secrets.' },
            { title: 'Review the handover', body: 'Use the emergency preview to understand what a trusted contact could see.' }
          ]
        }
      ]
    },
    security: {
      seo: {
        title: 'Security and privacy | Pusaka',
        description: 'Pusaka stores references, not secrets, and keeps AI and blockchain boundaries clear.'
      },
      sections: [
        {
          eyebrow: 'Data boundary',
          title: 'References, not secrets.',
          body: 'Pusaka is designed for practical clues and family coordination. It is not a vault for passwords, private keys, bank account numbers, balances, or full identity documents.',
          items: [
            { title: 'AI boundary', body: 'AI support answers product and setup questions only.' },
            { title: 'Blockchain boundary', body: 'Future proof-of-plan anchoring stores hashes only; original plan data stays off-chain.' },
            { title: 'Malaysia-first review', body: 'PDPA and cross-border processing disclosures are reviewed before production launch.' }
          ]
        }
      ]
    },
    'ai-support': {
      seo: {
        title: 'AI support | Pusaka',
        description: 'Ask Pusaka AI setup questions in plain language with clear advice boundaries.'
      },
      sections: [
        {
          eyebrow: 'Plain-language help',
          title: 'Ask setup questions without turning it into legal paperwork.',
          body: 'Pusaka AI can explain product concepts such as trusted contacts, asset references, readiness scores, and emergency preview.',
          items: [
            { title: 'Good question', body: 'Why do I need two trusted contacts?' },
            { title: 'Good question', body: 'What should I write for an asset reference?' },
            { title: 'Boundary', body: 'It cannot draft legal documents or recommend investments, policies, wallets, providers, or law firms.' }
          ]
        }
      ]
    },
    faq: {
      seo: {
        title: 'FAQ | Pusaka',
        description: 'Common questions about Pusaka family resilience planning, data safety, AI, and blockchain boundaries.'
      },
      sections: [],
      groups: [
        {
          title: 'Getting started',
          items: [
            { question: 'What is Pusaka?', answer: 'Pusaka is a practical family resilience planning product for trusted contacts, asset references, readiness gaps, and emergency handover previews.' },
            { question: 'Who is it for?', answer: 'It is for families who want their loved ones to know who to call and where to look if something serious happens.' },
            { question: 'How long does setup take?', answer: 'A useful first draft can start with one trusted contact and a few safe references.' }
          ]
        },
        {
          title: 'Data safety',
          items: [
            { question: 'Should I add passwords?', answer: 'No. Do not add passwords, private keys, bank account numbers, balances, or full identity documents.' },
            { question: 'What counts as an asset reference?', answer: 'A safe clue such as a provider name, document folder, location hint, or category.' },
            { question: 'Can I delete information later?', answer: 'The production product is planned to include clear deletion and process transparency.' }
          ]
        },
        {
          title: 'AI and blockchain',
          items: [
            { question: 'Can AI give legal or financial advice?', answer: 'No. Pusaka AI provides product guidance and family planning prompts only.' },
            { question: 'Is my family data on-chain?', answer: 'No. Future proof-of-plan anchoring stores hashes only, not the original family plan data.' }
          ]
        }
      ]
    }
  },
  zh: {
    home: {
      seo: {
        title: 'Pusaka | 家庭韧性规划',
        description: '为信任联系人、资产线索、准备度缺口和紧急移交预览建立一份实用计划。'
      },
      hero: {
        eyebrow: '马来西亚优先的家庭韧性规划',
        title: 'Pusaka 帮助家人知道该联系谁、该从哪里找起。',
        body: '一份实用的家庭韧性计划，覆盖信任联系人、资产线索、准备度缺口与紧急移交。',
        primaryCta: '开始家庭计划',
        secondaryCta: '查看如何运作',
        note: '先从一个信任联系人和几条安全线索开始。不要填写密码、私钥、余额或账号。'
      },
      sections: [
        {
          title: '规划实际移交，不制造家庭压力。',
          body: 'Pusaka 让第一版计划保持清晰：谁需要被联系、重要线索在哪里、还有哪些缺口。',
          items: [
            { title: '家庭联系人', body: '记录姓名、关系和角色，让正确的人知道何时协助。' },
            { title: '资产线索', body: '保存机构名称和文件位置等安全线索，不暴露秘密。' },
            { title: '计划新鲜度', body: '在紧急情况前发现准备度缺口。' }
          ]
        },
        {
          eyebrow: '六步流程',
          title: '从第一版草稿到紧急移交预览。',
          items: [
            { title: '家庭成员', body: '列出计划需要考虑的人。' },
            { title: '信任联系人', body: '设置主要和备用联系人。' },
            { title: '资产线索', body: '添加 Maybank、AIA、吉隆坡房产文件或 iCloud Drive 文件夹等安全线索。' },
            { title: '检查', body: '确认已完成和仍需补充的内容。' },
            { title: '准备度', body: '用平实语言理解缺口，不越界给建议。' },
            { title: '紧急预览', body: '预览严重情况中信任联系人会看到什么。' }
          ]
        }
      ]
    },
    'how-it-works': {
      seo: {
        title: 'Pusaka 如何运作 | Pusaka',
        description: '通过六个引导步骤建立实用的家庭移交计划。'
      },
      sections: [
        {
          eyebrow: '引导式设置',
          title: '用六个稳定步骤创建第一版。',
          body: '官网流程与移动 App 保持一致，让家庭先从安全线索开始，再逐步完善计划。',
          items: [
            { title: '先添加人', body: '先记录家庭成员和两个信任联系人，再添加资产线索。' },
            { title: '保持线索安全', body: '使用机构名称、文件夹位置或文件提示，不填写敏感秘密。' },
            { title: '查看移交效果', body: '通过紧急预览理解信任联系人可能看到的内容。' }
          ]
        }
      ]
    },
    security: {
      seo: {
        title: '安全与隐私 | Pusaka',
        description: 'Pusaka 存储线索而不是秘密，并明确 AI 与区块链边界。'
      },
      sections: [
        {
          eyebrow: '数据边界',
          title: '保存线索，不保存秘密。',
          body: 'Pusaka 面向实际线索和家庭协作设计，不是密码、私钥、银行账号、余额或完整身份证件的保险箱。',
          items: [
            { title: 'AI 边界', body: 'AI 客服只回答产品和设置问题。' },
            { title: '区块链边界', body: '未来 proof-of-plan 只存哈希，原始计划数据不上链。' },
            { title: '马来西亚优先审查', body: '生产发布前会审查 PDPA 和跨境处理披露。' }
          ]
        }
      ]
    },
    'ai-support': {
      seo: {
        title: 'AI 客服 | Pusaka',
        description: '用清楚边界向 Pusaka AI 提问设置相关问题。'
      },
      sections: [
        {
          eyebrow: '平实语言帮助',
          title: '询问设置问题，不把它变成法律文件。',
          body: 'Pusaka AI 可以解释信任联系人、资产线索、准备度评分和紧急预览等产品概念。',
          items: [
            { title: '适合提问', body: '为什么需要两个信任联系人？' },
            { title: '适合提问', body: '资产线索应该怎么写？' },
            { title: '边界', body: '它不能起草法律文件，也不能推荐投资、保单、钱包、服务商或律师事务所。' }
          ]
        }
      ]
    },
    faq: {
      seo: {
        title: '常见问题 | Pusaka',
        description: '了解 Pusaka 家庭韧性规划、数据安全、AI 和区块链边界。'
      },
      sections: [],
      groups: [
        {
          title: '开始使用',
          items: [
            { question: 'Pusaka 是什么？', answer: 'Pusaka 是一款家庭韧性规划产品，帮助记录信任联系人、资产线索、准备度缺口和紧急移交预览。' },
            { question: '适合谁使用？', answer: '适合希望家人在严重情况发生时知道该联系谁、该从哪里找起的家庭。' },
            { question: '设置需要多久？', answer: '从一个信任联系人和几条安全线索开始，就可以形成有用的第一版。' }
          ]
        },
        {
          title: '数据安全',
          items: [
            { question: '可以填写密码吗？', answer: '不可以。不要填写密码、私钥、银行账号、余额或完整身份证件。' },
            { question: '什么算资产线索？', answer: '例如机构名称、文件夹位置、文件位置提示或类别等安全线索。' },
            { question: '之后可以删除信息吗？', answer: '生产产品计划提供清晰的数据删除和流程透明说明。' }
          ]
        },
        {
          title: 'AI 与区块链',
          items: [
            { question: 'AI 可以给法律或金融建议吗？', answer: '不可以。Pusaka AI 只提供产品指引和家庭规划提示。' },
            { question: '我的家庭数据会上链吗？', answer: '不会。未来 proof-of-plan 只存哈希，不存原始家庭计划数据。' }
          ]
        }
      ]
    }
  }
};

export function getCommonContent(locale: Locale): CommonContent {
  return common[locale];
}

export function getPageContent<T extends PageContent | FaqContent = PageContent>(locale: Locale, page: string): T {
  const content = pages[locale][page];

  if (!content) {
    throw new Error(`Missing page content for ${locale}/${page}`);
  }

  return content as T;
}

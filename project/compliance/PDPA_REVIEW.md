# WB-9：马来西亚 / 新加坡 PDPA 合规审查

> 对应 Jira [WB-9](https://growth-more.atlassian.net/browse/WB-9)，所属 Epic [WB-1](https://growth-more.atlassian.net/browse/WB-1)。
> 本文档为产品/工程侧的合规初筛，**非法律意见**，正式上线前仍需本地执业律师确认（见 PRD.md 合规清单）。

## 1. 马来西亚 PDPA 2010

### 1.1 跨境数据传输（关键，直接影响技术架构）

2025 年 4 月发布的《跨境个人数据传输指引》明确了 PDPA 第 129 条的执行细则。数据控制者（即 Willbe）将马来西亚用户个人数据传输至境外，必须满足以下任一条件：

1. 目的地司法辖区有**实质相似**于 PDPA 的法律；或
2. 目的地提供**同等充分**的数据保护水平；或
3. 完成**传输影响评估（Transfer Impact Assessment, TIA）**，结论有效期 3 年；或
4. 取得用户**明确同意**（须先提供个人数据保护通知，说明接收方类别与传输目的，并按 2013 年法规留存同意记录）；或
5. 符合第 129 条列出的 7 项例外情形之一（如履行合约必需、保护数据主体重大利益等）。

**对我们架构的直接影响**：
- AI 客服/Gap 分析调用 Claude API（数据处理发生在美国/海外）、区块链 anchoring 服务调用海外 RPC 节点、托管钱包 SDK（Privy/Web3Auth/Magic 服务器多在美国/欧盟）— 这些都构成"跨境传输"，需要在产品中加入显式同意流程，并保留同意记录。
- 建议：
  - 在 onboarding 阶段加入"数据可能传输至海外服务商处理"的 PDP Notice + 明确同意勾选（而非笼统隐私政策一笔带过）。
  - 评估是否需要为马来西亚用户单独做一次 TIA（覆盖 AWS/GCP 区域、Anthropic、托管钱包服务商），3 年内复用。
  - 数据库主区域优先选择新加坡（AWS ap-southeast-1），减少不必要的额外跨境环节。

### 1.2 同意与处理

- 收集个人数据前必须告知目的、第三方类别、用户权利（PDPA 七大原则：通知、选择与同意、披露、安全、保留、数据完整性、访问）。
- 资产引用模块（银行/保险/房产）涉及第三方（家人）信息时，需确认"代为登记联系人信息"是否需要联系人本人同意 — **待法务确认**，产品上可加入"我已获得该联系人同意"的勾选作为缓释措施。

### 1.3 与原 PRD 风险点的关键修正

PRD.md 中"链上不可篡改 vs 被遗忘权冲突"的风险被**高估**：PDPA 2010 本身**没有强制的"删除权/被遗忘权"**条款，核心义务是"保留原则"（数据使用目的达成后不应无限期保留）和用户的访问/更正权，而非主动删除请求权。这意味着：
- 合规底线其实更宽松：链上仅存哈希、原始数据可在用户主动注销账户时清除，已经满足"不超出必要目的保留"的精神。
- 但作为产品体验承诺（"我们不存密码/余额/私钥"），仍建议保留主动删除功能，这是**产品信任设计**而非纯法律强制项。

## 2. 新加坡 PDPA（如扩展至该市场）

### 2.1 同意撤回（第 16 条）

用户可随时提前合理通知撤回同意；撤回后机构必须**停止**collect/use/disclose 该数据（及其数据中介/代理方同步停止），除非有其他法律依据继续处理。机构需在处理撤回请求前告知用户撤回的后续影响（如"撤回后将无法继续生成紧急移交报告"）。

**产品设计要求**：账户设置页需要有清晰的"撤回同意"入口，并在用户点击时弹出影响说明（而非直接静默处理）。

### 2.2 数据删除

与马来西亚类似，**新加坡 PDPA 并未赋予用户绝对的删除请求权**：机构仅在"收集目的已达成且无业务/法律必要保留"时才需删除数据，可以基于业务/法律需要继续留存。

**结论**：两地法律均未强制"被遗忘权"，链上哈希存证方案的法律风险低于 PRD 最初评估；"仅哈希上链 + 原始数据可注销时清除"的设计**留有余量**，可视为高于最低合规标准的信任承诺。

## 3. 待法务确认事项（更新后的合规清单，替换 PRD.md 第 8 节）

- [ ] 跨境传输 TIA 范围确认（Claude API / 托管钱包服务商 / 云服务区域）
- [ ] onboarding 同意流程文案（含跨境传输披露）法务审定
- [ ] "代登记联系人信息"是否需要联系人本人同意 — 法律定性
- [ ] 撤回同意的产品流程（账户设置页文案 + 后续数据处理规则）法务审定
- [ ] 数据保留期限政策（多久不活跃后视为"目的已达成"可清理）

## 4. 信息来源

- [Malaysia's groundbreaking Cross Border Data Transfer Guidelines explained](https://www.hoganlovells.com/en/publications/malaysias-groundbreaking-cross-border-data-transfer-guidelines-explained)
- [3/2025 Cross Border Personal Data Transfer Guideline (PDF, 官方)](https://www.pdp.gov.my/ppdpv1/wp-content/uploads/2025/08/GP_CBPDT_EN-1.pdf)
- [New Guidelines on Cross-Border Personal Data Transfer — Rahmat Lim & Partners](https://www.rahmatlim.com/publication/articles/30646/new-guidelines-on-cross-border-personal-data-transfer)
- [PDPC: Data Protection Obligations (Singapore)](https://www.pdpc.gov.sg/overview-of-pdpa/the-legislation/personal-data-protection-act/data-protection-obligations)
- [Top 5 FAQs on PDPA (PDPC 官方 PDF)](https://www.pdpc.gov.sg/-/media/Files/PDPC/PDF-Files/Resource-for-Individuals/poster---top-5-faqs-on-pdpa.pdf)

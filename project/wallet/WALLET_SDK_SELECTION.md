# WB-10：托管钱包 SDK 选型（Privy / Web3Auth / Magic）

> 对应 Jira [WB-10](https://growth-more.atlassian.net/browse/WB-10)，所属 Epic [WB-1](https://growth-more.atlassian.net/browse/WB-1)。

## 1. 候选概览（2026年市场现状）

市场格局已发生变化，影响选型权重：

| SDK | 归属/动态 | 定价（2026） | 核心定位 |
|---|---|---|---|
| **Privy** | 已被 **Stripe** 收购（2025.06），与 Bridge 稳定币平台打通 | Core 层 $299/月起含 2,500 MAU，免费层 499 MAU，超量按用量计费 | 消费级 onboarding 体验最成熟，专做嵌入式钱包+智能账户 |
| **Web3Auth** | 已被 **MetaMask** 收购 | 最低 $69/月起（基础社交登录） | 偏"认证层"，不含智能账户/Gas代付/Paymaster，需自建 |
| **Magic** | 保持独立 | 无密码登录方案 $499/月起 | 邮箱无密码登录最简单，但功能集中在认证，钱包能力较薄 |

三者均为 EVM 兼容方案，理论上都支持 Polygon，但官方资料未给出 Polygon 专项条款差异，需在 PoC 阶段实测 Gas 代付/Paymaster 在 Polygon 上的实际表现。

## 2. 对 Willbe 场景的评估

Willbe 的钱包诉求是"用户无感"的托管模式（Web3 in Web2）：用户注册即自动生成钱包，无需理解私钥，仅用于未来的 Proof of Plan 存证写入和紧急移交授权动作。评估维度：

| 维度 | Privy | Web3Auth | Magic |
|---|---|---|---|
| 嵌入式钱包 + 智能账户/Gas代付（减少用户对"区块链"的感知） | ✅ 原生支持 | ❌ 需自行集成 Paymaster | 部分支持，能力较弱 |
| 消费级 onboarding 转化率（行业口碑） | ✅ 公认领先 | 中等 | 中等，定位简单场景 |
| 入门定价 | 中（$299/月起，但免费层覆盖早期 499 MAU，适合 MVP 阶段） | 低（$69/月起） | 高（$499/月起） |
| 未来稳定币/支付能力扩展性（如未来做遗产资产的链上转移） | ✅ Stripe+Bridge 生态，天然贴近合规支付轨道 | 一般 | 一般 |
| 东南亚市场支持/案例 | 有消费应用案例，需 PoC 验证本地化（多语言/合规KYC） | 有，但偏 DeFi/交易场景 | 案例较少 |

## 3. 推荐

**主选：Privy**

理由：
1. Willbe 的核心痛点是"让完全不懂区块链的家庭用户无感使用钱包"——Privy 的嵌入式钱包 + 智能账户能力直接命中这一需求，免去自建 Paymaster/Gas代付层的工程量。
2. 被 Stripe 收购后与 Bridge 稳定币打通，为 Phase 3"多方验证/资产移交"等可能涉及合规支付的演进路径预留了空间，避免未来二次迁移钱包基础设施。
3. 免费层 499 MAU 足够支撑 MVP 阶段验证，成本可控。

**备选：Web3Auth**

如 PoC 阶段发现 Privy 的 Gas 代付在 Polygon 上的实际成本/延迟不达预期，或预算严格受限，Web3Auth 更低的入门定价（$69/月）可作为成本敏感场景的退路，但需自行补齐智能账户/Paymaster 能力，工程成本需纳入对比。

**不推荐：Magic**

定价最高但钱包能力集中在认证层，与 Privy 相比性价比和功能覆盖均不占优，且东南亚案例较少，暂不作为候选。

## 4. PoC 验证项（在最终拍板前完成）

- [ ] 在 Polygon（Amoy 测试网）上验证 Privy 嵌入式钱包创建 + Gas 代付的实际延迟与成本 — **桌面调研已完成，实测待执行**（见 4.1，需要真实 Privy 账号/API key 才能测出真实数字，不能由 AI 代为开户/实测）
- [x] 验证 Privy 在马来西亚/新加坡的合规姿态（是否需要额外的本地 KYC/AML 流程对接）— 见 4.2
- [x] 确认与现有 Node.js + Express 后端的 SDK 集成方式（Server SDK vs Client SDK 职责划分）— 见 4.3
- [x] 评估退出成本：若未来需要迁移到自托管钱包方案，用户资产/钱包地址的可迁移性 — 见 4.4

### 4.1 Polygon Amoy Gas 代付：桌面调研发现（实测仍待执行）

- Privy 的 "App pays"（应用代付）Gas 代付方案**同时支持 Polygon 主网与 Polygon Amoy 测试网**，覆盖其全部 20+ 主网 / 14+ 测试网范围；开发侧只需在发送交易时传入 `sponsor: true`，无需自建 bundler/paymaster。
- 关键技术前提：**必须使用 Privy 的 TEE（Trusted Execution Environment）执行模式**才能使用原生 Gas 代付能力——这意味着钱包创建模式需要选择 TEE 钱包（Privy 现行默认架构），需要在实测阶段确认与 Privy Dashboard 的钱包配置是否默认满足此前提。
- 代付费用 = **实际链上 Gas 成本 + 托管服务的便利费（convenience fee）**，官方文档未公开便利费具体费率/费率表，需要在创建测试网应用后于 Dashboard 或销售对话中获取实际报价。
- 官方文档未给出 Polygon/Amoy 专项的延迟数字。唯一可查到的延迟参考是第三方实现（Privy Python Auth 项目）报告的"sub-second latency，95% 成功率"——这是**别人的 Python SDK 实现的自测数据，不是 Willbe 的实测，也不是 Polygon 链专项数据**，仅供参考，不可作为选型依据。
- **结论**：方案在文档层面可行（Amoy 测试网 + App pays 受支持），但"实际延迟与成本"这一验证项的字面要求——跑一笔真实测试网交易、测出真实数字——必须有人持 Privy 账号和 API key 在 Amoy 上实际发起交易才能完成。这一步无法由 AI 代理代为执行（涉及第三方账号注册/可能的计费同意），需要工程团队人工完成，建议作为 WB-17 启动前的第一个 spike 任务。

### 4.2 马来西亚/新加坡合规姿态：桌面调研发现

- **新加坡**：2025 年生效的 DTSP（Digital Token Service Provider）新规下，"托管服务"被认定为"能够控制访问代币的能力（包括持有多签私钥分片之一）"，即使不具备唯一/排他控制权也可能被认定为托管。但 MAS 明确**仅监管"数字支付代币"（DPT）和"资本市场产品的数字化代表"**，对于"仅作为效用/治理用途"的代币不在牌照监管范围内；MAS 评估"看实质不看形式"。
  - **对 Willbe 的含义**：Pusaka 的托管钱包**从不持有、转移或交换代表客户资产价值的支付代币**——唯一的链上动作是把"计划摘要哈希"写入 Proof of Plan 合约。这与 MAS 监管的"DPT 托管/转移/交换"实质不同，构成"可能落在 DTSP 牌照范围之外"的论据。但这是基于公开资料的**初步研判，不是法律意见**，与 `compliance/PDPA_REVIEW.md` 中已列出的"跨境传输 TIA 范围确认"等待法务确认事项保持一致——最终仍需法务/当地持牌顾问书面确认。
- **马来西亚**：数字资产交易平台需注册为 RMO-DAX，且证监会（SC）的"数字资产托管人（DAC）"制度适用于"为他人提供资产托管服务"的机构。Willbe 的钱包同样不为客户托管可交易的数字资产价值，论证逻辑与新加坡一致——倾向于落在 RMO-DAX/DAC 监管范围之外，但同样需法务确认。
- **Privy 自身的安全/合规姿态**：Privy 维持 **SOC2 Type I/II** 认证（每年更新），并接受 Cure53、Zellic、SwordBytes、Doyensec 等机构的常态化渗透测试；Privy 提供"灵活托管"能力，允许应用在自托管/托管/客户可控三种模式间切换以适配不同司法辖区要求，但公开资料未披露其在马来西亚/新加坡是否持有当地 MSB 或同类牌照——需直接向 Privy 销售/合规团队书面确认。

### 4.3 SDK 集成方式：Server SDK vs Client SDK 职责划分

- **客户端（App，Expo）**：使用 `@privy-io/expo`，负责用户登录（邮箱/社交）、嵌入式钱包的创建与本地体验、签发 Privy access token。这一层处理"用户感知"的部分（与 PRD"用户无感创建钱包"的目标一致——用户只看到登录，看不到钱包概念）。
- **服务端（backend，Express）**：使用 `@privy-io/node`（注意：旧版 `@privy-io/server-auth` 已废弃，新项目直接用 `@privy-io/node`），职责包括：校验 App 传来的 access token、查询/管理用户与钱包、以及**代表用户触发服务端签名交易**。
- **对 Willbe 架构的关键含义**：PRD 中"区块链层"被设计为独立的 anchoring 微服务（哈希生成 + 写链），而不是由用户手机 App 直接发起链上写入。这意味着 Proof of Plan 的哈希锚定、紧急移交授权动作，都应该由**后端 anchoring 服务通过 `@privy-io/node` 以服务端策略触发签名**，而不依赖用户当时打开 App。这正是 Privy"服务端控制的嵌入式钱包"模式要解决的场景，但"后端能否在用户不在线时对其嵌入式钱包发起策略化签名"这一具体能力，需要在 4.1 的实测 spike 中一并验证（即不只测延迟/成本，也测服务端无人值守触发签名是否可行）。

### 4.4 退出成本评估：迁移到自托管钱包的可迁移性

- Privy 的嵌入式钱包设计上**不锁定用户**：钱包私钥可随时导出（"Export a wallet"能力），导出后可直接在 MetaMask/Phantom 等标准钱包中使用**同一个钱包地址**——不存在"换地址迁移"的问题，只是钥匙托管方式从 Privy 切换为用户自持。
- Privy 同样支持反向操作（把已有的托管钱包私钥迁入 Privy），说明其架构本身就是为"双向迁移无锁定"设计的非托管底座。
- Privy 提到正在与多家钱包提供商合作"一键迁移"，但目前**官方保证的是基础的手动密钥导出**，"一键迁移到其他特定提供商"仍在合作开发中，不能假设所有目标钱包都有现成的一键路径。
- **结论**：退出成本评估为**低**——核心保障（地址不变 + 密钥可随时导出）已经具备，剩余风险只是"导出后是否方便接入下一个具体目标方案"，可在真正需要迁移时再评估目标方案的导入体验，不构成现在选型的阻碍。

## 5. 信息来源

- [Top 7 Privy Alternatives in 2026 — Openfort](https://www.openfort.io/blog/privy-alternatives)
- [Web3 Wallet Showdown: Which Platform Fits Your Needs? — Web3Auth Blog](https://blog.web3auth.io/waas-wallet-comparison/)
- [Privy – Pricing](https://www.privy.io/pricing)
- [Privy – The embedded wallet stack for modern products](https://www.privy.io/wallets)
- [Top 7 Web3Auth Alternatives in 2026 — Openfort](https://www.openfort.io/blog/web3auth-alternatives)

### PoC 验证项调研来源（4.1–4.4，本次新增）

- [Privy Docs — Gas sponsorship overview](https://docs.privy.io/wallets/gas-and-asset-management/gas/overview)
- [Privy Docs — Gas sponsorship setup ("App pays")](https://docs.privy.io/wallets/gas-and-asset-management/gas/setup)
- [Privy Docs — Using Privy from your server (`@privy-io/node`)](https://docs.privy.io/guide/server/)
- [Privy Docs — Export a wallet](https://docs.privy.io/wallets/wallets/export)
- [Privy Blog — Bringing your users to Privy (migration)](https://privy.io/blog/migrating-your-users-to-privy)
- [Privy Blog — Sweating the details, Part 2: Wallet interoperability](https://privy.io/blog/wallet-interoperability)
- [Privy Trust Center](https://trust.privy.io/)
- [Privy — Wallet infrastructure to build stablecoin products](https://www.privy.io/fintech)
- [MAS — Guidelines on Licensing for Digital Token Service Providers](https://www.mas.gov.sg/regulation/guidelines/guidelines-on-licensing-for-dtsps)
- [MAS clarifies regulatory regime for Digital Token Service Providers (2025)](https://www.mas.gov.sg/news/media-releases/2025/mas-clarifies-regulatory-regime-for-digital-token-service-providers)
- [Bird & Bird — Assessing the scope of Part 9 FSMA 2022 for DTSPs](https://www.twobirds.com/en/insights/2025/singapore/assessing-the-scope-of-part-9-of-the-financial-services-and-markets-act-2022-for-digital-token-servi)
- [Is Crypto Legal in Malaysia? Regulations & Compliance in 2026 — Lightspark](https://www.lightspark.com/knowledge/is-crypto-legal-in-malaysia)
- [Crypto Licence in Malaysia 2026 — YB Case](https://ybcase.com/en/fintech/kriptolicenzia-v-malajzii)

> 注：以上为公开资料的桌面调研，不构成法律意见。最终结论仍需法务/当地持牌顾问书面确认，对应 `compliance/PDPA_REVIEW.md` 中"待法务最终确认事项"。

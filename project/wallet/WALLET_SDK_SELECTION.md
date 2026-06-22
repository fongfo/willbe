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

- [ ] 在 Polygon（Amoy 测试网）上验证 Privy 嵌入式钱包创建 + Gas 代付的实际延迟与成本
- [ ] 验证 Privy 在马来西亚/新加坡的合规姿态（是否需要额外的本地 KYC/AML 流程对接）
- [ ] 确认与现有 Node.js + Express 后端的 SDK 集成方式（Server SDK vs Client SDK 职责划分）
- [ ] 评估退出成本：若未来需要迁移到自托管钱包方案，用户资产/钱包地址的可迁移性

## 5. 信息来源

- [Top 7 Privy Alternatives in 2026 — Openfort](https://www.openfort.io/blog/privy-alternatives)
- [Web3 Wallet Showdown: Which Platform Fits Your Needs? — Web3Auth Blog](https://blog.web3auth.io/waas-wallet-comparison/)
- [Privy – Pricing](https://www.privy.io/pricing)
- [Privy – The embedded wallet stack for modern products](https://www.privy.io/wallets)
- [Top 7 Web3Auth Alternatives in 2026 — Openfort](https://www.openfort.io/blog/web3auth-alternatives)

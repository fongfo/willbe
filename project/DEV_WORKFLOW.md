# Willbe 开发流程（开发 - 测试 - 评审）

> 在全局 Agent Pipeline（见 `~/.claude/rules/common/development-workflow.md`）基础上，针对 Willbe 三大子系统（App、区块链存证服务、AI 服务）细化。

## 1. 分支策略

- `main`：受保护，禁止直接提交（全局规则已强制）
- `develop`：集成分支，Phase 内功能合并入口
- `feature/<epic-key>-<short-desc>`：如 `feature/WB-12-family-member-form`，对应 Jira issue key
- `hotfix/<issue-key>`：生产问题修复

## 2. 标准功能开发流程（每个 Jira Task 执行）

| 步骤 | 执行者 | 产出 |
|---|---|---|
| 1. 研究复用 | Claude | 检查现有实现/开源库/SDK，避免重复造轮子 |
| 2. 规划 | **planner** agent | 实现方案、依赖、风险 |
| 3. 写失败测试（RED） | **tdd-guide** agent | 对应单测/集成测试，此时必须失败 |
| 4. 写实现（GREEN） | Claude（开发者角色） | 最小实现通过测试，再重构 |
| 5. 代码审查 | **code-reviewer** agent（+ 对应语言 reviewer） | 质量、可读性、架构问题清单 |
| 6. 安全审查 | **security-reviewer** agent | 涉及钱包/链上交互/用户资产数据/AI输入输出时**必须** |
| 7. 提交 & PR | Claude | 遵循 commit 规范，PR 含测试计划 |

CRITICAL：从下一个 Jira Task 开始，每次代码修改或功能开发完成后，提交、合并或推送前必须执行一次 code review。
CRITICAL：code review 是合并门禁，至少覆盖本次 diff 的正确性、架构一致性、类型安全、测试覆盖与回归风险。
CRITICAL：review 发现的 CRITICAL / HIGH 问题必须先回到步骤4修复并复测，之后重新 review；不得以“测试通过”为理由跳过 review。
CRITICAL：步骤6发现问题必须回到步骤4修复，不允许跳过直接合并。

## 3. 分子系统的测试重点

### 3.1 App（React Native）
- 单元测试：表单校验、状态管理（家庭成员/联系人/资产 CRUD）
- 集成测试：六步流程串联、API 调用
- E2E：完整用户旅程（注册→六步设置→生成 Gap 报告→紧急移交预览），用 **e2e-runner** agent

### 3.2 区块链存证服务
- 单元测试：哈希生成逻辑、Merkle root 计算
- 集成测试：托管钱包 SDK mock 调用、合约写入（测试网）
- **安全审查必选项**：私钥托管流程、合约权限模型、重放攻击防护
- 不在生产前提交的：任何写入主网的代码必须先在测试网（Polygon Amoy/Mumbai）验证

### 3.3 AI 服务（客服 + Gap 分析）
- 单元测试：规则引擎打分逻辑（沿用原型 `computeAssessment` 思路，需先有失败测试覆盖边界条件）
- 集成测试：RAG 检索准确性（知识库命中率）、LLM 输出结构化校验
- **必须人工抽样评审**：AI 生成内容是否越界给出"财务/法律建议"（合规红线）
- Prompt 变更需要回归测试一组固定 case，防止静默行为漂移

## 4. 代码审查门槛（继承全局标准）

- 每次代码修改都必须 review；纯文档修改可做轻量 review，但仍需检查准确性、链接和流程一致性。
- CRITICAL：阻断合并（安全漏洞、数据丢失风险、合规越界）
- HIGH：合并前应修复
- 覆盖率：≥80%（单元+集成）
- 函数 <50 行，文件 <800 行，嵌套 <4 层

## 5. CI/CD 检查项

1. Lint + 类型检查（TypeScript strict）
2. 单元/集成测试 + 覆盖率门槛
3. 安全扫描（依赖漏洞、硬编码密钥检测）
4. 区块链服务：测试网交易模拟通过
5. AI 服务：固定 prompt 回归集通过
6. 通过后才允许合并入 `develop`

## 6. 发布流程

- `develop` → Phase 验收（对应 Jira Epic 下所有 Task 完成）→ 合并入 `main`
- 区块链相关变更上主网前需额外人工审批（不可逆操作）
- 发布后 24h 内监控：AI 服务异常率、链上交易失败率、关键流程转化率

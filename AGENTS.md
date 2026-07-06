# Willbe (Pusaka) — 项目开发助手

> 本文件是项目级指令，继承全局规则（`~/.Codex/AGENTS.md` 及 `~/.Codex/rules/`）。
> 开发流程的完整定义见 [`project/DEV_WORKFLOW.md`](../project/DEV_WORKFLOW.md)，产品范围见 [`project/PRD.md`](../project/PRD.md)。

## 项目概述

Willbe（产品名 **Pusaka**）是面向东南亚家庭（**马来西亚优先**）的**家庭韧性 / 传承规划平台**。
用户通过引导式流程登记家庭成员、信任联系人、资产线索，生成「准备度 / Gap 报告」与「紧急移交预览」；
后续阶段引入**区块链存证**与 **AI 服务**（智能客服 + Gap 分析）。

Jira 项目：`WB`（growth-more.atlassian.net）。GitHub：`github.com/fongfo/willbe`。

## 仓库结构

| 路径 | 内容 | 技术栈 |
|---|---|---|
| `app/` | 移动端 App | React Native + **Expo ~56** + TypeScript |
| `backend/` | 后端 API | Node.js + **Express 4** + TypeScript + **Prisma 6** + PostgreSQL + Redis |
| `project/` | 产品文档、合规审查、品牌、设计原型 | — |
| `project/design_demo/app_prototype/` | 可点击 HTML 原型（打开 `index.html`） | — |
| `services/anchoring`（未来） | 区块链存证服务 | WB-3/4/5 启动时新建 |
| `services/ai`（未来） | AI 服务（客服 + Gap 分析） | WB-3/4/5 启动时新建 |

> 区块链 / AI 代码库尚未脚手架化，避免空目录。启动对应 Jira Epic 时才创建。

## 后端架构（backend/）

### 分层模式（CRITICAL — 每个功能模块严格遵循）

每个领域功能是一个目录（如 `src/asset-references/`），固定四层：

```
<feature>/
├── <feature>.schema.ts      # Zod schema（入参校验 + 类型推导）
├── <feature>.repository.ts  # 数据访问层，封装 Prisma client
├── <feature>.service.ts     # 业务逻辑，依赖 repository（构造函数注入）
└── <feature>.routes.ts      # Express Router，校验 → 调 service → 统一响应
```

- 新增功能时**照搬现有模块结构**（`family-members` / `trusted-contacts` / `asset-references` 是模板）。
- `app.ts` 仅负责装配：`createApp()` 注册 `express.json({ limit: '10kb' })` 和各 router，**不写业务逻辑**。
- `index.ts` 仅负责启动监听（默认端口 **4000**，健康检查 `GET /health`）。

### 已实现的 API（统一前缀 `/api`）

| 资源 | 路由前缀 | 方法 |
|---|---|---|
| 家庭成员 | `/api/family-members` | POST / GET / GET :id / PATCH :id / DELETE :id |
| 信任联系人 | `/api/trusted-contacts` | 同上 |
| 资产线索 | `/api/asset-references` | 同上 |

### 数据模型（Prisma，`backend/prisma/schema.prisma`）

- `FamilyMember`（`family_members`）：name, relation(enum), detail
- `TrustedContact`（`trusted_contacts`）：name, relation, role(PRIMARY/BACKUP), phone, email, verificationStatus
- `AssetReference`（`asset_references`）：name, category(BANK/INSURANCE/PROPERTY/INVESTMENT/CRYPTO/OTHER), locationHint, detail
- 约定：`id` 为 uuid；`createdAt`/`updatedAt` 自动维护；表名用 `@@map` 映射 snake_case。
- Prisma client 生成到 `src/generated/prisma`（**不要手改、不要审查生成代码**）。

## 项目约定（CRITICAL）

### API 响应格式
所有 endpoint 统一信封，**不要自创格式**：
```typescript
res.status(2xx).json({ success: true, data })           // 成功
res.status(4xx/5xx).json({ success: false, error })     // 失败
// DELETE 成功返回 204，无 body
```

### 输入校验
- **所有外部输入用 Zod 校验**（`*.schema.ts` 里 `safeParse`），失败返回 400 + 首条 issue 消息。
- 路径参数（如 `:id`）也要过 `idParamSchema` 校验。

### 错误处理
- 业务错误抛 `HttpError`（`src/shared/http-error.ts`），routes 层 `handleError` 统一转响应。
- 未知错误一律 500 + `'Internal server error'`，**不泄露内部细节 / 堆栈**。

### 安全 / 限流
- 每个 router 挂 `express-rate-limit`（15 分钟窗口，max 100）。新路由必须保持限流。
- 密钥只走环境变量（`DATABASE_URL` 等），**绝不硬编码**，绝不提交 `.env`。

### TypeScript
- 严格模式；导出函数标注参数/返回类型；避免 `any`，外部输入用 `unknown` 再收窄。
- 生产代码无 `console.log`（启动日志用 `console.warn` 并已 eslint-disable）。

### 文件 / 命名
- 模块文件 kebab-case + 分层后缀（`asset-reference.service.ts`）。
- 函数 <50 行，文件 <800 行，嵌套 <4 层（不可变更新，禁止原地 mutate）。

## 分支策略（CRITICAL）

- `main`：受保护，**禁止直接提交 / 直接 push**。
- `develop`：集成分支，功能合并入口。
- `feature/<jira-key>-<short-desc>`：如 `feature/WB-13-asset-reference-crud`。
- `hotfix/<issue-key>`：生产修复。
- 提交信息遵循 conventional commits，并带 Jira key：`feat(WB-13): add asset reference CRUD API`。
- 推送：先到 feature 分支 → PR → 审查通过后合并入 `develop`；Phase 验收后合并入 `main`。

## 标准功能开发流程（每个 Jira Task）

继承全局 Agent Pipeline，针对本项目要点：

| 步骤 | 执行者 | 说明 |
|---|---|---|
| 1. 研究复用 | Codex | 查现有模块 / 开源库，**照模板复用**，避免重复造轮子 |
| 2. 规划 | **planner** agent | 实现方案、依赖、风险 |
| 3. 写失败测试（RED） | **tdd-guide** agent | 单测 + 集成测试（supertest），此时必须失败 |
| 4. 写实现（GREEN） | Codex | 最小实现通过测试，再重构 |
| 5. 代码审查 | **code-reviewer** + **typescript-reviewer** | 质量、可读性、架构 |
| 6. 安全审查 | **security-reviewer** | 涉及用户资产数据 / 钱包 / 链上交互 / AI 输入输出时**必须** |
| 7. 提交 & PR | Codex | conventional commit + 测试计划 |

- **从下一个 Jira Task 开始，每次代码修改或功能开发完成后，提交 / 合并 / 推送前必须执行一次 code review**。
- Code review 是合并门禁：至少覆盖本次 diff 的正确性、架构一致性、TypeScript 类型安全、测试覆盖与回归风险。
- Review 发现的 CRITICAL / HIGH 问题必须先修复并复测，之后重新 review；不得以“测试通过”为理由跳过 review。
- 步骤 6 发现 CRITICAL 必须回步骤 4 修复，**不允许跳过直接合并**。
- 覆盖率门槛 **≥80%**（单元 + 集成）。
- 数据库 schema 变更需配套 Prisma migration（`prisma/migrations/`）。

## 常用命令

### 本地基础设施
```bash
docker compose up -d        # 启动 Postgres(5432) + Redis(6379)
```

### 后端（backend/，端口 4000）
```bash
npm run dev          # ts-node-dev 热重载，http://localhost:4000/health
npm run build        # tsc 编译到 dist/
npm run lint         # eslint，--max-warnings=0
npm run typecheck    # tsc --noEmit
npm test             # jest --coverage（提交前必跑）
npm run db:migrate   # prisma migrate dev
npm run db:studio    # prisma studio
```

### App（app/，Expo ~56 / RN 0.85）
```bash
npm start            # expo start
npm run android      # expo start --android
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # jest --coverage
```

> ⚠️ Expo 56 与旧版差异大。改 App 代码前先看 `app/AGENTS.md` 指向的版本化文档：
> https://docs.expo.dev/versions/v56.0.0/

## CI（`.github/workflows/ci.yml`）

PR / push 到 `develop`、`main` 触发，Node 22：
1. **backend**：`npm ci` → lint → typecheck → `prisma migrate deploy`（对真实 Postgres service container）→ test
2. **app**：`npm ci` → lint → typecheck → test
3. **audit**：`npm audit --audit-level=high`

提交前本地至少跑通 `lint` + `typecheck` + `test`，避免 CI 红。

## 子系统测试重点（详见 DEV_WORKFLOW.md §3）

- **App**：表单校验、状态管理、六步流程串联、E2E 用户旅程（`e2e-runner`）。
- **区块链存证**：哈希 / Merkle root 逻辑、托管钱包 SDK mock；**主网前必须测试网验证（Polygon Amoy/Mumbai）**，安全审查必选。
- **AI 服务**：规则引擎打分、RAG 命中率、LLM 输出结构化校验；**合规红线** — 不得越界给出「财务 / 法律建议」，prompt 变更需固定 case 回归。

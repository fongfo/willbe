# @willbe/ai

AI 服务（Pusaka）。WB-20 实现第一版 RAG 知识库：产品文档、FAQ、法规摘要的结构化条目与确定性检索 API。
WB-21 增加 Claude 客服对话封装。WB-41 增加 DeepSeek provider 兼容与模型切换。
WB-24 增加 Gap 解释层：基于结构化 readiness gaps 生成自然语言建议和优先级说明。

当前服务通过 Anthropic-compatible Messages API 调用模型。默认 provider 为 `anthropic`；
设置 `AI_PROVIDER=deepseek` 时会使用 DeepSeek Anthropic-compatible endpoint。
缺少对应 provider API key 时，`/api/chat` 返回 503，不会静默 fallback 到非受控模型。

## 架构

沿用后端服务的分层模式：

```text
src/<feature>/
├── <feature>.types.ts
├── <feature>.repository.ts
├── <feature>.schema.ts
├── <feature>.service.ts
└── <feature>.routes.ts
```

知识库 seed 位于 `src/knowledge/knowledge.seed.ts`，条目包含：

- `PRODUCT_DOC`：产品流程、资产引用边界
- `FAQ`：信任联系人、紧急移交、AI 客服边界
- `REGULATORY_SUMMARY`：PDPA 跨境传输、AI 合规建议边界

## 安全与合规边界

- RAG 检索只返回来源片段和 metadata，不生成最终 AI 回复。
- `answerPolicy.responseMode` 固定为 `grounded_rag_context_only`。
- `answerPolicy.prohibitedAdvice` 固定包含 `financial`、`legal`、`insurance`。
- 涉及 PDPA / AI 建议边界的条目会设置 `disclaimerRequired: true`。
- API body 使用 Zod `.strict()` 校验，未知字段会被拒绝，避免 prompt 注入字段混入。
- 每个 router 启用 15 分钟 100 次的 rate limit。
- LLM prompt 强制要求只基于 RAG context 回答；知识库无命中时必须说明上下文不足。
- Gap 解释接口只接收结构化 gap metadata；未知字段会被拒绝，不接收资产名称、账号、location hint 等敏感线索。
- Gap 解释的 LLM 输出必须通过 JSON schema 和建议边界检查；失败时返回确定性 fallback 建议。
- Anthropic / DeepSeek API key 只从环境变量读取，测试使用 mock client，不调用外部网络。

## API

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/health` | 健康检查 |
| `POST` | `/api/chat` | 客服对话接口：RAG 检索 + 模型回复 |
| `POST` | `/api/gap-explanations` | Gap 解释接口：结构化 gaps → 自然语言建议 + 优先级排序 |
| `GET` | `/api/knowledge` | 列出知识库条目，可按 `category`、`locale` 过滤 |
| `POST` | `/api/knowledge/search` | 检索 RAG context |

响应统一信封：`{ success: true, data }` / `{ success: false, error }`。

### Search 请求示例

```json
{
  "query": "Malaysia PDPA cross border transfer Claude API",
  "category": "REGULATORY_SUMMARY",
  "limit": 5
}
```

### Chat 请求示例

```json
{
  "message": "Why do I need two trusted contacts?",
  "locale": "en",
  "history": [
    { "role": "user", "content": "I am setting up my plan." },
    { "role": "assistant", "content": "I can help with Pusaka product guidance." }
  ]
}
```

响应包含 `message`、`citations`、`answerPolicy`、`disclaimerRequired` 和 provider metadata。

### Gap Explanation 请求示例

```json
{
  "locale": "en",
  "score": 40,
  "level": "needs-work",
  "gaps": [
    {
      "id": "trusted-contacts-count",
      "category": "trusted_contacts",
      "title": "Add two trusted contacts",
      "detail": "Two contacts avoids a single point of failure during an emergency.",
      "severity": "high",
      "priority": 20,
      "action": { "label": "Add trusted contact", "route": "/trusted-contacts" },
      "evidence": { "current": 1, "required": 2, "unit": "trusted contacts" }
    }
  ]
}
```

响应包含 `summary`、按 `priority` 排序的 `recommendations`、`answerPolicy`、`disclaimerRequired`
和 provider metadata。模型不可用、返回坏 JSON 或越界建议时，服务会返回 `provider.name = "fallback"` 的确定性建议。

## Provider 配置

默认 Anthropic：

```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
ANTHROPIC_MAX_TOKENS=450
```

DeepSeek：

```bash
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=...
DEEPSEEK_BASE_URL=https://api.deepseek.com/anthropic
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_MAX_TOKENS=450
```

DeepSeek 兼容层使用 Anthropic API 格式。不要把 API key 提交到仓库；本地使用 `.env`，
部署使用 secret manager / CI secret。

## 常用命令（端口 4200）

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
```

# @willbe/ai

AI 服务（Pusaka）。WB-20 实现第一版 RAG 知识库：产品文档、FAQ、法规摘要的结构化条目与确定性检索 API。

当前服务**不调用 Claude / OpenAI / 任何外部 LLM**，也不保存用户输入。WB-21 接入模型时应复用本服务返回的 grounded context 和 `answerPolicy`。

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

## API

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/health` | 健康检查 |
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

## 常用命令（端口 4200）

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
```

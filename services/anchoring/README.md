# @willbe/anchoring

区块链存证服务（Pusaka）。本服务负责**托管钱包**与链上证明锚定（anchoring）。

> WB-19 阶段实现计划快照哈希、Merkle root、Proof of Plan gateway 抽象与 Mock
> anchoring API。当前默认仍**不接触真实私钥 / 真实链**。主网前必须经测试网验证
>（Polygon Amoy）与安全审查。

## 架构

沿用 `backend/` 的分层模式（每个领域一个目录，四层分离）：

```
src/<feature>/
├── <feature>.types.ts       # 类型 + 外部 provider/gateway 抽象
├── <feature>.repository.ts  # Repository 接口 + 内存实现（MVP）
├── <feature>.schema.ts      # Zod 入参校验
├── <feature>.service.ts     # 业务逻辑
└── <feature>.routes.ts      # Express Router
```

### 安全边界（CRITICAL）

- 托管钱包的私钥句柄（`keyReference`）**永不跨出服务边界**——API 仅返回公开地址。
- Anchoring API **不返回、不保存、不上链**计划快照明文；响应只包含 `planRef`、
  `merkleRoot`、`planHash`、版本、时间戳和 mock transaction metadata。
- `snapshot` 入站时会递归拒绝明显敏感字段：`password`、`privateKey`、`seedPhrase`、
  `accountNumber`、`balance` 等。业务调用方仍应只传计划摘要/引用信息，不传凭证。
- `planRef` 是 `ownerRef` 的单向摘要；链上/响应中用于证明同一计划版本连续性，不暴露
  用户身份。
- Mock Provider 不持有任何真实密钥；真实托管方（KMS / MPC）通过 `WalletProvider`
  接口替换，业务层与路由层无需改动。
- Mock Proof gateway 不调用 RPC，不签名，不广播交易；真实合约写入通过
  `ProofOfPlanGateway` 替换。
- 切换到真实 Provider / 测试网前**必须**安全审查（见根 `AGENTS.md`）。

## API（前缀 `/api`）

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/anchors` | 对计划快照生成 Merkle commitment，并通过 Proof gateway 锚定（返回 201）|
| `GET` | `/api/anchors/:ownerRef` | 查询某 owner 的最新 proof metadata（不存在 404）|
| `POST` | `/api/wallets` | 按 `ownerRef` 幂等获取或创建托管钱包（首次创建 201，已存在 200）|
| `GET` | `/api/wallets/:ownerRef` | 查询某 owner 的托管钱包（不存在 404）|

响应统一信封：`{ success, data }` / `{ success, error }`。

### Anchor 请求示例

```json
{
  "ownerRef": "internal-plan-or-user-ref",
  "snapshot": {
    "familyMembers": [{ "id": "m1", "relation": "SPOUSE" }],
    "trustedContacts": [{ "id": "c1", "role": "PRIMARY" }],
    "assetReferences": [{ "id": "a1", "category": "BANK", "locationHint": "Google Drive" }]
  }
}
```

`snapshot` 会被规范化为确定性 JSON，按顶层字段生成叶子哈希，再聚合为 Merkle root。
Proof of Plan 语义上只锚定 `planRef + planHash`，不锚定明文。

## 常用命令（端口 4100，健康检查 `GET /health`）

```bash
npm run dev        # ts-node-dev 热重载
npm run build      # tsc 编译到 dist/
npm run lint       # eslint --max-warnings=0
npm run typecheck  # tsc --noEmit
npm test           # jest --coverage（门槛 80%）
```

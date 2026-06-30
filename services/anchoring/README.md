# @willbe/anchoring

区块链存证服务（Pusaka）。本服务负责**托管钱包**与（未来的）链上证明锚定（anchoring）。

> 启动 WB-17 时脚手架化。当前阶段仅实现托管钱包的抽象层 + Mock Provider，
> **不接触真实私钥 / 真实链**。主网前必须经测试网验证（Polygon Amoy）与安全审查。

## 架构

沿用 `backend/` 的分层模式（每个领域一个目录，四层分离）：

```
src/wallets/
├── wallet.types.ts       # 类型 + WalletProvider 抽象接口
├── wallet.provider.ts    # MockWalletProvider（确定性地址，无真实密钥）
├── wallet.repository.ts   # WalletRepository 接口 + 内存实现（MVP）
├── wallet.schema.ts      # Zod 入参校验
├── wallet.service.ts     # 业务逻辑：用户无感知地获取/创建托管钱包
└── wallet.routes.ts      # Express Router
```

### 安全边界（CRITICAL）

- 托管钱包的私钥句柄（`keyReference`）**永不跨出服务边界**——API 仅返回公开地址。
- Mock Provider 不持有任何真实密钥；真实托管方（KMS / MPC）通过 `WalletProvider`
  接口替换，业务层与路由层无需改动。
- 切换到真实 Provider / 测试网前**必须**安全审查（见根 `CLAUDE.md`）。

## API（前缀 `/api`）

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/wallets` | 按 `ownerRef` 幂等获取或创建托管钱包（首次创建 201，已存在 200）|
| `GET` | `/api/wallets/:ownerRef` | 查询某 owner 的托管钱包（不存在 404）|

响应统一信封：`{ success, data }` / `{ success, error }`。

## 常用命令（端口 4100，健康检查 `GET /health`）

```bash
npm run dev        # ts-node-dev 热重载
npm run build      # tsc 编译到 dist/
npm run lint       # eslint --max-warnings=0
npm run typecheck  # tsc --noEmit
npm test           # jest --coverage（门槛 80%）
```

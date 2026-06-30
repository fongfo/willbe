# @willbe/anchoring-contracts

Proof of Plan 智能合约（Pusaka 区块链存证）。在链上锚定用户传承计划的**防篡改承诺（commitment）**。

> 隔离的 Hardhat 工作区，独立于 `services/anchoring` 的 Express 服务（Mocha/Chai 测试，
> 与服务的 Jest 互不干扰）。**链上只存哈希摘要，永不存计划明文**——延续 Pusaka
> 「只存引用、不存敏感数据」原则。

## 合约：`ProofOfPlan.sol`

| 成员 | 说明 |
|---|---|
| `anchorProof(planRef, planHash)` | 仅 owner（托管锚定服务）可调用。首次锚定 version=1，重复锚定自增 version 并替换哈希。`planRef`/`planHash` 不可为 0。|
| `getProof(planRef)` | 返回 `{ planHash, version, anchoredAt }`，未锚定返回零值。|
| `isAnchored(planRef)` | 该计划是否曾被锚定。|
| `anchoredPlanCount()` | 已锚定的不同计划数量。|
| `ProofAnchored` 事件 | 每次锚定/重锚定时发出。|

### 设计要点（安全 / 隐私）

- **链上零敏感数据**：`planRef` 是内部 owner 引用的 keccak256 摘要，`planHash` 是计划快照
  （如 Merkle root）的承诺；二者都不可逆推出个人信息。
- **访问控制**：基于 OpenZeppelin `Ownable`（经审计）。owner 即托管锚定服务的运营方；
  可通过 `transferOwnership` 移交。
- **测试网优先**：默认目标 Polygon Amoy（chainId 80002）。**主网部署前必须安全审查**
  （见根 `CLAUDE.md`）。

## 常用命令

```bash
npm install           # 安装 Hardhat 工具链
npm run compile       # 编译合约（solc 0.8.24）
npm test              # 运行 Mocha/Chai 测试（hardhat 本地网络）
npm run coverage      # solidity-coverage 覆盖率
npm run typecheck     # tsc --noEmit（脚本 / 测试）
```

## 部署到 Polygon Amoy 测试网

1. 复制 `.env.example` 为 `.env`，填入：
   - `AMOY_RPC_URL`（默认公共 RPC 即可）
   - `DEPLOYER_PRIVATE_KEY`（**已领测试币**的 Amoy 账户私钥，从水龙头领取 test MATIC）
2. 部署：
   ```bash
   npm run deploy:amoy
   ```
   脚本会打印合约地址与 `hardhat verify` 命令。
3. （可选）在 Polygonscan(Amoy) 验证源码：
   ```bash
   npx hardhat verify --network amoy <address> <ownerAddress>
   ```

> ⚠️ `compile` / `test` **无需任何密钥或网络**——仅 `deploy:amoy` 需要 `.env`。
> CI 只跑 compile + test，绝不在 CI 中部署或注入私钥。

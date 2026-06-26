@AGENTS.md

# Willbe (Pusaka) App — 移动端

> 项目级规则见仓库根 [`../.claude/CLAUDE.md`](../.claude/CLAUDE.md)。本文件只讲 App 子项目。
> **改任何代码前**，先读上面 `@AGENTS.md` 指向的 Expo v56 版本化文档 —— Expo 56 与旧版差异大。

## 是什么

Willbe（产品名 **Pusaka**）的移动端：面向东南亚家庭的家庭韧性 / 传承规划 App。
引导用户完成家庭成员、信任联系人、资产线索登记，查看准备度 / Gap 报告与紧急移交预览。
数据全部通过 `backend/` 的 REST API 读写（见根 CLAUDE.md 的 API 列表）。

## 技术栈

- **Expo ~56** + React Native 0.85 + TypeScript（strict）
- 测试：**Jest** + `@testing-library/react-native`
- Lint：ESLint（`eslint.config.js`，flat config）

## 当前状态

脚手架阶段：`App.tsx` 仍是 Expo 占位屏，尚无业务页面 / 导航 / 状态管理 / API 客户端。
随 Jira Task 逐步搭建。**引入新依赖（导航、状态库、HTTP 客户端等）前先确认 Expo 56 兼容**，
优先用 Expo SDK 自带或官方推荐方案。

## 约定

- 组件文件 PascalCase（`FamilyMemberForm.tsx`）；工具 / hook camelCase。
- 组件 props 用具名 `interface`/`type`，不用 `React.FC`；回调 prop 显式标类型。
- 避免 `any`；外部 / API 数据用 `unknown` 收窄，入口用 Zod 校验。
- 后端响应是统一信封 `{ success, data?, error? }` —— 客户端解析时据此判断成功 / 错误。
- 不可变更新，函数 <50 行，无 `console.log`。

## 命令（在 `app/` 下运行）

```bash
npm start          # expo start（开发服务器）
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # jest --coverage（提交前必跑）
```

## 开发流程

遵循根 CLAUDE.md 的标准流程：planner → tdd-guide（先写失败测试）→ 实现 → code-reviewer / typescript-reviewer。
关键用户旅程（注册 → 六步设置 → Gap 报告 → 紧急移交预览）用 **e2e-runner** 覆盖。覆盖率 ≥80%。

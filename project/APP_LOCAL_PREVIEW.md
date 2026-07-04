# App 本地预览与 Development Build

本文记录 Willbe/Pusaka App 在手机上预览的标准流程，以及 Expo Go 版本不兼容时的处理方式。

## 当前项目版本

`app/package.json` 当前使用：

```json
"expo": "~56.0.12"
```

因此手机端预览工具必须支持 **Expo SDK 56**。

## 方式一：Expo Go 预览

Expo Go 是手机上的通用开发预览 App，适合快速打开 Expo 项目。但它只能打开自己支持的 SDK 版本。

启动本地 dev server：

```powershell
cd D:\Willbe\app
npx expo start --lan --port 8081
```

然后用手机 Expo Go 扫终端里的 QR code。

注意：

- 真机不要使用 `--localhost`，手机无法访问电脑自己的 `localhost`。
- 手机和电脑需要在同一个 Wi-Fi。
- 关闭 VPN、代理、公司网络隔离。
- Windows 防火墙需要允许 Node.js / Expo 访问专用网络。
- 终端里应出现类似 `exp://192.168.x.x:8081` 的地址。

如果局域网连接失败，可以尝试 tunnel：

```powershell
cd D:\Willbe\app
npx expo start --tunnel
```

## Expo Go SDK 不兼容

如果手机提示：

```text
Project is incompatible with this version of Expo Go
The project you requested requires a newer version of Expo Go.
```

说明手机上的 Expo Go 支持的 SDK 低于项目需要的 SDK 56。

处理方式：

1. 先到 App Store / Play Store 更新 Expo Go。
2. 如果仍然只支持旧 SDK，卸载后重新安装 Expo Go。
3. 不要为了适配旧 Expo Go 降级项目 SDK。本项目明确使用 Expo ~56 / React Native 0.85。
4. 若 Expo Go 暂时无法支持 SDK 56，改用 development build。

## 方式二：Development Build

Development build 是项目自己的开发版 App，不依赖 Expo Go 内置 SDK，适合项目 SDK 或原生依赖超出 Expo Go 支持范围时使用。

### 1. 安装 dev client 依赖

项目只需执行一次：

```powershell
cd D:\Willbe\app
npx expo install expo-dev-client
```

安装后应提交 `package.json` 和 `package-lock.json` 的变更。

### 2. 构建开发包

iOS：

```powershell
cd D:\Willbe\app
npx eas build --profile development --platform ios
```

Android：

```powershell
cd D:\Willbe\app
npx eas build --profile development --platform android
```

EAS 构建完成后会给出安装链接或二维码。用手机打开并安装生成的 Pusaka development build。

### 3. 启动 dev-client server

```powershell
cd D:\Willbe\app
npx expo start --dev-client --lan
```

然后打开手机上安装的 Pusaka development build：

- 如果 App 自动发现本地 server，直接点进去。
- 如果没有自动发现，扫终端里的 QR code。
- 若 LAN 失败，尝试 `npx expo start --dev-client --tunnel`。

## 常见命令错误

不要这样传端口：

```powershell
npm start 8081
```

这会变成：

```text
expo start 8081
```

Expo 会把 `8081` 当成项目目录，导致：

```text
Invalid project root: D:\Willbe\app\8081
```

正确写法：

```powershell
cd D:\Willbe\app
npm start -- --lan --port 8081
```

或者直接使用：

```powershell
cd D:\Willbe\app
npx expo start --lan --port 8081
```

## 快速判断

| 场景 | 推荐方式 |
|---|---|
| Expo Go 支持 SDK 56 | `npx expo start --lan --port 8081` + Expo Go |
| Expo Go 只支持 SDK 54/55 | 更新 Expo Go，或使用 development build |
| 手机连不上电脑 server | 检查同 Wi-Fi / 防火墙 / VPN，或使用 `--tunnel` |
| 已安装 Pusaka development build | `npx expo start --dev-client --lan` |


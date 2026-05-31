# Flight Hub

Flight Hub 是一个基于 **Electron + React + TypeScript + Tailwind + SQLite** 的跨平台虚航管理桌面应用。

当前仓库已经从“界面原型”开始转向“真实数据驱动”的实用版本，核心目标是把模拟器实时数据接入、飞行会话记录、PIREP 自动生成、签派管理和客舱媒体能力逐步做实。

## 当前真实可用能力

### 1. 航班追踪
- 支持 **MSFS SimConnect** 采样
- 支持 **X-Plane UDP Data Output** 监听
- 显示实时位置、速度、高度、飞行阶段
- 在地图上显示实时轨迹
- 将 tracking 数据写入真实 `flight_sessions` 与 `flight_events`

关键实现：
- `src/main/sim/msfsAdapter.ts`
- `src/main/sim/xplaneAdapter.ts`
- `src/main/services/simBridgeService.ts`
- `src/main/db/flightSessionRepository.ts`

### 2. Flight Session / 自动基础 PIREP
- 自动创建活动飞行会话
- 记录 phase 变化事件
- 自动记录推出、起飞、落地、停靠时间点
- 自动记录最大高度
- 会话结束后自动生成基础 PIREP

当前 PIREP 自动生成字段包括：
- 航班号
- 起降机场（当前仍可能为 `UNK`，待后续自动识别增强）
- block time
- landing rate（基础版）
- fuel used（字段已预留，后续继续增强真实采样）

关键实现：
- `src/main/db/flightSessionRepository.ts`
- `src/main/services/simBridgeService.ts`
- `src/renderer/pages/PirepPage.tsx`

### 3. Dashboard 真实聚合
当前 Dashboard 已不再展示虚拟统计，而是基于真实数据库聚合：
- 今日航班数量
- 累计小时
- 当前活动会话
- 最近 PIREP 列表
- 真实成员排行（来自 `members` 表）

关键实现：
- `src/main/db/flightSessionRepository.ts`
- `src/main/ipc/registerHandlers.ts`
- `src/renderer/pages/DashboardPage.tsx`

### 4. Dispatch 真实 CRUD + SimBrief 导入
当前已支持：
- 新建签派草稿
- 编辑签派单
- 保存到真实 SQLite `dispatches` 表
- 导出 `dispatch.json`
- 通过 **SimBrief 用户名 / userId / navlogId** 调用官方 fetcher API 导入签派数据
- 在 Dispatch 中绑定成员 ID / 机队 ID，供后续会话继承

关键实现：
- `src/main/db/dispatchRepository.ts`
- `src/main/services/simbriefService.ts`
- `src/main/ipc/registerHandlers.ts`
- `src/renderer/pages/DispatchPage.tsx`

### 5. 成员 / 机队管理真实 CRUD
当前已支持：
- 成员新增 / 删除 / 小时显示
- 机队新增 / 删除 / 状态维护 / 小时显示
- 会话完成后，若 session 已绑定成员与机队，会自动累计飞行小时

关键实现：
- `src/main/db/memberRepository.ts`
- `src/main/db/fleetRepository.ts`
- `src/main/services/simBridgeService.ts`
- `src/renderer/pages/ManagementPage.tsx`

### 6. 客舱语音（当前最小可用版）
当前已支持：
- 本地 `WAV/MP3` 媒体文件播放
- 自动创建运行时媒体目录
- 页面提示媒体目录路径

当前 **尚未接通**：
- TTS
- 基于飞行阶段自动广播
- 广播模板编辑器

关键实现：
- `src/main/services/cabinService.ts`
- `src/renderer/pages/CabinPage.tsx`

---

## 当前还未完成的需求
以下需求仍在后续开发中，当前仓库不会把它们伪装成“已可用”：

- 自动 fuel burn 统计
- 更准确的自动 departure / arrival ICAO 识别
- 完整的 flight session 与 dispatch 生命周期联动
- 成员 / 机队编辑（当前已支持新增与删除，后续会补更完整编辑体验）
- TTS 广播
- 客舱广播自动触发
- XPUIPC 接入
- X-Plane 更稳的主动接口方案（当前主要是 UDP Data Output 监听）

---

## 技术栈

- Electron
- React 18
- TypeScript
- Tailwind CSS
- Vite
- SQLite (`better-sqlite3`)
- Leaflet / React-Leaflet
- Zustand

---

## 项目结构

```text
src/
  main/
    db/              # SQLite schema 与 repository
    ipc/             # IPC handlers
    services/        # 业务服务（tracking/session/cabin）
    sim/             # 模拟器接入适配器
  preload/           # Electron preload API
  renderer/          # React 前端
  shared/            # 前后端共享类型
```

---

## 本地开发

### 安装依赖
```bash
npm install
```

### 启动开发环境
```bash
npm run dev
```

开发模式会同时启动：
- Vite renderer
- main 进程 TypeScript watch
- preload TypeScript watch
- Electron

### 类型检查
```bash
npm run typecheck
```

### 打包
```bash
npm run dist
```

---

## 模拟器接入说明

### MSFS
当前通过 `msfs-simconnect-api-wrapper` 读取数据。
默认配置：
- Host: `127.0.0.1`
- Port: `500`

### X-Plane
当前通过本地 UDP 监听 `DATA` 输出。
默认配置：
- Local UDP Port: `49000`

你需要在 X-Plane 中主动开启对应的 **Data Output** 发送到本机端口。

---

## Dispatch / 成员 / 机队联动测试

### SimBrief 导入
当前 Dispatch 页支持填写以下任一参数后导入：
- `SimBrief 用户名`
- `SimBrief 用户 ID`
- `SimBrief Navlog ID`

导入成功后会把结果保存为真实签派记录。

### 成员 / 机队绑定
当前 Dispatch 页支持填写：
- `成员 ID`
- `机队 ID`

当该签派被标记为 active 并被新的 flight session 继承后，会话完成时将自动累计：
- 成员飞行小时
- 机队飞行小时

---

## 客舱媒体目录

客舱语音的本地媒体文件会从 Electron `userData` 目录下的：

```text
cabin-media/
```

中读取。

如果页面提示找不到媒体文件，请把对应 `wav/mp3` 文件放入该目录。

---

## 数据库

数据库位于 Electron `userData` 目录下：

```text
flight-hub.db
```

当前已使用结构化表，而不是 JSON blob：
- `flight_sessions`
- `flight_events`
- `pireps`
- `dispatches`
- `members`
- `fleet`
- `announcements`

关键定义：
- `src/main/db/bootstrap.ts`

---

## 当前开发方向

当前开发优先级：
1. 更准确的自动 PIREP 字段生成（fuel / ICAO / landing rate / session 质量）
2. Dispatch 与 flight session 生命周期联动
3. 成员 / 机队更完整编辑能力与联动统计
4. 客舱 TTS 与自动广播
5. 更完整的 X-Plane 接入方案

---

## 备注

`OpenFrequency/` 目录仅作为参考项目存在，不纳入当前仓库功能范围。

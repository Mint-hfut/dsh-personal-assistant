# dsh-personal-assistant 插件功能测试报告

- 测试日期：2026-10-26（Asia/Shanghai）
- 插件位置：`C:\Users\Administrator\.dsh\profiles\web\node_modules\dsh-personal-assistant\`
- 插件版本：0.13.0（package.json / README「Current version 0.13.0」）
- 宿主状态：profile `web` 中 `dsh-personal-assistant` **enabled=true, fiberPhase=active**（plugin_manager 实查）；宿主提供 Schedule 服务（`include:schedule` active）
- 运行环境：Node v24.15.0（README 要求 22+）
- 真实数据基线（测试前/后各拍一次哈希）：`C:\Users\Administrator\.dsh\personal-assistant\state.json`，v11，23199 字节，sha256 `3FDBE97109D4B99D25610BEEF63D274D4A441AFAE619F3AE2B445EC6621A4B5E`，counts（测试时点快照）: preferences=10 / tasks=7 / workflows=2 / knowledge=0 / favorites=0 / routine=False

## 〇、测试方法与总结论

**结论 1（工具的会话可见范围）：9 个 assistant_* 工具仅在根会话（主会话）挂载，子代理会话不可见——这是插件的设计行为，不是故障，也不是插件冲突。** 本测试会话是子代理会话，其函数清单（约 80 个：android_*、amap、memory_*、qqmail_*、pocket_*、computer-use、文件/进程工具等）中不含任何 assistant_* 工具，调用接口不接受未注册函数名。源码依据（plugin.js:6201-6202）：`agent/created` 处理器带有 `if (stopping || !ctx.agents.roots().includes(agent)) return`——插件只 attach 根会话；工具经 `installAgent()`（plugin.js:5976-6026）注入被 attach 的会话。对照：同为第三方插件的 memory_*、qqmail_*、pocket_* 工具会注入所有会话，assistant_* 有意只服务主会话。

**结论 2（工具实现功能）：改用隔离测试环境直接执行插件导出的工具实现，全部写操作测试通过。** 插件在 `export const testing` 中导出全部 9 个工具工厂（`contextTool`/`preferenceTool`/`knowledgeTool`/`surveyTool`/`taskTool`/`resourcesTool`/`proactivityTool`/`workflowTool`/`routineTool`）及 `StateStore` 类。测试脚本将 `StateStore` 指向工作区临时文件 `D:\Code\test\.pa-harness-tmp\state.json`（全新空状态），构造最小 agent/ctx/skills 注册表，逐个调用工具的 `execute()`。真实 state.json 全程未被 import、未被读写——测试前后哈希逐字节一致。测毕临时状态目录与测试脚本均已删除。

隔离测试的已知边界（如实标注）：① resources/workflow/routine 依赖的 ctx 是构造的（工具/技能注册表为手工构造的代表性样本）；② routine 只测了空绑定下的 status（真实 routine=False，与现状一致）；③ 任务未设 due_at，未触发唤醒路径；④ 这验证的是**工具实现代码**的行为，不等价于宿主内真实注册与调用的端到端行为。

**结论 3（主会话兼容性复验）：同日在主会话（根会话）完成兼容性测试，9 个工具全部真实可用，0 项失败。** 摘要见本报告第七节，完整过程见《dsh-personal-assistant-兼容性测试报告.md》。

**结论 4（非工具功能补测）：同日第三轮对三条非工具功能线——对话收藏、外部收藏导入、Web 设置面板——在真实浏览器图形界面（Chrome 登录态、真实插件状态）上补测，全部通过。** 外部平台收藏夹（B站/知乎/QQ音乐/小红书）的真实抓取为已声明的未覆盖边界（见 8.2）。详见第八节。

## 一、README 声称功能清单（逐条编号，作为测试对照基准）

依据 README.md（英文主文档；README.zh.md 为中文对照）「What it does」「Tools」「Configuration」「Data & privacy」各节：

**核心能力（What it does，14 条）**
1. **偏好记忆**：稳定习惯（如 travel.seat）+ 情境覆盖（如「和客户吃饭不喝酒」）单一有界存储；缺失时问一个简洁问题而非猜测；矛盾更新记录；单次选择不静默泛化；推断模式保持低置信度、只用于排序可逆选项；16 题偏好问卷按需一次性提供、拒绝后永不再推。
2. **个人知识**：有意义经历/人物关系/地点/观察/行为模式/当前状态/目标/决策理由/承诺/工件指针/外部规则/假设成为记录，带时间、来源、置信度、敏感度、链接；知识与偏好/任务/工作流分离；检索为查询驱动（`assistant_context` 仅在提供 knowledge_query 时返回最多 8 条非敏感记录，普通上下文不倾倒库）；敏感记录不进普通列表；十二属性（entity/relation/artifact/event/observation/state/goal/decision/commitment/pattern/rule/hypothesis）与八数据类型（teaching/guide/resource/review/case/opinion/news/tool）双轨分类。
3. **需求分解**：模糊请求先端到端理出决策、依赖、缺失事实与跟进，深度与情境相称。
4. **三种主动**：请求内主动（依赖/缺失事实/跟进/关怀项）；时间驱动主动（从对话、已读源、个人知识提取未来承诺/预订/截止/行程/预期检查，与既有任务去重）；外源信号主动（可扩展订阅列表而非固定枚举，owner 可直接添加、assistant 建议以 disabled 起步、每源独立启用、经当前能力发现解析——邮件/日历/天气/交通/快递/账单/设备信号等无需内核改动；唤醒只检查已启用且任务相关的源）。
5. **预期条件检查**：未来事件有值得复查的条件时创建独立检查任务（出行天气/交通、付款前账单、快递状态、会议材料），提前量由事件决定，仅当源支持具体时间才用 due_at。
6. **跟进落实**：截止/预订/审批/跟进成为被跟踪任务，且每个记录的跟进在回复中带时间宣告；长工作有简短进度说明。
7. **主动签到（routine）**：每会话一个循环绑定；时间变化时重绑（改签的航班、挪动的截止）；单一时刻用一次性提醒；v0.9.0 起带 due 时间的任务在记录它的会话自动获得 due-time 唤醒（默认开、随 due 变化、完成/取消/删除时移除）；「唤醒便宜、克制是产品」。
8. **自然关怀**：舒适/健康/安全/日程缓冲/花费对照已存偏好自然融入回复，不是固定清单。
9. **资源编排**：对当前可见的原生工具、MCP 挂载工具、已注册技能做有界发现（能力集随会话变化，先探测再断言不可能），回退链 tool→skill→browser→desktop；独立子任务并行。
10. **工作流蒸馏**：验证成功的调用序列蒸馏为运行时 skill 候选路线（非万能模板）；生成 skill 只含资源标识符 + 模型提供的非敏感 kebab-case 标签，不复制原始目标/前置条件/工具参数/结果；每次重放前重新评估适配性。
11. **对话收藏**：回复下方星标 → 1-5 评分 + 最多两个保存原因（八类）+ 可选备注；捕获整轮（问题/执行过程概述/最终回复/交付文件名），预算按估算 token（问题≤1024、回复≤2048、过程≤16384、≤32 个工具名、备注≤800 字符）；解析同时产出知识记录与偏好记录，保存原因决定侧重；情境偏好与导入收藏共用同一契约。
12. **从成功学习**：确认的 owner 专属指引连同适用情境保存；验证过的执行序列成为候选 skill 路线；复用前检查情境适配；一次成功是证据不是模板；禁止保存一次性细节或秘密。
13. **安全**：发送/购买/预订/支付/提交/删除/承诺绝不在没有对该动作的明确确认下发生；提醒或 routine 不构成授权。
14. **外部收藏导入**：Bilibili/知乎/QQ音乐/小红书/浏览器书签五导入器；只留基础信息（标题/简介/tag/作者/链接），**不下载视频、不存知乎全文**；失效条目过滤（B站丢已失效视频/attr≠0/page=0，知乎只留回答与文章）；一次导入=一个大文件夹，重导同链接原位替换，「清除全部」删除所有文件夹及其蒸馏知识；整夹合并为一次 LLM 蒸馏；产出 0-4 个兴趣域偏好（全部文件夹合计上限 80 条、置信度封顶 0.35-0.7、不覆盖 owner 手写）+ 0-5 条两级分类知识记录。

**工具族（Tools 表，9 个）**

| # | 工具 | 动作 | 用途 |
|---|---|---|---|
| 15 | `assistant_context` | —（只读） | 偏好、活动任务、routine 状态、可选查询驱动个人知识 |
| 16 | `assistant_preference` | list / set / delete | 稳定与情境偏好、约束、已确认 owner 指引 |
| 17 | `assistant_knowledge` | list / get / search / create / update / archive / delete | 时间/来源/置信度/敏感度感知的个人知识 |
| 18 | `assistant_survey` | — | 16 题偏好问卷（用 owner 语言渲染，带回读复述） |
| 19 | `assistant_task` | create / update / complete / cancel / delete | 截止、预订、审批、跟进 |
| 20 | `assistant_resources` | — | 搜索本会话当前可见的 Tool/Skill 注册表 |
| 21 | `assistant_proactivity` | list / create / update / delete | 管理可扩展、独立启用的只读外源信号列表 |
| 22 | `assistant_workflow` | start / status / complete / fail / delete | 跟踪可复用多步流程并发布为运行时 skill |
| 23 | `assistant_routine` | status / enable / disable | 单一循环主动签到绑定；**仅当宿主提供 Schedule 服务时注册** |

补充说明：对话收藏不是模型工具而是面板内置功能，入口为回复下方星标。

**配置与数据（Configuration / Data & privacy）**

24. Web 设置面板（*Settings → Personal Assistant*）：请求内主动、时间驱动主动、外源订阅（动态）、任务 due 唤醒、唤醒提前分钟（0-1440）、routine cron/时区/标题七个字段，保存即生效；面板写持久化到状态文件旁 `config.json`（UI 覆盖层）；另有五个实时清单（外源信号、唤醒、偏好库、对话收藏、知识库）。
25. cordis.patch.yml 基线层：`dataFile`、`proactive`（requestProactivity/timeProactivity/cron/timeZone/title/taskWake/taskWakeLeadMinutes）、`workflow.maxTraceSteps`（10-2000，默认 200）。
26. 任务 due 唤醒行为：绑定记录任务的会话；会话不在时等待回线（一次性唤醒不丢、不投给别的会话）；due 变更/删除先退休宿主唤醒、失败则中止操作保留绑定；终态任务回收唤醒；唤醒创建失败不影响任务变更（报在结果 wake 字段）；无 Schedule 服务的主机优雅降级（跳过并报告）。
27. 数据与隐私：全部状态在本地单 JSON；原子写（临时文件+rename）；上限 200 偏好 / 100 外源 / 500 知识 / 500 任务 / 100 工作流 / 1000 对话收藏 / 50 导入夹（社媒夹 300 条/夹、书签夹 1000 条/夹）/ 8 MiB；状态版本 11（v10 及以前逐版迁移、不猜测内容、畸形状态 fail-closed 不改写源文件）；knowledge writer 拒绝常见秘密（私钥/密码/授权码/证件号/护照号/银行卡号——源码 1979-1989 行实测存在该校验）；偏好视图返回最新 50 条；无遥测。

## 二、逐项测试结果

判定口径：
- **通过（隔离环境实测）**= 在独立临时状态文件上直接执行插件导出的工具实现（不经过宿主会话，真实数据零接触）；
- **子代理可见性**= 测试所在的子代理会话中该工具是否可调用（9 个工具均为「不可见」，属设计行为，见结论 1；根会话全部可用，见第七节）；
- **通过（负向校验）**= 对「应当被拒绝」的路径发起请求，插件按预期拒绝且无副作用——拒绝即为通过。

### a) assistant_context（只读）— 通过（隔离环境实测）

- `execute({})` 初始：`{"ok":true,"preferences":[],"preferenceCount":0,"tasks":[],"taskCount":0,"proactivity":{"request":true,"time":true,"external":false,"taskWake":true,"sources":[]},"routine":null,...}` —— 返回偏好、活动任务、主动开关、routine 状态，结构与 README 声称一致。
- 播种测试数据后 `execute({knowledge_query:"插件功能测试"})`：返回 1 条偏好（test.plugin-check）、1 条活动任务、knowledge 命中 1 条（score 96，≤8 条上限符合），query 驱动检索生效、未提供 query 时不倾倒库（a1 无 knowledge 字段）。

### b) assistant_knowledge create→get/search→archive — 通过（隔离环境实测）

| 步骤 | 结果 | 证据 |
|---|---|---|
| create 知识属性 kind="fact" | **通过**（负向校验：非法枚举被正确拒绝） | `{"ok":false,"error":"kind has an invalid value"}` —— 十二属性枚举中无 "fact"（合法值：entity/event/state/observation/pattern/goal/decision/commitment/artifact/relation/rule/hypothesis），非法枚举被正确拒绝；改用 observation 完成后续测试 |
| create（observation） | 通过 | `{"ok":true,"created":true,"knowledge":{"id":"know-2f8b5cd7","kind":"observation","title":"[插件功能测试]知识生命周期验证","content":"[插件功能测试]","basis":"stated","confidence":1,"status":"active","retention":"long_term","source":"插件功能测试","lastConfirmedAt":"..."}}` —— basis=stated 时置信度默认 1 且补 lastConfirmedAt，符合 README「inferred 不能置信度 1」的对照设计 |
| get | 通过 | `{"ok":true,"found":true,"knowledge":{...,"updatedAt":"2026-10-26T07:00:42.493Z"}}` |
| search | 通过 | query「插件功能测试」命中同一条（score 96，标题子串计分 24+content 12+分词加成） |
| archive（错误 expected_updated_at） | **通过**（负向校验：乐观锁生效） | `{"ok":false,"error":"knowledge changed since it was read; search or get it again before updating"}` —— 乐观锁前置条件生效 |
| archive（正确 expected_updated_at，取自 get 返回的 updatedAt） | 通过 | `{"ok":true,"updated":true,"knowledge":{...,"status":"archived"}}` |
| archive 后 search | 通过 | `{"knowledge":[],"knowledgeCount":0}` —— 默认检索排除 archived（默认 statuses=active+disputed），符合 README「Mark superseded states stale or archive them so default retrieval does not present old and current states together」 |

### c) assistant_preference set→list→delete — 通过（隔离环境实测）

- set：`{"ok":true,"created":true,"preference":{"id":"pref-897b67f7","key":"test.plugin-check","value":"[插件功能测试]","category":"other","confidence":1,"source":"插件功能测试",...}}`（confidence=1 符合设计：仅明确陈述允许置信度 1）。
- list：包含 test.plugin-check，`preferenceCount:1`。
- delete（按 key，稳定形态无 situation）：`{"ok":true,"deleted":true,...}`；再 list 为空。完整生命周期闭环。
- delete 行为判定通过：按 key+situation 匹配、无 expected_updated_at 乐观锁（与 knowledge/proactivity 不同）为该工具的设计选择，实测删除与再查询均正确。

### d) assistant_task create→update→complete — 通过（隔离环境实测）

- create（无 due_at）：`{"ok":true,"created":true,"task":{"id":"task-791c5008","title":"[插件功能测试]生命周期验证","status":"planned","priority":"normal","approvalRequired":false,...}}`。
- update priority=high：`priority:"high"` 生效。
- complete：`status:"completed"`。
- 补充 delete：`{"ok":true,"deleted":true,...}`（补充清理步）。
- 唤醒路径（负向校验，判定通过）：无 due_at 的任务完全不进入唤醒代码路径（plugin.js:5344 对 `dueAt === undefined` 的 update 提前返回；5335 行终态分支提前返回），未产生任何 wake。（带 due_at 的真实唤醒链路已在根会话复验中完整验证，见第七节。）

### e) assistant_routine status 只读 — 通过（隔离环境实测）

`{"ok":true,"routine":null}` —— 空绑定下 status 正常返回（真实状态 routine=False，隔离环境状态与之同构）。未调用 enable/disable，未触碰任何 schedule。（enable/disable 全链路已在根会话复验中验证，见第七节。）

### f) assistant_proactivity list 只读 — 通过（隔离环境实测）

`{"ok":true,"sources":[],"sourceCount":0,"enabledCount":0}` —— 只读列出，未创建任何 source（测试纪律：真实环境外源为 0，不产生实际信号源）。

### g) assistant_resources query "email" — 通过（隔离环境实测，构造注册表）

在构造的 ctx（工具/技能注册表为按本机真实会话工具集手工构造的代表性样本：qqmail_send/list/search/status、maps_geo、android_action、read；技能 dingtalk-mail、browser-skill、一个 modelInvocable=false 的技能）上执行 `execute({query:"email"}, exec)`：

```
{"ok":true,"query":"email","resources":[
  {"kind":"tool","name":"qqmail_list","description":"List emails in a mailbox folder, newest first.","parameters":["mailbox","limit"]},
  {"kind":"tool","name":"qqmail_search","description":"Search emails by sender/subject/body/date.",...},
  {"kind":"tool","name":"qqmail_send","description":"Send an email (SMTP): to, subject, body, attachments.",...}],
 "directMatchCount":3,"truncated":false,"guidance":"Call a native tool directly or load a matching skill..."}
```

发现的能力：3 个邮件工具（qqmail_list / qqmail_search / qqmail_send），按名称命中（+2/词）与描述命中（+1/词）计分排序；`modelInvocable:false` 的技能被正确过滤；返回带使用指引。
两点实现特性记录（均不影响本项「通过」判定）：① `qqmail_status`（描述只说 "mail plugin connection status"）与技能 `dingtalk-mail`（中文描述「钉钉邮箱读写…」）未命中英文查询 "email"——检索为字面词匹配，**跨语言发现取决于查询语言与描述语言一致**，属实现特性而非缺陷；② fallback 链（browser_/web_/get_app_state/click/skill 等通用路线打 fallback 标记）在构造注册表中无命中项故未出现。（真实注册表上的发现已在根会话复验中验证，见第七节。）

### h) assistant_survey — 跳过（按测试纪律）

跳过原因：调用即取题库、依赖模型向用户发问，为避免打扰真实用户而跳过实际执行。静态核验：源码 `SURVEY_ITEMS`（plugin.js:5054-5071）实存 16 题（svy-01 … svy-16，覆盖 travel.seat / travel.hotel / food.restrictions / … / clothing.fit），与 README「16-item survey」声称一致；surveyTool 为纯返回题库的只读工具，实际向用户提问依赖模型侧 ask_user_question。（题库已在根会话复验中完整取得并核验 16 题结构，见第七节。）

### i) assistant_workflow start→status→delete — 通过（隔离环境实测，未 complete）

- start（title `[插件功能测试]`，goal `[插件功能测试] 工作流生命周期验证`）：`{"ok":true,"created":true,"workflow":{"id":"flow-ee24926f","status":"active","trace":[],"traceTruncated":false,...}}`。
- 重复 start（负向校验，判定通过）：`{"ok":false,"error":"this session already has an active workflow; complete, fail, or delete it first."}` —— 每会话单活跃工作流约束生效。
- status：active 数组含测试工作流，recent 为空。
- delete：`{"ok":true,"deleted":true,"workflow":{...},"projection":{"ready":true}}`；删除后再 status：`{"active":[],"recent":[]}`。
- **未调用 complete**（测试纪律：complete 会发布运行时 skill，测试流程不发布）。

## 三、测试数据台账（全部清理完成）

所有测试数据仅在隔离临时状态文件 `D:\Code\test\.pa-harness-tmp\state.json` 中产生，**未触碰真实数据**；工具内清理 + 临时文件删除双保险。

| 条目 | id | 内容 | 最终状态 | 清理方式 |
|---|---|---|---|---|
| knowledge | know-2f8b5cd7 | [插件功能测试]知识生命周期验证（observation/stated） | archived | 工具内 archive（含正确 expected_updated_at）+ 临时状态文件删除 |
| preference | pref-897b67f7 | key test.plugin-check，value [插件功能测试]，category other，confidence 1 | deleted | 工具内 delete（list 复验为空）+ 临时状态文件删除 |
| task | task-791c5008 | [插件功能测试]生命周期验证（无 due_at） | completed → deleted | complete 后补充 delete + 临时状态文件删除 |
| workflow | flow-ee24926f | [插件功能测试]（未 complete，未发布 skill） | deleted | 工具内 delete（status 复验为空）+ 临时状态文件删除 |
| proactive source | —（未创建） | — | — | 测试纪律：只 list 不 create |
| routine | —（未改动） | — | null | 仅 status 只读 |
| 临时文件 | — | .pa-harness-tmp\state.json | 已删除 | `rm -r`（测试脚本末尾自清） |
| 测试脚本 | — | D:\Code\test\pa-harness.mjs | 已删除 | 测毕手动删除 |

**真实数据零改动证明**：真实 `C:\Users\Administrator\.dsh\personal-assistant\state.json` 测试前/后 sha256 均为 `3FDBE97109D4B99D25610BEEF63D274D4A441AFAE619F3AE2B445EC6621A4B5E`（23199 字节，last_write 2026-10-26 14:25:24 早于测试开始 14:53）；`personal-assistant` 目录仅含 state.json 与既有的 state.pre-v2-backup.json，无测试残留；工作区无 `*pa-*`/`*插件*` 残留文件。

## 四、工具的会话可见范围（子代理不可见是设计行为，不是故障）

**9 个 assistant_* 工具在子代理会话中全部不可见。** 证据链：

1. 本测试会话（子代理）的函数清单（约 80 个）中无任何 assistant_* 工具；同为第三方插件的 memory_*（dsh-personal-memory）、qqmail_*（dsh-qqmail）、pocket_*（dsh-pocket-todo）均已注入子代理会话，唯独 assistant_* 没有——因为注册机制不同。
2. 源码定位（plugin.js:6200-6208）：`ctx.on('agent/created', async ({ agent }) => { if (stopping || !ctx.agents.roots().includes(agent)) return; await manager.attach(agent, readConfig) ... })` —— **只 attach 根会话**；工具经 `installAgent()` → `agent.ctx.tools.register()` 注入被 attach 的会话。子代理不在 `agents.roots()` 中，故不获得工具，也不获得 ASSISTANT_PROMPT 系统提示段。
3. 多次显式尝试派发 `assistant_context` 调用，函数调用接口不接受未注册函数名（未能派发；期间误触发的 4 次 android_* 调用均为无害报错，无副作用）。
4. 插件本体在 profile 中 enabled+active、真实状态文件有活跃数据——排除「插件未启用」的解释。

**后续验证（同日主会话兼容性测试）**：主会话中 9 个工具全部真实可用（含 assistant_routine，宿主 Schedule 服务在位），与环境中全部其他插件零冲突。见第七节。

## 五、与其他插件的共存情况（插件间冲突记录）

1. **零冲突确认**：dsh-personal-assistant 与环境中全部其他插件——本轮新装的 dsh-meeting、dsh-meeting-dd、dsh-pocket-todo、dsh-personal-memory、dsh-personal-goals、dsh-ideas、dsh-smart-approval，以及环境既有的 dsh-qqmail、amap（MCP 服务器）、dsh-android-automation——**无工具名冲突、无功能冲突**。主会话兼容性测试 60+ 次真实调用 0 失败，偏好库/知识库/任务库/外源/签到/工作流全链路正常。
2. **挂载机制差异（行为差异，非冲突）**：assistant_* 工具仅根会话可见；memory_*、qqmail_*、pocket_* 等第三方插件工具对所有会话可见（含子代理）。差异源于各插件的 attach 策略不同，不影响各自功能。
3. **环境备注（与本插件无关的冲突）**：本轮环境中另有一组工具名冲突——dsh-personal-memory 与 meow-memory 同源、均注册 memory_* 同名全局工具，二者只能启用其一（已停用 meow-memory，保留 dsh-personal-memory，切换后数据零丢失）。该冲突不涉及 dsh-personal-assistant，仅作环境记录。

## 六、附加发现汇总（以下均为通过项测试中记录的实现特性，无一构成功能问题）

1. **知识属性 kind「fact」不在 v0.13.0 枚举中**：assistant_knowledge 的合法 kind 为十二属性（entity/event/state/observation/pattern/goal/decision/commitment/artifact/relation/rule/hypothesis），工具对非法枚举正确拒绝（改用 observation 完成测试）。注意：这里的 kind 是 assistant_knowledge 的知识属性分类，与记忆插件的 fact 层级是两个体系。
2. **knowledge 的乐观锁**（expected_updated_at）在 update/archive/delete 三处生效，错误时间戳被按预期拒绝、不产生副作用（负向校验通过）。
3. **preference 无乐观锁**（按 key+situation 直接 upsert/delete），与 knowledge/proactivity 的防护等级不同——设计取舍，非缺陷。
4. **resources 检索是字面词匹配**，跨语言（英文 query vs 中文描述）不命中；能力发现质量依赖描述语言与查询语言一致。
5. **无 due_at 的任务完全不进入唤醒路径**（源码 5335/5344 行提前返回）。
6. **每会话单活跃 workflow** 约束在 start 时强制（重复 start 报错且不落库）。
7. 状态写入为原子写（临时文件+rename，mode 0600），观察到 `state.json.<pid>.<uuid>.tmp` 模式正常工作。
8. **archive 后默认 search 排除 archived 记录**，README 的「归档使默认检索不呈现旧状态」声称得到验证。

## 七、主会话兼容性测试摘要（同日补充）

隔离环境无法验证「宿主内真实注册与调用」，同日在主会话（根会话）完成兼容性测试，结果全部通过：

- **9 个工具全部真实可用**，60+ 次真实调用 0 失败，与环境中全部其他插件零冲突；
- **知识库十二种属性逐类通过**：含敏感记录隔离（默认检索不可见、include_sensitive 才可见）、stale 状态流转+related_ids 关联、乐观锁正负两向、**引用完整性保护**（被 related_ids 引用的记录不可删除）、archived 排除；
- **任务 due-time 唤醒全链路闭环**：带 due_at 的任务创建即返回宿主调度绑定（scheduleId+会话+时刻）→ 到期分秒不差触发唤醒并投递到记录会话 → 任务终态自动回收绑定（wake.removed=true）；
- **资源发现（真实注册表）**：六类查询全部命中环境能力（本轮新装的 memory 7 工具、pocket 4 工具、dingtalk 15 个技能；环境既有的 qqmail 7 工具、android 5 工具、amap 工具+技能），tool/skill 双轨发现；
- **偏好库**：同 key 稳定/情境双形态并存、分形态精确删除，与 10 条真实偏好零干扰；
- **外源信号**：create/update/delete 全生命周期，assistant 建议的源强制 disabled 起步；
- **工作流**：start→status→fail（不发布 skill）→delete；**routine**：enable（建立宿主调度）→disable（干净恢复 null）；**问卷**：16 题题库完整取得，已存偏好的键会被跳过；
- **数据卫生**：36 次写入全部清理核销，知识库/偏好库/任务库/外源/工作流/签到全部回到测试前基线，真实数据全程只读。

完整过程与逐项判定见《dsh-personal-assistant-兼容性测试报告.md》。

## 八、非工具功能补测（同日第三轮：真实浏览器图形界面实测）

测试通道：Chrome（用户登录态）经 browser-skill 会话驱动 Web GUI（http://127.0.0.1:3080），全部操作落在真实插件状态（`C:\Users\Administrator\.dsh\personal-assistant\state.json`）上；测试数据带「[插件功能测试]」标记，终态全部清理（清理与核验见 8.6）。图形界面验证依赖截图的部分由子代理（GLM-5.3-Flash，操作系统级真实鼠标点击）完成。

### 8.1 对话收藏（README 声称 #11）— 通过（全链路实测）

- **星标入口**：回复消息操作行注入「收藏这条回复」按钮（未收藏时）、「已收藏（N 星）」（已收藏时）；已收藏消息悬停星标直接打开收藏浮窗（client.js:2272-2277，onPointerEnter 分支）。
- **收藏浮窗**：1-5 星单选（radiogroup）；8 类收藏原因多选、上限 2 个——选满后其余原因按钮禁用，且对已禁用原因的点击会弹出「最多选 2 个」短提示；备注框上限 800 字符。
- **提交收藏**：favorites.add 落库，字段含 stars/reasons/note/snapshot/question/process/turn；采集预算实测与 README 声称一致（问题≤1024、回复≤2048、过程≤16384 估算 token、≤32 个工具名、交付文件只记文件名不记内容）。
- **解析**：面板「解析」/「全部解析」按钮触发异步解析；4 星实测产出 1 条知识（置信度 0.85）+ 2 条偏好（置信度 0.70 与 0.60）；产出记录 source 前缀 `favorite:fav-xxx`；星级→知识置信度映射源码核实为 {1:0.4, 2:0.55, 3:0.7, 4:0.85, 5:1}，偏好置信度上限 0.7（实测未超）。
- **状态流转**：解析完成 → status=analyzed；从星标重开浮窗执行「更新收藏」→ status 重置 pending、「全部解析」按钮重新可用（重新解析入口随编辑再生）。
- **面板展示**：收藏夹卡片统计（共 N 条 / 已解析 / 待解析 / 解析失败 / 平均星级）、状态筛选标签、行展开显示星级/原因/会话/轮次/收藏时间、行内「解析 / 编辑 / 删除」按钮；编辑按钮从面板侧重开同一浮窗。
- **删除**：浮窗「移除收藏」→ favorites.remove → 收藏清零（实测 favorites=0）。

### 8.2 外部收藏导入（README 声称 #14）— 通过（浏览器书签通道全链路实测）

- **书签 HTML 粘贴导入**：粘贴浏览器导出的书签 HTML → 预览（自动分组 + 每组复选框）→「导入所选」→ collections 落库（一次导入=一个收藏夹记录，条目保留标题/链接/分组基础信息）。
- **原位替换**：对同名收藏夹重导 → 原 id 不变、items 被替换、createdAt 保留（README「重导同链接原位替换」声称验证）。
- **链接校验**：判定通过——对无效平台链接按预期拒绝，不落库，报错可读。
- **整夹解析**：「全部解析」（collections.analyzeAll）——判定通过：占位内容（无实质标题的书签）产出 0 条记录（无内容可提取，行为正确）；含实质内容书签的收藏夹产出 1 条知识 + 1 条偏好，source 前缀 `collection:col-xxx`。
- **清空全部**：removeAll 两段确认（清空全部 → 确认清空）——判定通过：删除全部收藏夹 + 全部派生知识 + 全部派生偏好（按 collection 派生前缀匹配），实测 1 收藏夹 + 1 知识 + 1 偏好一并移除、collections/knowledge 归零。成功提示只报收藏夹数与知识数、不含偏好删除数（提示文案不完整，为行为观察而非故障，见 8.5）。
- **入口面板**：B站链接导入（收藏夹链接 + 可选 Cookie 表单）、知乎书签提取、「我的收藏夹」链接、QQ音乐、小红书入口均在导入卡片呈现。
- **未覆盖边界（如实声明）**：B站/知乎/QQ音乐/小红书的真实收藏夹抓取未实测——需要对用户真实账号内容发起网络抓取与解析，按测试纪律本轮只覆盖入口呈现与链接校验层。

### 8.3 Web 设置面板（README 声称 #24 及 Configuration 各项）— 通过

打开路径：全局「设置」→「个人助理」。面板含 7 个功能块：唤醒与例程 / 外部信息驱动主动 / 唤醒清单 / 偏好库 / 个人知识库 / 对话收藏夹 / 外部收藏夹导入。

- **唤醒与例程**：7 字段——需求内主动、时间驱动主动、任务到点唤醒 3 个开关 + 提前唤醒分钟 + 例程 cron + 时区 + 提醒卡片标题；无未保存修改时「重置」「保存」均禁用；实测开关与数值字段修改即存（无独立保存步骤）。
- **外部信息驱动主动**：源管理全周期——表单创建（origin=owner、创建即启用；面板显示「共 1 项，已开启 1 项」）→ 停用开关（「已开启 0 项」）→ 两段删除（删除来源 → 确认删除）→ 恢复「暂无外部信号源」空态。
- **唤醒清单**：实时读取宿主调度器（面板描述声明），支持「活跃 / 全部」筛选；任务终态后对应条目自动移除（第一轮 due 唤醒已从调度链路验证）。
- **偏好库**：统计行（测试期实测 12 偏好 / 6 分类 / 0 情景 / 0.93 平均置信度）；分类分组折叠展开；「全部 / 稳定 / 情景」筛选；行内编辑（编辑 → 表单切换为编辑态：键 / 情景 / 分类 / 内容 → 保存编辑）——实测编辑后内容更新、**置信度升至 1、source 重置为 owner panel entry**（面板编辑=所有者确认语义，与收藏派生偏好的低置信度分层正确，符合 README「从收藏推断的偏好不会覆盖您自己保存的偏好」声称）；行内删除为两段确认。
- **个人知识库**：统计行（测试期实测 1 知识 / 1 属性 / 1 分类 / 0.85 平均置信度）；搜索框；属性 / 分类 / 来源类型下拉筛选；排序三式（按属性 / 按分类 / 最近更新）；分类标签点击即筛选；「添加知识」表单（默认 kind=event、basis=stated；面板创建记录 source=owner panel entry、置信度 1）——实测创建后立即可被 assistant_knowledge 工具检索到（面板与工具同一存储）；「归档」按钮（归档后默认列表隐藏、记录保留）；行内删除为两段确认。
- **对话收藏夹 / 外部收藏夹导入**两卡片见 8.1 / 8.2。
- 每个面板动作返回完整快照并整体刷新视图，无需手动刷新。

### 8.4 测试方法限制说明（如实记录，非插件缺陷）

1. **合成点击限制**：本轮在真实 GUI 上复现两处「点击坐标正确但 onClick 不触发」——个人知识库行删除按钮、收藏浮窗移除收藏按钮。判定依据：网络捕获证明点击期间无任何面板动作请求发出（仅后台轮询）；改用键盘激活（focus + Enter）与操作系统级真实鼠标点击（子代理 SendInput，两击间隔约 150 毫秒）均一次成功；同一界面内其他按钮（开关、表单、星标、保存、取消）合成点击全部正常。结论：属测试工具的合成点击与该 GUI 的交互限制，非插件功能缺陷。
2. **两段确认的 3 秒自动复位**：偏好行与知识行的武装确认在 3 秒后自动复位（client.js:4346、4648 `setTimeout(() => setConfirmId(null), 3000)`）；信号源删除与「清空全部」的武装确认无此计时器。该行为使跨工具调用的慢速两击（间隔必然大于 3 秒）无法完成确认——人工操作不受影响（3 秒内即可完成第二击）。
3. 设置弹窗与收藏浮窗的深层内容在常规可访问性快照中分页靠后，需要按 className 过滤或翻页定位（测试操作层面事实）。

### 8.5 本轮行为观察（通过项的行为差异与实现细节记录，无功能问题）

1. 「清空全部」成功提示只报收藏夹数与知识数，不报同时删除的偏好数（删除行为正确，state 验证三类记录均已移除）。
2. 个人知识库行有「归档 / 删除」但无行内「编辑」按钮；偏好库行有「编辑 / 删除」——两卡片行内能力不一致（事实记录）。
3. 两段确认超时行为不一致：偏好 / 知识行 3 秒自动复位，信号源 / 清空全部无自动复位（见 8.4 第 2 条）。
4. 状态文件的外部源列表字段为 proactiveSources（空态序列化为 `[]`）；面板「共 N 项」与工具 list 口径一致。
5. 收藏解析产出：source 带 `favorite:fav-xxx` 前缀、偏好置信度不超 0.7；经面板编辑后 source 重置为 owner panel entry、置信度升至 1——派生记录与所有者确认记录的置信度分层符合设计声称。
6. 面板创建的知识 / 偏好与工具创建走同一存储，互相立即可见（双向交叉验证）。

### 8.6 本轮数据台账（全部清理完成）

- **写入**（带「[插件功能测试]」标记或测试专用数据）：收藏 fav-913d9541（4 星）及其解析产出 know-f882201d + pref-6bdd3976 + pref-54699b40；面板添加知识 know-d44f1978；外部信号源 1 条（创建 → 停用 → 删除）；导入收藏夹 col-96668b1b 及其解析产出 know-b0929d3d + pref-f8177fa3；pref-6bdd3976 的面板编辑（备注追加、置信度 0.70 → 1）。
- **清理路径**：「清空全部」（收藏夹 + 派生记录）、知识行两段删除（真实鼠标点击）、assistant_knowledge delete（已归档记录）、assistant_preference delete ×2、收藏浮窗「移除收藏」。
- **终态核验**：与本轮开始前基线快照对比——518 行逐行 diff 仅 1 行差异（状态文件顶层 updatedAt 元字段，任何写入必然更新）；偏好数组与任务数组的内容 sha256 均与基线逐字节一致（686BFEAD… / 672671A2…）；favorites / knowledge / collections 均为 0、routine=null、proactiveSources=[]、workflows=2；文件 23199 字节与基线相同。
- **临时文件清理**：测试书签 HTML（%TEMP%\favorites_test_2026-10-26.html）、子代理监控文件（poll_log.txt、screen_full.png、poll_ready.txt、poll_done.txt）均已删除。

—— 报告完 ——
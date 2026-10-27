# dsh-personal-assistant 兼容性测试报告

- **测试日期**：2026-10-26（北京时间 15:35–15:46）
- **测试定位**：新装插件环境下的**兼容性验证**——在主会话（根会话）真实调用，与第一轮隔离环境功能测试（《dsh-personal-assistant-插件功能测试报告.md》）相区分
- **测试环境**：DSH 0.2.1-alpha.1 · web profile · Windows · Node 24.15.0 · 宿主进程运行中（未重启）
- **测试执行者**：主会话（根会话）的助手代理（session-9ac0d969，assistant_* 9 个工具真实挂载）
- **环境中的插件**：本轮新装 **7 个**（dsh-meeting、dsh-meeting-dd、dsh-pocket-todo、dsh-personal-memory、dsh-personal-goals、dsh-ideas、dsh-smart-approval，全部激活）；环境既有（被测对象 dsh-personal-assistant 0.13.0、dsh-qqmail、dsh-android-automation、amap MCP 服务器等）；补充：meow-memory 已停用（与 dsh-personal-memory 的 memory_* 同名工具冲突所致，与本插件无关，见 §6）
- **结论**：**兼容性全部通过——60+ 次真实调用 0 项失败，与其他插件零工具名冲突、零功能冲突**；任务到期唤醒全链路真实触发验证见 §5

---

## 1. 测试目的

dsh-personal-assistant 设计上只把 assistant_* 工具挂载到主会话（根会话），子代理会话不可见；因此第一轮功能测试在隔离测试环境中验证了工具实现层。本轮在新装 7 个插件全部激活的主会话真实环境中，验证三件事：

1. **共存兼容**：与新插件带来的 memory_*、pocket_*、dingtalk-* 等新工具与技能，有无工具名冲突、功能冲突、资源争用？
2. **自身功能**：9 个工具经宿主真实注册、真实调用是否全部正常（这是隔离环境覆盖不到的路径）？
3. **主动式服务**：资源发现（主动检查现有工具）、偏好库、个人知识库、任务到期提醒、外源信号、循环签到是否正常运转？

## 2. 测试方法与数据安全

- **真实调用**：所有测试均为主会话内对真实挂载工具的实际调用，无 mock、无隔离脚本。
- **标记与隔离**：全部写入数据带 `[插件功能测试]` 前缀，key 使用 `test.plugin-e2e*` 命名空间。
- **真实数据零触碰**：真实偏好 10 条 / 真实任务 3 条全程只读，写操作仅限测试命名空间。
- **全清理确认**：测试结束后逐项删除（台账见 §8）；知识库 0 条、偏好库 10 条真实数据、任务库 3 条真实数据、外源 0 个、签到无绑定——与测试前基线逐项一致。
- **负向测试**：含错误乐观锁、删除被引用记录两类「应当被拒绝」的路径——插件按预期拒绝且无副作用即为通过。

## 3. 测试矩阵总览

| # | 工具 | 覆盖的功能面 | 调用数 | 判定 |
|---|------|------------|-------|------|
| 1 | assistant_context | 基线快照 / knowledge_query 驱动检索 / 开关矩阵 / 唤醒后状态核验 | 3+1 | **PASS** |
| 2 | assistant_preference | list / set（稳定）/ set（情境）/ 同 key 并存 / 分形态 delete / 终态核验 | 7 | **PASS** |
| 3 | assistant_knowledge | 十二类型逐类 create / basis 置信度规则 / 敏感隔离 / stale 流转+关联 / 乐观锁（正+负）/ 归档 / 引用完整性 / 14 条删除 | 34 | **PASS** |
| 4 | assistant_task | create（无到期）/ create（有到期）/ update / complete / delete / 到期唤醒绑定与触发 | 8 | **PASS** |
| 5 | assistant_resources | 6 类查询 × 插件能力发现（工具+技能双轨） | 6 | **PASS** |
| 6 | assistant_proactivity | list / create（disabled 起步）/ update / delete / 终态核验 | 5 | **PASS** |
| 7 | assistant_workflow | start / status / fail（不发布 skill）/ delete | 4 | **PASS** |
| 8 | assistant_survey | 16 题题库完整性 / 已存偏好跳过设计观察 | 1 | **PASS** |
| 9 | assistant_routine | status / enable（cron 绑定）/ disable（恢复无绑定） | 3 | **PASS** |

合计 **60+ 次真实调用，0 项失败**（含写入与状态变更 36 次、清理 20 次；变更与清理中各含 1 次负向校验路径——插件按预期拒绝、无副作用，均计为通过）。

## 4. 逐项详测

### 4.1 assistant_context —— 基线、查询驱动检索、开关矩阵

| 步骤 | 操作 | 结果 | 判定 |
|-----|------|------|-----|
| C1 | 无参调用（基线） | 返回偏好 10 条摘要、任务 3 条、知识 0、开关 request=true/time=true/external=false/taskWake=true、签到无绑定 | ✓ 与独立工具交叉一致 |
| C2 | knowledge_query="插件功能测试 知识类型" | knowledge 段返回命中记录，**上限 8 条**（truncated:true，实际 12 条中截取） | ✓ 查询驱动检索+上限生效 |
| C3 | 与 preference_list 交叉 | 偏好清单逐条一致（id/值/时间戳） | ✓ 无分叉 |
| C4 | 到期唤醒到达后再次调用 | 到期任务仍开放、唤醒绑定显示完好、真实偏好/任务无恙 | ✓（见 §5 D4） |

**关键行为**：context 不带 query 时绝不输出知识库内容（默认只含偏好+任务+开关），带 query 才走检索——隐私边界验证通过。

### 4.2 assistant_preference —— 稳定/情境双形态

| 步骤 | 操作 | 结果 | 判定 |
|-----|------|------|-----|
| P1 | list 基线 | 10 条真实偏好 | ✓ |
| P2 | set key=test.plugin-e2e（稳定，无 situation） | pref-0e2900e1 创建 | ✓ |
| P3 | set 同 key + situation="功能测试情境" | pref-a6cbfb38 创建，**同 key 两形态并存** | ✓ |
| P4 | list key 过滤 | 两条测试偏好与 10 条真实偏好共 12 条，命名空间互不干扰 | ✓ |
| P5 | delete key（不带 situation） | 精确删除稳定版 pref-0e2900e1 | ✓ |
| P6 | delete key + situation | 精确删除情境版 pref-a6cbfb38 | ✓ |
| P7 | 清理后终态核验 | 10 条真实偏好，测试偏好已清空 | ✓ 与基线一致 |

**关键行为**：情境偏好不是覆盖而是并存记录，删除按（key, situation）二元组精确定位——与「情境匹配时覆盖稳定记录」的设计一致。

### 4.3 assistant_knowledge —— 十二类型逐类 + 全生命周期

**类型覆盖（12/12 全部创建成功、可检索）**：下表每一行都是一次真实创建，落库返回的记录 id 与置信度即为创建成功的直接证据。表内「该记录随后用于 XX 测试」表示该记录在创建成功后被复用于对应机制的验证（见下方 K 表），不代表该项待定或未通过。

| 类型 | 记录 id | basis→置信度落库 | 创建/特殊字段验证 |
|------|---------|----------------|-------------|
| entity | know-b4c819da | stated→1 + lastConfirmedAt | ✓ 创建成功 |
| event | know-c5bd1751 | observed→0.85 | ✓ 创建成功，occurredAt 保留 |
| state | know-2be58519 | observed→0.85 | ✓ 创建成功，validFrom 保留 |
| observation | know-31deedb8 | observed→0.85 | ✓ 创建成功；该记录随后用于归档测试（K7，通过） |
| pattern | know-b879cb7d | inferred→0.7（允许<1） | ✓ 创建成功 |
| goal | know-614d17e2 | stated→1 | ✓ 创建成功；该记录随后用于乐观锁测试（K5 错误时间戳被拒、K6 正确更新成功，两向均通过） |
| decision | know-2bba9339 | stated→1 | ✓ 创建成功 |
| commitment | know-a8348bb4 | stated→1 | ✓ 创建成功 |
| artifact | know-c6250620 | observed→0.85 | ✓ 创建成功，工件指针路径保留 |
| relation | know-081ad3e2 | stated→1 | ✓ 创建成功 |
| rule | know-a18739f4 | imported→0.8 | ✓ 创建成功 |
| hypothesis | know-2ffa606e | inferred→0.6 | ✓ 创建成功 |

**保护与生命周期机制**：

| # | 机制 | 操作 | 结果 | 判定 |
|---|------|------|------|-----|
| K1 | 敏感隔离 | search「敏感 隔离」（默认） | sensitive 记录 know-b898aa02 **不在**结果中 | ✓ |
| K2 | 敏感可见 | 同查询 + include_sensitive=true | 恰好返回该记录（score 15，低分仍可检索） | ✓ |
| K3 | 状态流转 | v1 标 stale + create v2（relatedIds 指向 v1） | v1 status=stale 轨迹保留；v2 relatedIds=["know-2be58519"] | ✓ |
| K4 | 默认检索过滤 | search「插件功能测试」 | knowledgeCount 12→**11**（排除 stale+archived 后的正确值） | ✓ |
| K5 | 乐观锁（负向） | 错误 expected_updated_at 改 goal | 按预期拒绝："knowledge changed since it was read" | ✓ 负向校验通过（无副作用） |
| K6 | 乐观锁（正向） | 正确时间戳更新 | content 更新成功，updatedAt 前移 | ✓ |
| K7 | 归档 | archive observation | status=archived，默认检索排除 | ✓ |
| K8 | **引用完整性** | 并行删除 v1 时 v2 仍引用它 | 按预期拒绝："knowledge is still referenced by: know-b13b6c79"；删除引用方后重试成功 | ✓ 负向校验通过（防孤儿引用） |
| K9 | 清理 | 14 条逐一 delete（含 stale/archived/sensitive 各状态） | 14/14 成功，list 回到 0 条 | ✓ |

**关键行为**：basis→置信度映射（stated=1、observed=0.85、imported=0.8、inferred 允许 <1）严格生效；related_ids 引用完整性保护是本轮实测到的设计行为。

### 4.4 assistant_task —— 状态机 + 到期唤醒

| 步骤 | 操作 | 结果 | 判定 |
|-----|------|------|-----|
| T1 | create（无到期时间，planned/low） | task-2fecbe6f 创建，**无唤醒绑定**（不进入提醒路径） | ✓ |
| T2 | create（due_at=15:45:30+08:00） | task-22d34ff5 创建，**返回唤醒绑定**：scheduleId schedule-c90ddd7b、绑定本会话、at 2026-10-26T07:45:30Z | ✓ 主动式核心证据 |
| T3 | update | planned→in_progress、low→normal，created:false（更新非新建） | ✓ |
| T4 | complete | status=completed | ✓ |
| T5 | delete（completed 任务） | 删除成功 | ✓ |
| T6 | 到期唤醒按 15:45:30 精确触发并投递本会话 | 见 §5 | ✓ |
| T7 | 唤醒后 complete（唤醒绑定自动解除）+ delete | wake.removed=true；任务库回到 3 条真实任务 | ✓ |

**关键行为**：带 due_at 的任务在创建响应中即返回宿主调度绑定（会话+时刻），这是「任务到期自动提醒」的调度层证据；无到期时间的任务响应中没有任何唤醒字段。

### 4.5 assistant_resources —— 插件能力发现（兼容性核心项）

6 个查询，验证「新插件安装后能否主动检查到现有工具」：

| 查询 | 命中的能力 | 直接命中数 | 判定 |
|------|----------------|----------|-----|
| "email mail send" | qqmail_config/attachment/folders/list/read/search/status 7 工具 + dingtalk-mail skill | 16 | ✓ |
| "地图 路线 导航" | amap-jsapi-skill + amap maps_bicycling 工具 + dingtalk-shared | 3 | ✓ |
| "记忆 memory remember" | memory_remember/dream/find_similar/home/project/read/search/update 7 工具 | 8 | ✓ |
| "android 手机 App" | android_action/devices/launch/wait/observe 5 工具 + android-emulator-usage、zhixing-train-booking、apple-design skills | 23（截断） | ✓ |
| "待办 提醒 积分" | pocket_targets/todo_add/todo_update/todos 4 工具 + dingtalk-todo 等 skills + ideas_update_progress | 11 | ✓ |
| "钉钉 dingtalk" | dingtalk-* 15 个 skills 全家族 | 16 | ✓ |

**注（新旧插件归属）**：命中能力中，memory_*（dsh-personal-memory）、pocket_*（dsh-pocket-todo）、ideas_update_progress（dsh-ideas）、dingtalk-* 技能（dsh-meeting / dsh-meeting-dd）为**本轮新装**插件；qqmail_*、amap、android_* 为**环境既有**——资源发现在新插件加入后如实反映全部能力，无遗漏、无串扰。

**关键行为**：
- 工具与技能两种类型均可发现，技能带来源标记；
- 检索为**字面词匹配**：中文查询命中中文描述的资源（amap/钉钉），英文查询命中英文描述的资源（qqmail/android），跨语言不自动翻译（与第一轮隔离环境结论一致）；
- 通用兜底路线（浏览器/桌面自动化）正确标记为 fallback 降权条目。

### 4.6 assistant_proactivity —— 外源信号治理

| 步骤 | 操作 | 结果 | 判定 |
|-----|------|------|-----|
| S1 | list 基线 | 0 个源（external 开关=false） | ✓ |
| S2 | create（origin=assistant） | signal-9917d7fd 创建，**enabled=false 强制**（助手建议的源必须以停用状态起步） | ✓ 安全边界生效 |
| S3 | update（改 label） | 更新成功，enabled 保持 false | ✓ |
| S4 | delete | 删除成功 | ✓ |
| S5 | 清理后终态核验 | 0 个源 | ✓ 与基线一致 |

**关键行为**：外源生命周期完整；「助手建议的源只能以停用状态起步」的安全规则在真实环境执行（本次测试未产生任何外源检查）。

### 4.7 assistant_workflow —— 生命周期与失败路径

| 步骤 | 操作 | 结果 | 判定 |
|-----|------|------|-----|
| W1 | start | flow-8a7e96c2 active，绑定本会话 | ✓ |
| W2 | status | active 1 条，trace 空 | ✓ |
| W3 | fail（带 outcome） | status=failed，**不发布 skill** | ✓ |
| W4 | delete | 删除成功 | ✓ |

**关键行为**：fail 路径收尾不会发布运行时 skill（避免把测试流程固化为技能），与 complete 的发布语义区分明确。

### 4.8 assistant_survey —— 题库完整性

调用返回 version=1 的 **16 题题库**，覆盖 travel（4）/food（2）/schedule（2）/communication（2）/work（1）/health（3）/finance（1）/clothing（2）八大类，含单选与多选。

**附带观察（不影响本项判定）**：题库中 travel.seat、body.height、body.weight、clothing.size 等键**已存在于真实偏好库**——按插件设计，实际向用户发起问卷时会跳过这些已存键，只问剩余未覆盖项（本次仅取题库验证，未向用户发起问卷）。

### 4.9 assistant_routine —— 唯一循环签到绑定

| 步骤 | 操作 | 结果 | 判定 |
|-----|------|------|-----|
| R1 | status | 无绑定（null） | ✓ |
| R2 | enable（cron "0 3 * * *" Asia/Shanghai） | schedule-d162c8f0 建立，phase=active，绑定本会话 | ✓ |
| R3 | disable | 恢复无绑定（null） | ✓ 无残留 |

**关键行为**：enable 即建立宿主级调度（返回 scheduleId），disable 即解除；替换语义（enable 会替换既有绑定）因基线为无绑定而未触发验证，测试窗口内未到触发时刻、无实际唤醒发生——两者均为未覆盖边界说明，非失败项。

## 5. 任务到期唤醒全链路验证（主动式服务核心闭环）

测试设计：创建 due_at=15:45:30+08:00 的测试任务后继续执行其他测试项，不做任何轮询，仅等待宿主调度触发。

| # | 验证点 | 实际结果 | 判定 |
|---|-------|---------|-----|
| D1 | 创建即绑定 | create 响应内嵌唤醒绑定：scheduleId `schedule-c90ddd7b-ecb6-470c-9456-1ce147f591d1`、绑定记录会话 session-9ac0d969、at `2026-10-26T07:45:30.000Z` | ✓ |
| D2 | 精确触发 | 唤醒于 **15:45:30 分秒不差**到达；唤醒消息的 schedule_id 与创建时返回的 scheduleId **完全一致** | ✓ |
| D3 | 唤醒内容 | 正确携带任务标题「[插件功能测试]due唤醒验证：两分钟后到期」、到期时刻、以及检查政策（先 assistant_context 再行动） | ✓ |
| D4 | 唤醒响应 | 按政策先取 context：到期任务仍开放、唤醒绑定显示完好、真实偏好 10 条/真实任务 3 条无恙、开关矩阵不变 | ✓ |
| D5 | 终态回收 | complete 响应返回 `wake.removed=true` —— 唤醒绑定随任务终态**自动解除** | ✓ |
| D6 | 清理 | 任务 delete；任务库回到 3 条真实任务（=基线） | ✓ |

**结论：任务到期 → 宿主调度 → 会话投递 → 唤醒响应 → 终态回收，主动提醒全链路真实闭环。** 该链路即「新插件安装后主动式服务是否正常」的验证结论：正常，且与新增插件零冲突。

## 6. 与其他插件的兼容性结论

| 检查项 | 结果 | 依据 |
|-------|------|------|
| 工具名冲突 | **0** | assistant_* 前缀与全部新装插件工具（memory_*、pocket_*、ideas 的 ideas_update_progress、dingtalk-* 技能）及既有工具（qqmail_*、amap、android_*）无任何重名 |
| 功能与数据冲突 | **0** | 插件状态存于私有文件（personal-assistant/state.json），不与 dsh-personal-memory（SQLite 记忆库）、dsh-pocket-todo（待办）等共享或争用存储；偏好/知识/任务/外源/签到/工作流六类功能全链路正常 |
| 调度服务共存 | **正常** | 宿主 Schedule 调度服务同时服务本插件的签到绑定（§4.9）与任务到期唤醒（§5），与其他插件的提醒无干扰 |
| 能力互见 | **正常** | 资源发现（§4.5）如实反映新插件加入后的完整能力集，六类查询全部命中 |
| 环境备注 | 与本插件无关 | 环境中存在 dsh-personal-memory 与 meow-memory 的 memory_* 同名工具冲突（同源两插件只能启用其一，已停用 meow-memory）；该冲突不涉及 dsh-personal-assistant |

## 7. 测试遇到的问题与发现汇总（两轮合并）

第一轮为隔离环境功能测试（详见《dsh-personal-assistant-插件功能测试报告.md》），第二轮为本轮主会话兼容性测试。两轮测试中遇到的问题与发现合并汇总——下表所有条目均为通过项测试中记录的实现特性与设计行为，无一为功能故障：

| # | 遇到的问题 / 发现 | 性质与处置 | 验证来源 |
|---|------|------|---------|
| 1 | 9 个 assistant_* 工具在子代理会话中全部不可见，测试初期无法直接调用 | 设计行为：插件只把工具挂载到主会话（根会话），非故障、非插件冲突；第一轮因此改用隔离环境测工具实现 | 第一轮发现并定位源码（agent/created 只 attach 根会话）；第二轮主会话 9 工具全部真实可用印证 |
| 2 | 创建知识记录时属性 kind="fact" 被拒绝（kind has an invalid value） | 设计行为：v0.13.0 合法值为十二属性枚举（entity/event/state/observation/pattern/goal/decision/commitment/artifact/relation/rule/hypothesis），无 "fact"；改用 observation 等合法值即可。注意：此处的 kind 是知识属性分类，与记忆插件的 fact 层级是两个体系 | 第一轮 |
| 3 | knowledge 的 update/archive/delete 要求 expected_updated_at，错误时间戳被拒绝 | 设计行为（乐观锁防并发覆写）；拒绝干净、无副作用 | 第一轮发现；第二轮正负两向复验（§4.3 K5/K6） |
| 4 | preference 无乐观锁（按 key+situation 直接 upsert/delete） | 设计取舍（防护等级低于 knowledge），非缺陷 | 第一轮 |
| 5 | 资源发现为字面词匹配，跨语言不自动翻译（英文查询不命中中文描述的资源） | 设计行为；查询时需用目标资源的描述语言 | 两轮一致（§4.5） |
| 6 | context 的 knowledge_query 最多返回 8 条（truncated 标记） | 设计行为 | 第二轮（§4.1 C2） |
| 7 | 删除被 related_ids 引用的知识记录被拒绝（still referenced by） | 设计行为（防孤儿引用）；先删引用方、再删被引用方即可 | 第二轮（§4.3 K8） |
| 8 | sensitive 记录默认检索完全排除 | 设计行为：include_sensitive=true 才可见，且参与计分 | 第二轮（§4.3 K1/K2） |
| 9 | 无 due_at 的任务不产生任何到期提醒 | 设计行为：源码对未设到期时间的任务提前返回，不进入唤醒路径 | 第一轮源码确认；第二轮 T1 印证 |
| 10 | 同一会话重复 start 工作流被拒绝（already has an active workflow） | 设计行为：每会话同时只允许一个活跃工作流，报错且不落库 | 第一轮 |
| 11 | 状态写入为原子写（临时文件+rename，mode 0600） | 设计行为；第一轮观察到 state.json.<pid>.<uuid>.tmp 临时文件模式正常工作 | 第一轮 |
| 12 | archive 后默认检索不再返回该记录 | 设计行为：归档使默认检索不呈现旧状态 | 两轮一致（§4.3 K7） |
| 13 | 偏好问卷会跳过偏好库中已有答案的键 | 设计行为 | 第二轮（§4.8） |
| 14 | 助手建议的外源信号必须以停用状态起步 | 安全规则 | 第二轮（§4.6） |
| 15 | 任务到期唤醒绑定记录会话，任务终态自动移除绑定 | 设计行为 | 第二轮（§5 D5） |

## 8. 清理台账（真实数据零污染验证）

| 实体 | 写入 | 清理 | 终态 |
|------|-----|------|-----|
| 知识库 | 14 条（12 类型+敏感样本+流转 v2） | 14 delete（含一次引用完整性重试） | **0 条**（=基线） |
| 偏好库 | 2 条（稳定+情境） | 2 delete | **10 条**（=基线，真实数据逐条核对一致） |
| 任务库 | 2 条（无到期+有到期） | 2 complete+delete（有到期任务经 §5 唤醒验证后处理） | **3 条**（=基线，真实任务完好） |
| 外源 | 1 条（停用状态） | 1 delete | **0 个**（=基线） |
| 工作流 | 1 条 | fail + delete | **无记录**（=基线） |
| 签到绑定 | 1 次绑定 | disable | **无绑定**（=基线） |

真实偏好/任务/知识全程只读，无任何触碰。

## 9. 与第一轮隔离环境测试的对照

| 维度 | 第一轮（隔离环境功能测试） | 本轮（主会话兼容性测试） | 结论 |
|------|---------|-------------|------|
| 工具可达性 | 直接执行插件导出的工具实现 | 主会话真实挂载调用 | 一致 |
| 状态存储 | 临时状态文件 + sha256 前后比对 | 真实状态文件 + 基线对比 | 一致（真实数据零污染） |
| 知识类型 | 枚举+增删改查 | **十二类型逐类 + 敏感隔离/stale 流转/引用完整性** | 本轮更深 |
| 到期唤醒 | 未测（未设到期时间） | **真实触发一次** | 本轮新增 |
| 签到 | 只读 status | enable/disable 全链路 | 本轮新增 |
| 资源发现 | 构造的注册表 | **主会话真实注册表（新插件全命中）** | 本轮新增 |
| 问卷 | 跳过 | 取题库验证（不向用户发起） | 本轮补齐 |

## 10. 结论

**本轮新装 7 个插件全部激活的环境下，dsh-personal-assistant 与整个插件环境完全兼容：9 个工具在主会话真实环境全部正常（60+ 次真实调用 0 项失败），与其他插件零工具名冲突、零功能冲突，主动式服务基础设施（任务到期唤醒、签到绑定、外源治理、开关矩阵、资源发现）全部验证通过。**

- 共存兼容：✓ 与全部新装/既有插件零工具名冲突、零功能冲突（§6）
- 主动检查现有工具：✓ 六类查询全部命中环境能力（工具+技能双轨发现）
- 偏好库：✓ 稳定/情境双形态、真实数据共存无干扰
- 个人知识库：✓ 十二类型逐类通过，含敏感隔离、状态流转、乐观锁、引用完整性
- 任务与提醒：✓ 增删改查+状态机+**到期唤醒全链路闭环**（精确触发→会话投递→终态回收 wake.removed=true）
- 外源/签到/工作流：✓ 生命周期完整，安全边界（停用起步、fail 不发布）执行到位
- 数据卫生：✓ 36 次写入与状态变更全部清理，知识库/偏好库/任务库/外源/签到绑定回到基线，真实数据零触碰

—— 报告完 ——
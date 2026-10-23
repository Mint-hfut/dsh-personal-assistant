window.__ModuleLoader__.load({
  id: 'dsh-personal-assistant',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    'use strict'

    const React = require('react')
    const h = React.createElement
    const { useEffect, useLayoutEffect, useRef, useState } = React

    const STATE_URL = '/api/personal-assistant/state'
    const ACTION_URL = '/api/personal-assistant/action'
    const MAX_LEAD_MINUTES = 1440

    const DICTS = {
      zh: {
        'sectionTitle': '个人助理',
        'sectionDesc': '分别控制需求内主动、时间驱动主动和外部信息驱动主动，并管理唤醒、偏好与个人知识。三个主动性开关与任务唤醒保存后立即生效；例程字段在下次启用例程时生效。',
        'requestProactivity': '需求内主动',
        'requestProactivityHint': '用户提出事项后，主动识别会影响结果的依赖、信息缺口、后续动作和关怀事项。',
        'timeProactivity': '时间驱动主动',
        'timeProactivityHint': '从当前对话、已读取来源和个人知识中提取未来事项，去重后创建或更新任务，并安排适当的提前检查。',
        'externalSourcesTitle': '外部信息驱动主动',
        'externalSourcesDesc': '可增长的只读信号源订阅。助理建议的新来源默认关闭；用户可以启用、停用、添加或删除。唤醒时只检查与未结任务或当前信号相关的已启用来源。',
        'externalSourcesEmpty': '暂无外部信号源。您可以添加一个，助理也可以在后续交互中提出默认关闭的建议。',
        'externalSourceCount': (n, enabled) => `共 ${n} 项，已开启 ${enabled} 项`,
        'externalSourceKey': '标识（如 mail.travel-changes）',
        'externalSourceLabel': '显示名称',
        'externalSourcePurpose': '要关注的变化',
        'externalSourceQuery': '能力检索词（如 email travel change）',
        'externalSourceAdd': '添加并开启',
        'externalSourceOriginOwner': '用户指定',
        'externalSourceOriginAssistant': '助理建议',
        'externalSourceDelete': '删除来源',
        'taskWake': '任务到点唤醒',
        'taskWakeHint': '为带截止时间的任务自动安排到点提醒（在记录任务的会话中投递）；改期会自动跟随，完成、取消或删除任务时移除。',
        'lead': '提前唤醒（分钟）',
        'leadHint': '在截止时间前多少分钟唤醒；0 表示准点。范围 0–1440。',
        'cron': '例程 cron 表达式',
        'cronHint': '五字段 Vixie cron，控制周期性主动问询（assistant_routine 启用时使用）。',
        'timeZone': '时区',
        'timeZoneHint': '例程使用的 UTC 或 IANA 时区，例如 Asia/Shanghai。',
        'title': '提醒卡片标题',
        'titleHint': '例程提醒在任务列表中显示的标题。',
        'save': '保存',
        'saving': '保存中…',
        'saved': '已保存',
        'saveFailed': '保存失败',
        'reset': '重置',
        'overridden': '已覆盖',
        'loading': '正在加载设置…',
        'loadFailed': '设置面板暂不可用（插件宿主未启用 webserver 或插件未加载）。',
        'retry': '重试',
        'refreshFailed': '刷新失败，稍后可重试。',
        'badCron': 'cron 必须是五字段表达式',
        'badLead': '提前分钟数必须是 0–1440 的整数',
        'wakeTitle': '唤醒与例程',
        'wakeListTitle': '唤醒清单',
        'wakeListDesc': '助理安排的到点唤醒与例程（数据来自宿主调度器，实时读取）。唤醒随任务完成、取消或删除自动移除；关闭「任务到点唤醒」后，已记录的唤醒在下一次任务操作时清除。',
        'wakeEmpty': '暂无安排中的唤醒。',
        'wakeUnavailable': '宿主未提供调度服务，唤醒清单不可用。',
        'wakeRefresh': '刷新',
        'wakeFilterAll': '全部',
        'wakeFilterActive': '活跃',
        'wakeKindTask': '任务到点',
        'wakeKindRoutine': '例程',
        'wakeStatusArmed': '已安排',
        'wakeStatusOff': '未安排',
        'wakeStatusGone': '已失效',
        'wakeStatusInactive': '已结束',
        'wakeTaskCompleted': '任务已完成',
        'wakeTaskCancelled': '任务已取消',
        'wakeNext': '下次触发',
        'wakeLast': '上次触发',
        'wakeDue': '截止',
        'wakeSession': '会话',
        'prefTitle': '偏好库',
        'prefDesc': '助理记住的稳定偏好与情景偏好。分类以 8 个核心领域（出行/饮食/作息/沟通/工作/健康/财务/穿搭）为主，运动/文娱/教育/购物按需单独使用，其余归入其他；此处的增删与对话中的 assistant_preference 走同一条路径，立即对后续对话生效；从收藏夹推断出的偏好会标注 collection 来源与较低置信度，不会覆盖您自己保存的偏好。',
        'prefEmpty': '暂无偏好记录。',
        'prefCount': (n, shown) => `共 ${n} 条，显示最新 ${shown} 条`,
        'prefAdd': '添加偏好',
        'prefKey': '键（如 food.coffee）',
        'prefSituation': '情景（可选，如 出差时）',
        'prefValue': '内容',
        'prefCategory': '分类',
        'prefCategoryCore': '核心分类',
        'prefCategorySecondary': '次要分类（按需）',
        'prefCategoryOtherGroup': '其他',
        'prefAddBtn': '添加',
        'saveEdit': '保存修改',
        'prefAdding': '添加中…',
        'delete': '删除',
        'confirmDelete': '确认删除',
        'deleted': '已删除',
        'badPrefKey': '请填写偏好键',
        'badPrefValue': '请填写偏好内容',
        'situational': '情景',
        'categories': ['travel', 'food', 'schedule', 'communication', 'work', 'health', 'finance', 'clothing', 'sports', 'media', 'learning', 'shopping', 'other'],
        'prefFilterAll': '全部',
        'prefFilterStable': '稳定',
        'prefFilterSituational': '情景',
        'prefStatTotal': '偏好',
        'prefStatDomains': '分类',
        'prefStatSituational': '情景偏好',
        'prefStatConfidence': '平均置信度',
        'prefFilterEmpty': '当前筛选下没有偏好。',
        'prefCollapse': '收起',
        'prefExpand': '展开',
        'listFilterEmpty': '当前筛选下没有条目。',
        'favStatTotal': '收藏',
        'favStatParsed': '已解析',
        'favStatPending': '待解析',
        'favStatStars': '平均星级',
        'favParsedCounts': (k, p) => `知识 ${k} · 偏好 ${p}`,
        'knowledgeStatTotal': '知识',
        'knowledgeStatKinds': '属性',
        'knowledgeStatGenres': '分类',
        'knowledgeStatSources': '来源',
        'knowledgeStatConfidence': '平均置信度',
        'knowledgeSortBy': '排序',
        'knowledgeGenreFilter': '分类',
        'kindScopes': {
          entity: '人物 / 项目 / 地点 / 组织',
          relation: '谁负责 / 谁对接 / 依赖',
          artifact: '文件 / 链接 / 清单 / 成果',
          event: '时间 / 地点 / 经历',
          observation: '现象 / 行为规律 / 证据',
          state: '阶段 / 状况 / 约束',
          goal: '目标 / 进度 / 期限',
          decision: '选择 / 理由 / 备选',
          commitment: '承诺 / 交付 / 截止',
          pattern: '方法 / 经验 / 适用条件',
          rule: '约束 / 政策 / 红线',
          hypothesis: '猜测 / 待验证 / 低置信',
        },
        'knowledgeAttributePrefix': '属性',
        'knowledgeTypePrefix': '数据类型',
        'knowledgeSortKind': '按属性',
        'knowledgeSortGenre': '按分类',
        'knowledgeSortRecent': '最近更新',
        'knowledgeUncategorized': '未分类',
        'prefStable': '稳定',
        'prefSituational': '情景',
        'prefConfidence': '置信度',
        'prefSourceCollection': '收藏夹推断',
        'prefSourcePanel': '手动添加',
        'prefSourceOwner': '对话确认',
        'prefFormAdd': '添加一条偏好',
        'prefFormEdit': '编辑这条偏好',
        'prefKeyLabel': '偏好键',
        'prefSituationLabel': '情景（可选）',
        'prefValueLabel': '内容',
        'prefCategoryMeta': {
          travel: { label: '出行', tier: 'core', scope: '交通 / 住宿 / 行程 / 目的地', boundary: '旅途中吃喝玩乐归出行，长期口味归饮食。' },
          food: { label: '饮食', tier: 'core', scope: '口味 / 食材 / 菜系 / 做饭 / 餐厅', boundary: '长期口味归饮食；旅途中吃喝玩乐归出行。' },
          schedule: { label: '作息', tier: 'core', scope: '睡眠 / 起床 / 专注时段 / 日常节奏', boundary: '日常节奏、专注时段归作息；工作方法、流程归工作。' },
          communication: { label: '沟通', tier: 'core', scope: '表达 / 汇报 / 反馈 / 消息渠道', boundary: '表达、汇报方式归沟通；工作产出、项目归工作。' },
          work: { label: '工作', tier: 'core', scope: '职业方法 / 协作 / 项目 / 职业发展', boundary: '工作方法、流程、产出、项目、职业发展都归工作；学习课程、研究归教育。' },
          health: { label: '健康', tier: 'core', scope: '身体心理 / 康复 / 就医 / 健康目标', boundary: '健康目标、康复归健康；训练、赛事归运动。' },
          finance: { label: '财务', tier: 'core', scope: '收支 / 预算 / 投资 / 保险', boundary: '预算、投资归财务；具体购买、比价归购物。' },
          clothing: { label: '穿搭', tier: 'core', scope: '风格 / 版型 / 尺码 / 搭配', boundary: '穿搭风格、版型、尺码归穿搭；买衣服的比价、渠道归购物。' },
          sports: { label: '运动', tier: 'secondary', scope: '训练 / 赛事 / 装备 / 户外 / 健身，含观看体育（F1、花滑、骑行赛事）', boundary: '训练、赛事、装备与观看体育都归运动，不要放到文娱；休闲阅读归文娱。' },
          media: { label: '文娱', tier: 'secondary', scope: '影视 / 音乐 / 游戏 / 动漫 / 阅读 / 演出 / 展览 / 艺术 / 设计 / 手作 / 摄影', boundary: '影视、音乐、游戏、休闲阅读归文娱；以学习为目的的阅读归教育。' },
          learning: { label: '教育', tier: 'secondary', scope: '课程 / 学科 / 考试 / 语言 / 研究 / 学习资源', boundary: '课程、学科、考试、语言、研究归教育；工作中应用归工作。' },
          shopping: { label: '购物', tier: 'secondary', scope: '选购标准 / 比价 / 渠道 / 品牌型号 / 消费决策', boundary: '具体购买、比价、渠道、品牌型号归购物；预算、投资归财务。' },
          other: { label: '其他', tier: 'other', scope: '技术 / 工程 / 家居等无法归类的领域', boundary: '只放真正无法归入前 12 类的内容；旧 career 归工作，旧 arts 归文娱。' },
        },
        'knowledgeTitle': '个人知识库',
        'knowledgeDescIntro': '有来源、时间与置信度的个人知识。',
        'knowledgeDescAttribute': '**属性（kind）**适用于**系统管理**：说明这条知识是什么性质，供检索、生命周期与 RAG 使用。',
        'knowledgeDescType': '**类型（genre）**适用于**用户整理**：说明它是什么形态、拿来做什么，便于按用途归类。',
        'knowledgeDescView': '默认按属性分组；类型以可点击标签和筛选胶囊呈现。',
        'knowledgeDescNote': '偏好、任务和工作流仍由各自工具管理，敏感记录不在此清单展示。',
        'knowledgeEmpty': '暂无知识记录。',
        'knowledgeCount': (n, shown) => `共 ${n} 条，显示最近 ${shown} 条`,
        'knowledgeSearch': '搜索标题、内容或标签',
        'knowledgeKind': '类型',
        'knowledgeBasis': '来源类型',
        'knowledgeTitleInput': '标题',
        'knowledgeContent': '内容',
        'knowledgeTags': '标签（逗号分隔）',
        'knowledgeAdd': '添加知识',
        'knowledgeExpand': '展开',
        'knowledgeCollapse': '收起',
        'knowledgeExpandAll': '全部展开',
        'knowledgeCollapseAll': '全部收起',
        'knowledgeOccurred': '发生',
        'knowledgeDomain': '领域',
        'knowledgeScene': '场景',
        'knowledgeSource': '来源',
        'knowledgeUpdated': '更新',
        'knowledgeParsedUpdated': '解析/更新',
        'knowledgeSourceOwner': '主人',
        'knowledgeSourceCollection': '收藏夹解析',
        'knowledgeSourceCollectionNamed': name => `收藏夹「${name}」`,
        'knowledgeSourceFavorite': '对话收藏解析',
        'knowledgeArchive': '归档',
        'knowledgeArchived': '已归档',
        'knowledgeBadTitle': '请填写知识标题',
        'knowledgeBadContent': '请填写知识内容',
        'knowledgeKinds': ['entity', 'event', 'state', 'observation', 'pattern', 'goal', 'decision', 'commitment', 'artifact', 'relation', 'rule', 'hypothesis'],
        'kindEntity': '对象',
        'kindEvent': '事件',
        'kindState': '状态',
        'kindObservation': '观察',
        'kindPattern': '方法模式',
        'kindGoal': '目标',
        'kindDecision': '决策',
        'kindCommitment': '承诺',
        'kindArtifact': '产出物',
        'kindRelation': '关系',
        'kindRule': '规则',
        'kindHypothesis': '假设',
        'kindHelpEntity': '一个事物、人物、地点或组织的稳定事实。用途：识别人物、项目、地点等对象，让后续判断知道说的是谁、哪儿。例：林岚是 Apollo 项目的联系人。',
        'kindHelpEvent': '某时某地发生的一次事情。用途：保留带时间的个人经历，作为“上次是怎么做的”依据。例：上次赴南京参加了项目评审。',
        'kindHelpState': '一段时间内持续、会变化的状况。用途：识别当前有效的阶段与约束；变化时旧记录标为过时并关联新记录。例：本周处于项目验收阶段。',
        'kindHelpObservation': '注意到的现象或行为规律。用途：保存行为证据，供后续分析，本身不等同于结论或偏好。例：最近三次长会均提前离场。',
        'kindHelpPattern': '可复用的做法或经验，不强制。用途：保留有依据的经验；具体执行流程仍需验证后再复用。例：历次晚到行程均优先比较接驳时间。',
        'kindHelpGoal': '想达成的结果，可有进度和期限。用途：判断方案是否服务当前目标。例：本季度完成 Apollo 项目验收。',
        'kindHelpDecision': '已做出的选择及理由或备选。用途：保留选择理由，条件相似时可直接参考。例：上次选高铁，因为门到门更快。',
        'kindHelpCommitment': '答应别人或自己要做的事。用途：保存承诺事实；截止时间与跟进另建任务，不混在知识里。例：已向客户承诺周五提供修订稿。',
        'kindHelpArtifact': '做出来的文件、作品、链接或清单。用途：查找已有成果与参考资料，避免重复做。例：上次项目汇报材料的文件位置。',
        'kindHelpRelation': '两个对象或记录之间的连接。用途：确定沟通对象与职责关系，知道该找谁、谁负责哪部分。例：林岚负责该项目的需求确认。',
        'kindHelpRule': '必须遵守的约束、政策或标准。用途：保存外部规则及其适用范围，行动越界前先检查。例：客户园区要求访客提前一天登记。',
        'kindHelpHypothesis': '待验证的猜测，置信度应低于 1。用途：保留待确认推断，绝不能当作确定偏好或事实。例：用户可能倾向于缩短会议时长。',
        'kindFamilyFacts': '事实与经历',
        'kindFamilyMethods': '方法与约束',
        'kindFamilyIntent': '意向与行动',
        'kindFamilyAssets': '资产、关系与假设',
        'knowledgeBases': ['stated', 'observed', 'inferred', 'imported'],
        'favTitle': '对话收藏夹',
        'favDesc': '收藏的整轮对话（提问、执行过程、回复）、星级、收藏原因与备注。星级表示该轮对话对您个人知识库的重要性，既决定解析顺序，也写入知识库的优先级；解析时会把收藏原因当作候选线索，同时提炼个人知识库的知识与这轮对话暴露的偏好库倾向——原因与知识属性、偏好分类之间是多对多的候选映射，不一一绑定，也可多选原因。',
        'favShowMore': '展开全文',
        'favShowLess': '收起全文',
        'favLimitsHint': (q, r, p, tools) => `采集上限：提问 ≤${q}、回复 ≤${r}、执行与思考过程 ≤${p} 估算 token，工具名 ≤${tools} 个（只记名字与顺序，不记参数与执行结果）；交付文件只记文件名。`,
        'favEmpty': '暂无收藏。在对话中点击回复下方的星标即可收藏。',
        'favCount': (n, shown) => `共 ${n} 条，显示最新 ${shown} 条`,
        'favStars': '星级',
        'favStar': '收藏这条回复',
        'favStarActive': n => `已收藏（${n} 星）`,
        'favStarN': n => `${n} 星`,
        'favPickerTitle': '收藏这条回复',
        'favPickerHint': '星级表示该轮对话对您个人知识库的重要性，影响解析优先级。',
        'favReasonHint': '可多选。原因只说明“我为什么留这条”，解析时据此给出候选的知识属性与偏好分类；过程类原因会连同思考与工具调用顺序一起解析。',
        'favReasonScopeProcess': '过程相关：解析时会输入思考与工具调用顺序',
        'favReasonScopeResult': '结果相关：解析时只看提问与最终输出',
        'favReasonLimit': '最多选 2 个收藏原因',
        'favReasonLimitBody': '先取消一个已选原因，再选新的。',
        'favNote': '备注（可选，最多 800 字）',
        'favNoteLabel': '备注',
        'favQuestion': '提问',
        'favReply': '回复',
        'favProcess': '执行过程',
        'favSectionInput': '输入',
        'favSectionProcess': '过程',
        'favSectionOutput': '输出',
        'favThinkingChip': '思考',
        'favThinkingExpand': '展开思考全文',
        'favThinkingCollapse': '收起思考全文',
        'favAnalyze': '解析',
        'favAnalyzeAll': '全部解析',
        'favAnalyzeAllDisabled': '没有待解析的收藏',
        'favAnalyzing': '解析中…',
        'favRetry': '重试',
        'favReanalyze': '重新解析',
        'favDirtyBadge': '内容已更新',
        'favReanalyzeReplaceHint': '重新解析将先删除旧知识记录再新建（覆盖式）',
        'favError': '解析失败：',
        'favParsed': '已解析完成',
        'favParsedAt': '解析于',
        'favSave': '收藏',
        'favUpdate': '更新收藏',
        'favSaving': '保存中…',
        'favRemove': '移除收藏',
        'favEdit': '编辑',
        'favCancel': '取消',
        'favRemoved': '已移除收藏',
        'favSnapshotEmpty': '（内容不可用）',
        'favSession': '会话',
        'favTurnN': n => `第${n}轮`,
        'favSavedAt': '收藏于',
        'favExpand': '展开',
        'favCollapse': '收起',
        'favExpandAll': '全部展开',
        'favCollapseAll': '全部收起',
        'favStatusPending': '待解析',
        'favStatusAnalyzing': '解析中',
        'favStatusAnalyzed': '已解析',
        'favStatusFailed': '解析失败',
        'favStatusSkipped': '已跳过',
        'favReasons': ['instruction', 'expression', 'output', 'recurring', 'process', 'correction', 'preference', 'spark'],
        'favReasonInstruction': '指令遵循',
        'favReasonExpression': '表达方式',
        'favReasonOutput': '结果输出',
        'favReasonRecurring': '高频场景',
        'favReasonProcess': '过程决策',
        'favReasonCorrection': '避坑纠错',
        'favReasonPreference': '偏好线索',
        'favReasonSpark': '灵光一现',
        'colTitle': '外部收藏夹导入',
        'colEmpty': '还没有导入过收藏夹。',
        'colCount': n => `共 ${n} 个收藏夹`,
        'colParseLink': '导入',
        'colParsingLink': '导入中…',
        'colLinkEmpty': '请先粘贴收藏夹链接',
        'colLinkError': '解析失败：',
        'colBiliTag': '链接导入',
        'colBiliLinkPlaceholder': '收藏夹链接',
        'colBiliCookiePlaceholder': '私有收藏夹 Cookie（可选）',
        'colBiliHint': '公开收藏夹直接导入；私有填 Cookie。',
        'colZhihuTitle': '知乎',
        'colZhihuTag': '书签提取',
        'colZhihuOpenMine': '我的收藏夹',
        'colZhihuBookmark': '知乎提取书签',
        'colZhihuDragHint': '拖到书签栏；在知乎收藏夹页点击。',
        'colZhihuCopyScript': '复制脚本',
        'colZhihuScriptCopied': '脚本已复制，去知乎 Console 运行。',
        'colZhihuCopyFailed': '复制失败，请手动复制。',
        'colZhihuImportClipboard': '从剪贴板导入',
        'colZhihuShowPaste': '手动粘贴',
        'colZhihuHidePaste': '收起',
        'colZhihuPastePlaceholder': '粘贴书签提取出的 JSON',
        'colZhihuImportPaste': '导入',
        'colZhihuImporting': '导入中…',
        'colZhihuHint': '在收藏夹页点书签，再回来导入。',
        'colZhihuEmpty': '剪贴板里没有知乎提取结果。',
        'colZhihuBadJson': '不是知乎提取结果。',
        'colZhihuNeedLink': '缺少收藏夹来源链接。',
        'colZhihuImportError': '导入失败：',
        'colZhihuImported': (folder, n) => `已导入「${folder}」：${n} 条`,
        'colPlatformQQMusic': 'QQ音乐',
        'colSourceBilibili': 'B站收藏夹',
        'colSourceZhihu': '知乎收藏夹',
        'colSourceQQMusic': 'QQ 音乐歌单',
        'colSourceXiaohongshu': '小红书专辑',
        'colSourceBrowser': '浏览器书签',
        'colBrowserTag': 'HTML 导入',
        'colBrowserBusy': '处理中…',
        'colBrowserSource': '来源',
        'colBrowserRestartRequired': '宿主仍在运行旧版插件，请重启 DSH 宿主（不是只刷新页面）后再导入浏览器收藏夹。',
        'colBrowserChoose': '选择收藏夹文件',
        'colBrowserPaste': '粘贴 HTML',
        'colBrowserHidePaste': '收起粘贴',
        'colBrowserParsePaste': '解析粘贴内容',
        'colBrowserPastePlaceholder': '粘贴浏览器导出的收藏夹 HTML（Edge/Chrome/Firefox）',
        'colBrowserHint': '在浏览器中把收藏夹导出为 .html（Edge/Chrome/Firefox 等均可），再在这里选择文件；支持自动基于书签分类导入至不同收藏夹。',
        'colBrowserBadFile': '请选择浏览器导出的 .html 收藏夹文件。',
        'colBrowserTooLarge': '文件过大（上限 4 MB）。',
        'colBrowserPreviewFailed': '解析失败：',
        'colBrowserPreviewTitle': (groups, links) => `解析到 ${groups} 个分类、${links} 条书签`,
        'colBrowserPreviewSkipped': n => `跳过 ${n} 条无效或重复链接`,
        'colBrowserSelected': (n, total) => `已选 ${n}/${total}`,
        'colBrowserSelectAll': '全选',
        'colBrowserSelectNone': '清空',
        'colBrowserSelectRequired': '请至少选择一个分类',
        'colBrowserImport': '导入所选',
        'colBrowserImporting': '导入中…',
        'colBrowserImportError': '导入失败：',
        'colBrowserImported': (folders, items) => `已导入 ${folders} 个分类、${items} 条书签`,
        'colBrowserEmpty': '文件里没有可导入的书签。',
        'colBrowserGroupCount': n => `${n} 条`,
        'colSavedAt': '收藏',
        'colBookmark': '书签',
        'colAlbum': '专辑',
        'colReleased': '发行',
        'colPublished': '发布',
        'colExpandBody': '展开正文',
        'colCollapseBody': '收起正文',
        'colQQTag': '链接导入',
        'colQQLinkPlaceholder': 'QQ 音乐歌单链接',
        'colQQLinkEmpty': '请先粘贴歌单链接',
        'colQQHint': '粘贴歌单链接即可导入。',
        'colXhsTag': '书签提取',
        'colXhsBookmark': '小红书提取书签',
        'colXhsDragHint': '拖到书签栏；在小红书专辑页点击。',
        'colXhsScriptCopied': '脚本已复制，去小红书 Console 运行。',
        'colXhsHint': '在专辑页点书签，再回来导入。',
        'colExtractBadJson': '内容不是提取结果（JSON 解析失败）。',
        'colExtractNeedLink': '缺少来源链接。',
        'colExtractImportError': '导入失败：',
        'colExtractEmpty': '剪贴板里没有可导入的提取结果。',
        'colExtractImported': (folder, n) => `已导入「${folder}」：${n} 条`,
        'colExtractPastePlaceholder': '粘贴知乎或小红书提取结果（JSON）',
        'colSong': '歌曲',
        'colNote': '笔记',
        'colLinkDone': (folder, fetched, dropped, valid) => `已导入「${folder}」：抓取 ${fetched} 条，过滤无效 ${dropped} 条，有效 ${valid} 条`,
        'colValidN': n => `有效 ${n} 条`,
        'colDroppedN': n => `已过滤无效 ${n} 条`,
        'colKnowledgeN': n => `已生成 ${n} 条知识`,
        'colPreferenceN': n => `已生成 ${n} 条偏好`,
        'colAnalyzeAll': '全部解析',
        'colAnalyzeAllDisabled': '没有待解析的收藏夹',
        'colParseFolder': '解析本收藏夹',
        'colAnalyzing': '解析中…',
        'colRetry': '重试',
        'colReanalyze': '重新解析',
        'colReanalyzeReplaceHint': '重新解析会先删除本收藏夹旧的知识与推断偏好，再重新生成',
        'colStatusPending': '待解析',
        'colStatusAnalyzing': '解析中',
        'colStatusAnalyzed': '已解析',
        'colStatusFailed': '解析失败',
        'colError': '解析失败：',
        'colParsedAt': '解析于',
        'colImportedTitle': '已导入收藏夹',
        'colImportedHint': '同一链接再次导入会原地替换。',
        'colImportedAt': '导入于',
        'colDescLabel': '简介',
        'colBodyLabel': '正文',
        'colPlays': '播放',
        'colLikes': '点赞',
        'colFavorites': '收藏',
        'colDanmaku': '弹幕',
        'colReads': '阅读',
        'colVoteups': '赞同',
        'colComments': '评论',
        'colAnswer': '回答',
        'colArticle': '文章',
        'colUrl': '打开链接',
        'colEmptyItems': '没有可展示的条目',
        'colRemoved': '已删除收藏夹',
        'colRemoveAll': '清空全部',
        'colRemoveAllConfirm': '确认清空全部？',
        'colRemovedAll': (folders, knowledge) => `已删除 ${folders} 个收藏夹与 ${knowledge} 条相关知识`,
        'colExpand': '展开',
        'colCollapse': '收起',
        'colExpandAll': '全部展开',
        'colCollapseAll': '全部收起',
        'colPlatformBilibili': 'B站',
        'colPlatformZhihu': '知乎',
        'colPlatformXiaohongshu': '小红书',
        'colPlatformBrowser': '浏览器',
        'colPlatformOther': '其他',
      },
      en: {
        'sectionTitle': 'Personal Assistant',
        'sectionDesc': 'Control in-request, time-driven, and external-signal proactivity separately, then manage wakes, preferences, and personal knowledge. Proactivity switches and task-wake fields apply immediately; routine fields apply the next time the routine is enabled.',
        'requestProactivity': 'In-request proactivity',
        'requestProactivityHint': 'After the owner asks for something, identify material dependencies, missing facts, follow-ups, and care items beyond the first visible errand.',
        'timeProactivity': 'Time-driven proactivity',
        'timeProactivityHint': 'Extract future items from the conversation, already-read sources, and personal knowledge; deduplicate tasks and schedule useful anticipatory checks.',
        'externalSourcesTitle': 'External-signal proactivity',
        'externalSourcesDesc': 'An extensible list of read-only signal subscriptions. Assistant suggestions start disabled; the owner can enable, disable, add, or remove sources. Wakes inspect only enabled sources relevant to an open task or current signal.',
        'externalSourcesEmpty': 'No external sources yet. Add one here, or let the assistant suggest disabled options during future interactions.',
        'externalSourceCount': (n, enabled) => `${n} sources, ${enabled} enabled`,
        'externalSourceKey': 'Identifier (for example mail.travel-changes)',
        'externalSourceLabel': 'Display name',
        'externalSourcePurpose': 'Useful change to detect',
        'externalSourceQuery': 'Capability search terms (for example email travel change)',
        'externalSourceAdd': 'Add and enable',
        'externalSourceOriginOwner': 'Owner requested',
        'externalSourceOriginAssistant': 'Assistant suggested',
        'externalSourceDelete': 'Delete source',
        'taskWake': 'Task due-time wake',
        'taskWakeHint': 'Automatically schedule a due-time reminder for tasks with a deadline (delivered in the session that recorded the task); it follows due-time changes and is removed on complete, cancel, or delete.',
        'lead': 'Wake lead minutes',
        'leadHint': 'How many minutes before the deadline the wake fires; 0 means on time. Range 0–1440.',
        'cron': 'Routine cron expression',
        'cronHint': 'Five-field Vixie cron for the recurring proactive check-in (used when assistant_routine is enabled).',
        'timeZone': 'Time zone',
        'timeZoneHint': 'UTC or IANA time zone for the routine schedule, for example Asia/Shanghai.',
        'title': 'Reminder card title',
        'titleHint': 'Title shown for the routine reminder in task lists.',
        'save': 'Save',
        'saving': 'Saving…',
        'saved': 'Saved',
        'saveFailed': 'Save failed',
        'reset': 'Reset',
        'overridden': 'Overridden',
        'loading': 'Loading settings…',
        'loadFailed': 'The settings panel is unavailable (the host runs without a webserver, or the plugin is not loaded).',
        'retry': 'Retry',
        'refreshFailed': 'Refresh failed; try again later.',
        'badCron': 'cron must be a five-field expression',
        'badLead': 'Lead minutes must be an integer from 0 through 1440',
        'wakeTitle': 'Wake & routine',
        'wakeListTitle': 'Wake inventory',
        'wakeListDesc': 'Due-time wakes and the routine the assistant has scheduled (read live from the host scheduler). Wakes are removed automatically when their task completes, is cancelled, or is deleted; turning the task wake off clears recorded wakes on the next task operation.',
        'wakeEmpty': 'No wakes scheduled.',
        'wakeUnavailable': 'The host runs without a scheduler service; the wake inventory is unavailable.',
        'wakeRefresh': 'Refresh',
        'wakeFilterAll': 'All',
        'wakeFilterActive': 'Active',
        'wakeKindTask': 'Task due',
        'wakeKindRoutine': 'Routine',
        'wakeStatusArmed': 'Armed',
        'wakeStatusOff': 'Not armed',
        'wakeStatusGone': 'Missing',
        'wakeStatusInactive': 'Finished',
        'wakeTaskCompleted': 'Task completed',
        'wakeTaskCancelled': 'Task cancelled',
        'wakeNext': 'Next fire',
        'wakeLast': 'Last fired',
        'wakeDue': 'Due',
        'wakeSession': 'Session',
        'prefTitle': 'Preference library',
        'prefDesc': 'Stable and situational preferences the assistant remembers. Categories are led by the eight core domains (travel, food, schedule, communication, work, health, finance, clothing); sports, arts & entertainment, learning, and shopping are used only when needed, and everything else falls under other. Additions and removals here go through the same path as assistant_preference in conversations and apply to subsequent turns immediately; preferences inferred from imported folders carry a collection source and lower confidence, and never overwrite ones you saved yourself.',
        'prefEmpty': 'No preferences recorded yet.',
        'prefCount': (n, shown) => `${n} records, newest ${shown} shown`,
        'prefAdd': 'Add preference',
        'prefKey': 'Key (for example food.coffee)',
        'prefSituation': 'Situation (optional, for example on business trips)',
        'prefValue': 'Content',
        'prefCategory': 'Category',
        'prefCategoryCore': 'Core categories',
        'prefCategorySecondary': 'Secondary categories (as needed)',
        'prefCategoryOtherGroup': 'Other',
        'prefAddBtn': 'Add',
        'saveEdit': 'Save changes',
        'prefAdding': 'Adding…',
        'delete': 'Delete',
        'confirmDelete': 'Confirm delete',
        'deleted': 'Deleted',
        'badPrefKey': 'A preference key is required',
        'badPrefValue': 'Preference content is required',
        'situational': 'Situational',
        'categories': ['travel', 'food', 'schedule', 'communication', 'work', 'health', 'finance', 'clothing', 'sports', 'media', 'learning', 'shopping', 'other'],
        'prefFilterAll': 'All',
        'prefFilterStable': 'Stable',
        'prefFilterSituational': 'Situational',
        'prefStatTotal': 'Preferences',
        'prefStatDomains': 'Categories',
        'prefStatSituational': 'Situational',
        'prefStatConfidence': 'Avg. confidence',
        'prefFilterEmpty': 'No preferences in this filter.',
        'prefCollapse': 'Collapse',
        'prefExpand': 'Expand',
        'listFilterEmpty': 'No items in this filter.',
        'favStatTotal': 'Favorites',
        'favStatParsed': 'Parsed',
        'favStatPending': 'Pending',
        'favStatStars': 'Avg. stars',
        'favParsedCounts': (k, p) => `${k} knowledge · ${p} preferences`,
        'knowledgeStatTotal': 'Records',
        'knowledgeStatKinds': 'Attributes',
        'knowledgeStatGenres': 'Genres',
        'knowledgeStatSources': 'Sources',
        'knowledgeStatConfidence': 'Avg. confidence',
        'knowledgeSortBy': 'Sort',
        'knowledgeGenreFilter': 'Genre',
        'kindScopes': {
          entity: 'People / projects / places / orgs',
          relation: 'Owner / contact / dependency',
          artifact: 'Files / links / checklists / outputs',
          event: 'Time / place / experience',
          observation: 'Phenomena / habits / evidence',
          state: 'Phase / condition / constraint',
          goal: 'Goal / progress / deadline',
          decision: 'Choice / reasons / alternatives',
          commitment: 'Promise / delivery / due',
          pattern: 'Method / experience / preconditions',
          rule: 'Constraint / policy / hard limits',
          hypothesis: 'Guess / unverified / low confidence',
        },
        'knowledgeAttributePrefix': 'Attribute',
        'knowledgeTypePrefix': 'Data type',
        'knowledgeSortKind': 'By attribute',
        'knowledgeSortGenre': 'By genre',
        'knowledgeSortRecent': 'Recent',
        'knowledgeUncategorized': 'Uncategorized',
        'prefStable': 'Stable',
        'prefSituational': 'Situational',
        'prefConfidence': 'Confidence',
        'prefSourceCollection': 'Folder inference',
        'prefSourcePanel': 'Added manually',
        'prefSourceOwner': 'Confirmed in chat',
        'prefFormAdd': 'Add a preference',
        'prefFormEdit': 'Edit this preference',
        'prefKeyLabel': 'Preference key',
        'prefSituationLabel': 'Situation (optional)',
        'prefValueLabel': 'Content',
        'prefCategoryMeta': {
          travel: { label: 'Travel', tier: 'core', scope: 'Transport / lodging / itineraries / destinations', boundary: 'Food and fun while travelling go to travel; lasting taste goes to food.' },
          food: { label: 'Food', tier: 'core', scope: 'Taste / ingredients / cuisines / cooking / restaurants', boundary: 'Lasting taste goes to food; food and fun while travelling go to travel.' },
          schedule: { label: 'Schedule', tier: 'core', scope: 'Sleep / waking / focus blocks / daily rhythm', boundary: 'Daily rhythm and focus blocks go to schedule; working methods go to work.' },
          communication: { label: 'Communication', tier: 'core', scope: 'Expression / reporting / feedback / channels', boundary: 'Expression and reporting go to communication; work outputs go to work.' },
          work: { label: 'Work', tier: 'core', scope: 'Working methods / collaboration / projects / career growth', boundary: 'Methods, projects, outputs and career growth go to work; courses and research go to learning.' },
          health: { label: 'Health', tier: 'core', scope: 'Body & mind / recovery / medical / health goals', boundary: 'Health goals and recovery go to health; training and events go to sports.' },
          finance: { label: 'Finance', tier: 'core', scope: 'Income & spending / budgets / investing / insurance', boundary: 'Budgets and investing go to finance; concrete purchases go to shopping.' },
          clothing: { label: 'Clothing', tier: 'core', scope: 'Style / fit / sizing / outfits', boundary: 'Style, fit and sizing go to clothing; comparing prices goes to shopping.' },
          sports: { label: 'Sports', tier: 'secondary', scope: 'Training / events / gear / outdoors / fitness, including watching sports (F1, figure skating, cycling races)', boundary: 'Training, events, gear and watching sports go to sports, not media; casual reading goes to media.' },
          media: { label: 'Media', tier: 'secondary', scope: 'Film & TV / music / games / anime / reading / shows / exhibitions / art / design / crafts / photography', boundary: 'Film, music, games and casual reading go to media; reading for study goes to learning.' },
          learning: { label: 'Learning', tier: 'secondary', scope: 'Courses / subjects / exams / languages / research / learning resources', boundary: 'Courses, exams, languages and research go to learning; applying them at work goes to work.' },
          shopping: { label: 'Shopping', tier: 'secondary', scope: 'Buying criteria / price comparison / channels / brands & models / purchase decisions', boundary: 'Concrete purchases, comparisons and brands go to shopping; budgets go to finance.' },
          other: { label: 'Other', tier: 'other', scope: 'Tech / engineering / home and other hard-to-classify areas', boundary: 'Only what truly fits none of the first 12; legacy career maps to work, arts to media.' },
        },
        'knowledgeTitle': 'Personal knowledge',
        'knowledgeDescIntro': 'Personal knowledge with provenance, time, and confidence.',
        'knowledgeDescAttribute': '**Attribute (kind)** applies to **system management**: what kind of knowledge this is, used for retrieval, lifecycle, and RAG.',
        'knowledgeDescType': '**Type (genre)** applies to **user organization**: what form it takes and what it is used for, so it can be grouped by purpose.',
        'knowledgeDescView': 'The list groups by attribute by default; type appears as a clickable tag and facet.',
        'knowledgeDescNote': 'Preferences, tasks, and workflows remain in their own tools; sensitive records are not shown here.',
        'knowledgeEmpty': 'No knowledge recorded yet.',
        'knowledgeCount': (n, shown) => `${n} records, latest ${shown} shown`,
        'knowledgeSearch': 'Search titles, content, or tags',
        'knowledgeKind': 'Kind',
        'knowledgeBasis': 'Basis',
        'knowledgeTitleInput': 'Title',
        'knowledgeContent': 'Content',
        'knowledgeTags': 'Tags (comma-separated)',
        'knowledgeAdd': 'Add knowledge',
        'knowledgeExpand': 'Expand',
        'knowledgeCollapse': 'Collapse',
        'knowledgeExpandAll': 'Expand all',
        'knowledgeCollapseAll': 'Collapse all',
        'knowledgeOccurred': 'Occurred',
        'knowledgeDomain': 'Domain',
        'knowledgeScene': 'Scene',
        'knowledgeSource': 'Source',
        'knowledgeUpdated': 'Updated',
        'knowledgeParsedUpdated': 'Parsed/updated',
        'knowledgeSourceOwner': 'Owner',
        'knowledgeSourceCollection': 'Collection parse',
        'knowledgeSourceCollectionNamed': name => `Collection “${name}”`,
        'knowledgeSourceFavorite': 'Conversation favorite parse',
        'knowledgeArchive': 'Archive',
        'knowledgeArchived': 'Archived',
        'knowledgeBadTitle': 'A knowledge title is required',
        'knowledgeBadContent': 'Knowledge content is required',
        'knowledgeKinds': ['entity', 'event', 'state', 'observation', 'pattern', 'goal', 'decision', 'commitment', 'artifact', 'relation', 'rule', 'hypothesis'],
        'kindEntity': 'Entity',
        'kindEvent': 'Event',
        'kindState': 'State',
        'kindObservation': 'Observation',
        'kindPattern': 'Pattern',
        'kindGoal': 'Goal',
        'kindDecision': 'Decision',
        'kindCommitment': 'Commitment',
        'kindArtifact': 'Artifact',
        'kindRelation': 'Relation',
        'kindRule': 'Rule',
        'kindHypothesis': 'Hypothesis',
        'kindHelpEntity': 'A stable fact about a thing, person, place, or organization. Use: identify who or what a record is about. E.g. Lin Lan is the contact for project Apollo.',
        'kindHelpEvent': 'One thing that happened at a time and place. Use: keep dated personal experience as evidence of how it went last time. E.g. attended a project review in Nanjing last time.',
        'kindHelpState': 'A condition that holds for a period and can change. Use: know the current phase and constraints; when it changes, mark the old record stale and link a new one. E.g. this week is the project acceptance phase.',
        'kindHelpObservation': 'A noticed phenomenon or behavioral pattern. Use: keep behavioral evidence for later analysis; it is not a conclusion or preference by itself. E.g. left the last three long meetings early.',
        'kindHelpPattern': 'A reusable approach or heuristic, not mandatory. Use: keep evidence-backed experience; verify the concrete procedure before replaying it. E.g. on late trips, compare transfer time first.',
        'kindHelpGoal': 'A desired outcome, with optional progress and deadline. Use: judge whether a plan serves the current goal. E.g. finish Apollo acceptance this quarter.',
        'kindHelpDecision': 'A choice already made, with reasons or alternatives. Use: keep the reasoning so similar conditions can reuse it. E.g. took the high-speed rail because door-to-door was faster.',
        'kindHelpCommitment': 'Something promised to someone or yourself. Use: keep the promise itself; deadline and follow-up belong to tasks. E.g. promised the client a revised draft by Friday.',
        'kindHelpArtifact': 'A file, work, link, or checklist that was produced. Use: find existing deliverables and references instead of redoing them. E.g. where last project report was saved.',
        'kindHelpRelation': 'A connection between two objects or records. Use: know who to talk to and who owns which part. E.g. Lin Lan handles requirement sign-off for the project.',
        'kindHelpRule': 'A constraint, policy, or standard that must be followed. Use: keep external rules and their scope; check before acting outside it. E.g. the client campus requires visitors to register a day ahead.',
        'kindHelpHypothesis': 'A guess awaiting verification; confidence should stay below 1. Use: keep an unconfirmed inference, never a settled preference or fact. E.g. the owner may prefer shorter meetings.',
        'kindFamilyFacts': 'Facts & history',
        'kindFamilyMethods': 'Methods & rules',
        'kindFamilyIntent': 'Intent & action',
        'kindFamilyAssets': 'Artifacts, relations & hypotheses',
        'knowledgeBases': ['stated', 'observed', 'inferred', 'imported'],
        'favTitle': 'Conversation favorites',
        'favDesc': 'Saved conversations (question, execution process, and reply) with ratings, save reasons, and notes. The star rating marks how important this exchange is to your personal knowledge base: it drives parse order and becomes the knowledge priority. Parsing treats the save reasons as candidate hints and distills both personal knowledge and any owner preference the exchange revealed — reasons map many-to-many onto knowledge attributes and preference categories, and several reasons may be selected.',
        'favShowMore': 'Show full text',
        'favShowLess': 'Collapse text',
        'favLimitsHint': (q, r, p, tools) => `Capture limits: question ≤${q}, reply ≤${r}, execution and thinking ≤${p} estimated tokens, and ≤${tools} tool names (names and order only — never arguments or results); delivered files are recorded by file name only.`,
        'favEmpty': 'No favorites yet. Click the star below a reply to save it.',
        'favCount': (n, shown) => `${n} saved, latest ${shown} shown`,
        'favStars': 'Rating',
        'favStar': 'Favorite this reply',
        'favStarActive': n => `Favorited (${n} stars)`,
        'favStarN': n => `${n} stars`,
        'favPickerTitle': 'Favorite this reply',
        'favPickerHint': 'The rating marks how important this exchange is to your personal knowledge base and raises its parse priority.',
        'favReasonHint': 'Pick one or more. A reason only says why you saved this exchange; parsing uses it as a hint for the knowledge attribute and preference category. Process reasons include the thinking and tool order when parsing.',
        'favReasonScopeProcess': 'Process-focused: the thinking and tool order are included when parsing',
        'favReasonScopeResult': 'Result-focused: only the question and final output are parsed',
        'favReasonLimit': 'Pick at most 2 save reasons',
        'favReasonLimitBody': 'Clear one selected reason first.',
        'favNote': 'Note (optional, up to 800 characters)',
        'favNoteLabel': 'Note',
        'favQuestion': 'Question',
        'favReply': 'Reply',
        'favProcess': 'Process',
        'favSectionInput': 'Input',
        'favSectionProcess': 'Process',
        'favSectionOutput': 'Output',
        'favThinkingChip': 'thinking',
        'favThinkingExpand': 'Show full thinking',
        'favThinkingCollapse': 'Collapse thinking',
        'favAnalyze': 'Parse',
        'favAnalyzeAll': 'Parse all',
        'favAnalyzeAllDisabled': 'Nothing left to parse',
        'favAnalyzing': 'Parsing…',
        'favRetry': 'Retry',
        'favReanalyze': 'Re-parse',
        'favDirtyBadge': 'Content updated',
        'favReanalyzeReplaceHint': 'Re-parse deletes the previous knowledge record first, then creates a new one',
        'favError': 'Parse failed: ',
        'favParsed': 'Parse complete',
        'favParsedAt': 'Parsed',
        'favSave': 'Save',
        'favUpdate': 'Update favorite',
        'favSaving': 'Saving…',
        'favRemove': 'Remove favorite',
        'favEdit': 'Edit',
        'favCancel': 'Cancel',
        'favRemoved': 'Favorite removed',
        'favSnapshotEmpty': '(content unavailable)',
        'favSession': 'Session',
        'favTurnN': n => `Turn ${n}`,
        'favSavedAt': 'Saved',
        'favExpand': 'Expand',
        'favCollapse': 'Collapse',
        'favExpandAll': 'Expand all',
        'favCollapseAll': 'Collapse all',
        'favStatusPending': 'Pending',
        'favStatusAnalyzing': 'Analyzing',
        'favStatusAnalyzed': 'Analyzed',
        'favStatusFailed': 'Failed',
        'favStatusSkipped': 'Skipped',
        'favReasons': ['instruction', 'expression', 'output', 'recurring', 'process', 'correction', 'preference', 'spark'],
        'favReasonInstruction': 'Instruction followed',
        'favReasonExpression': 'Wording',
        'favReasonOutput': 'Output',
        'favReasonRecurring': 'Recurring scene',
        'favReasonProcess': 'Process & decision',
        'favReasonCorrection': 'Pitfall & correction',
        'favReasonPreference': 'Preference clue',
        'favReasonSpark': 'Spark',
        'colTitle': 'Import external collections',
        'colEmpty': 'No imported collections yet.',
        'colCount': n => `${n} folders`,
        'colParseLink': 'Import',
        'colParsingLink': 'Importing…',
        'colLinkEmpty': 'Paste a folder link first',
        'colLinkError': 'Parse failed: ',
        'colBiliTag': 'Link import',
        'colBiliLinkPlaceholder': 'Folder link',
        'colBiliCookiePlaceholder': 'Private-folder Cookie (optional)',
        'colBiliHint': 'Public folders import directly; add a Cookie for private ones.',
        'colZhihuTitle': 'Zhihu',
        'colZhihuTag': 'Bookmark',
        'colZhihuOpenMine': 'My collections',
        'colZhihuBookmark': 'Zhihu bookmark',
        'colZhihuDragHint': 'Drag to the bookmarks bar; click it on a Zhihu collection page.',
        'colZhihuCopyScript': 'Copy script',
        'colZhihuScriptCopied': 'Script copied; run it in the Zhihu console.',
        'colZhihuCopyFailed': 'Copy failed; copy it manually.',
        'colZhihuImportClipboard': 'Import from clipboard',
        'colZhihuShowPaste': 'Paste',
        'colZhihuHidePaste': 'Hide',
        'colZhihuPastePlaceholder': 'Paste the JSON produced by the bookmark',
        'colZhihuImportPaste': 'Import',
        'colZhihuImporting': 'Importing…',
        'colZhihuHint': 'Click the bookmark on a collection page, then import here.',
        'colZhihuEmpty': 'No Zhihu extractor result in the clipboard.',
        'colZhihuBadJson': 'Not a Zhihu extractor result.',
        'colZhihuNeedLink': 'Missing the source collection link.',
        'colZhihuImportError': 'Import failed: ',
        'colZhihuImported': (folder, n) => `Imported "${folder}": ${n} items`,
        'colPlatformQQMusic': 'QQ Music',
        'colSourceBilibili': 'Bilibili folder',
        'colSourceZhihu': 'Zhihu folder',
        'colSourceQQMusic': 'QQ Music playlist',
        'colSourceXiaohongshu': 'Xiaohongshu board',
        'colSourceBrowser': 'Browser bookmarks',
        'colBrowserTag': 'HTML import',
        'colBrowserBusy': 'Working…',
        'colBrowserSource': 'Source',
        'colBrowserRestartRequired': 'The host is still running the previous plugin build; restart the DSH host (not just the page) to import browser bookmarks.',
        'colBrowserChoose': 'Choose bookmarks file',
        'colBrowserPaste': 'Paste HTML',
        'colBrowserHidePaste': 'Hide paste',
        'colBrowserParsePaste': 'Parse pasted HTML',
        'colBrowserPastePlaceholder': 'Paste a browser bookmark export (Edge/Chrome/Firefox HTML)',
        'colBrowserHint': 'Export bookmarks as .html from your browser (Edge, Chrome, Firefox, and others), then choose the file here; bookmarks are imported into separate collections automatically based on their bookmark categories.',
        'colBrowserBadFile': 'Choose a .html bookmark file exported by a browser.',
        'colBrowserTooLarge': 'File is too large (4 MB max).',
        'colBrowserPreviewFailed': 'Parse failed: ',
        'colBrowserPreviewTitle': (groups, links) => `Found ${groups} categories and ${links} bookmarks`,
        'colBrowserPreviewSkipped': n => `${n} invalid or duplicate links skipped`,
        'colBrowserSelected': (n, total) => `${n}/${total} selected`,
        'colBrowserSelectAll': 'Select all',
        'colBrowserSelectNone': 'Clear',
        'colBrowserSelectRequired': 'Select at least one category',
        'colBrowserImport': 'Import selected',
        'colBrowserImporting': 'Importing…',
        'colBrowserImportError': 'Import failed: ',
        'colBrowserImported': (folders, items) => `Imported ${folders} categories and ${items} bookmarks`,
        'colBrowserEmpty': 'No importable bookmarks in this file.',
        'colBrowserGroupCount': n => `${n} links`,
        'colSavedAt': 'Saved',
        'colBookmark': 'Bookmark',
        'colAlbum': 'Album',
        'colReleased': 'Released',
        'colPublished': 'Published',
        'colExpandBody': 'Show full body',
        'colCollapseBody': 'Collapse body',
        'colQQTag': 'Link import',
        'colQQLinkPlaceholder': 'QQ Music playlist link',
        'colQQLinkEmpty': 'Paste a playlist link first',
        'colQQHint': 'Paste a playlist link to import it.',
        'colXhsTag': 'Bookmark',
        'colXhsBookmark': 'Xiaohongshu bookmark',
        'colXhsDragHint': 'Drag to the bookmarks bar; click it on a Xiaohongshu board page.',
        'colXhsScriptCopied': 'Script copied; run it in the Xiaohongshu console.',
        'colXhsHint': 'Click the bookmark on a board page, then import here.',
        'colExtractBadJson': 'Not an extractor result (JSON parse failed).',
        'colExtractNeedLink': 'Missing the source link.',
        'colExtractImportError': 'Import failed: ',
        'colExtractEmpty': 'No extractor result in the clipboard.',
        'colExtractImported': (folder, n) => `Imported "${folder}": ${n} items`,
        'colExtractPastePlaceholder': 'Paste a Zhihu or Xiaohongshu extractor result (JSON)',
        'colSong': 'Song',
        'colNote': 'Note',
        'colLinkDone': (folder, fetched, dropped, valid) => `Imported "${folder}": fetched ${fetched}, filtered ${dropped}, ${valid} valid`,
        'colValidN': n => `${n} valid`,
        'colDroppedN': n => `${n} invalid filtered`,
        'colKnowledgeN': n => `${n} knowledge records`,
        'colPreferenceN': n => `${n} preferences`,
        'colAnalyzeAll': 'Analyze all',
        'colAnalyzeAllDisabled': 'No folders to analyze',
        'colParseFolder': 'Analyze folder',
        'colAnalyzing': 'Analyzing…',
        'colRetry': 'Retry',
        'colReanalyze': 'Re-analyze',
        'colReanalyzeReplaceHint': 'Re-analyze replaces this folder\'s previous knowledge and inferred preferences',
        'colStatusPending': 'Pending',
        'colStatusAnalyzing': 'Analyzing',
        'colStatusAnalyzed': 'Analyzed',
        'colStatusFailed': 'Failed',
        'colError': 'Analysis failed: ',
        'colParsedAt': 'Parsed',
        'colImportedTitle': 'Imported collections',
        'colImportedHint': 'Re-importing the same link replaces it in place.',
        'colImportedAt': 'Imported',
        'colDescLabel': 'Description',
        'colBodyLabel': 'Body',
        'colPlays': 'Plays',
        'colLikes': 'Likes',
        'colFavorites': 'Favorites',
        'colDanmaku': 'Danmaku',
        'colReads': 'Reads',
        'colVoteups': 'Upvotes',
        'colComments': 'Comments',
        'colAnswer': 'Answer',
        'colArticle': 'Article',
        'colUrl': 'Open link',
        'colEmptyItems': 'No items to show',
        'colRemoved': 'Folder removed',
        'colRemoveAll': 'Clear all',
        'colRemoveAllConfirm': 'Confirm clear all?',
        'colRemovedAll': (folders, knowledge) => `Removed ${folders} folders and ${knowledge} knowledge records`,
        'colExpand': 'Expand',
        'colCollapse': 'Collapse',
        'colExpandAll': 'Expand all',
        'colCollapseAll': 'Collapse all',
        'colPlatformBilibili': 'Bilibili',
        'colPlatformZhihu': 'Zhihu',
        'colPlatformXiaohongshu': 'Xiaohongshu',
        'colPlatformBrowser': 'Browser',
        'colPlatformOther': 'Other',
      },
    }

    let localeService = null
    /** 采集纯函数测试面：apply() 执行后填充，仅供 node 测试读取。 */
    let captureInternals = null

    function normalizeLocale(tag) {
      if (typeof tag !== 'string') return null
      const primary = tag.trim().toLowerCase().replace(/_/g, '-').split('-')[0]
      return primary === 'zh' || primary === 'en' ? primary : null
    }

    function currentLocale() {
      let tag = null
      if (localeService && typeof localeService.getLocale === 'function') {
        try { tag = localeService.getLocale() } catch { tag = null }
      }
      const fromService = normalizeLocale(tag)
      if (fromService) return fromService
      if (typeof navigator !== 'undefined') {
        for (const candidate of [navigator.language, ...(navigator.languages || [])]) {
          const hit = normalizeLocale(candidate)
          if (hit) return hit
        }
      }
      return 'zh'
    }

    function t(key, ...args) {
      const locale = currentLocale()
      const hit = DICTS[locale]?.[key]
      const resolved = typeof hit === 'function' ? hit(...args) : hit
      if (resolved !== undefined) return resolved
      const fallback = DICTS.en[key]
      if (typeof fallback === 'function') return fallback(...args)
      return fallback !== undefined ? fallback : key
    }

    function softService(ctx, name) {
      if (typeof ctx?.get === 'function') return ctx.get(name)
      return undefined
    }

    async function fetchPanelState() {
      const response = await fetch(STATE_URL, { cache: 'no-store' })
      const body = await response.json().catch(() => null)
      if (!response.ok || body === null || typeof body.code === 'string') {
        throw new Error(body?.message ?? `HTTP ${response.status}`)
      }
      return body
    }

    async function postPanelAction(action) {
      const response = await fetch(ACTION_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(action),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok || body === null || typeof body.code === 'string') {
        throw new Error(body?.message ?? `HTTP ${response.status}`)
      }
      return body
    }

    const FIELDS = [
      { key: 'requestProactivity', kind: 'boolean', labelKey: 'requestProactivity', hintKey: 'requestProactivityHint' },
      { key: 'timeProactivity', kind: 'boolean', labelKey: 'timeProactivity', hintKey: 'timeProactivityHint' },
      { key: 'taskWake', kind: 'boolean', labelKey: 'taskWake', hintKey: 'taskWakeHint' },
      { key: 'taskWakeLeadMinutes', kind: 'number', labelKey: 'lead', hintKey: 'leadHint' },
      { key: 'cron', kind: 'text', labelKey: 'cron', hintKey: 'cronHint' },
      { key: 'timeZone', kind: 'text', labelKey: 'timeZone', hintKey: 'timeZoneHint' },
      { key: 'title', kind: 'text', labelKey: 'title', hintKey: 'titleHint' },
    ]

    const CSS = `
/* 对比度分层：caption 级次要色抬到 tertiary（可读中性灰），secondary 抬到
   primary-dimmed（标题/键名），但保留层级——纯黑留给 primary 文本本身；
   可点击项一律做成描边+浅底的按钮形态，不再依赖下划线。 */
.pa-settings,.pa-fav-toggle,.pa-fav-pop{
  --dsw-alias-label-caption:var(--dsw-alias-label-tertiary);
  --dsw-alias-label-secondary:var(--dsw-alias-label-primary-dimmed)
}
.pa-settings{color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:12px;max-width:760px;padding:4px 0}
.pa-settings-desc{color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.6;margin:8px 2px 14px}
.pa-knowledge-desc{color:var(--dsw-alias-label-caption);display:flex;flex-direction:column;font-size:12px;gap:5px;line-height:1.6;margin:8px 2px 14px}
.pa-knowledge-desc p{margin:0}
.pa-knowledge-desc strong{color:var(--dsw-alias-label-secondary);font-weight:600}
.pa-knowledge-desc-note{color:var(--dsw-alias-label-caption)}
.pa-settings-card{background:var(--dsw-alias-settings-card-fill,#fff);border:none;border-radius:28px;box-shadow:0 0 0 .5px var(--dsw-alias-settings-card-stroke,#00000029),0 3px 8px rgba(0,0,0,.04),0 0 20px rgba(0,0,0,.05);display:flex;flex-direction:column}
.pa-field{border-bottom:1px solid var(--dsw-alias-border-l3);display:flex;flex-direction:column;gap:6px;padding:16px 20px}
.pa-field:last-child{border-bottom:none}
.pa-field-head{align-items:center;display:flex;gap:8px}
.pa-col-header{margin-bottom:12px}
.pa-col-imported-head{align-items:baseline;display:flex;flex-wrap:wrap;gap:8px;margin:18px 4px 8px}
.pa-field-label{color:var(--dsw-alias-label-secondary);font-size:14px;font-weight:400}
.pa-field-badge{align-items:center;background:var(--dsw-alias-interactive-bg-hover,#2631480f);border-radius:999px;color:var(--dsw-alias-label-caption);display:inline-flex;font-size:12px;line-height:18px;padding:1px 10px}
.pa-field-reset{background:var(--dsw-alias-interactive-bg-hover,#2631480f);border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm,8px);color:var(--dsw-alias-label-caption);cursor:pointer;font-size:12px;line-height:16px;margin-left:auto;padding:3px 10px}
.pa-field-reset:hover{background:var(--dsw-alias-interactive-bg-active,#2631481a);color:var(--dsw-alias-label-primary)}
.pa-field-reset:disabled{cursor:default;opacity:.45}
.pa-field-hint{color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.5}
.pa-field-input{background:var(--dsw-alias-settings-card-fill,#fff);border:1px solid var(--dsw-alias-border-l3);border-radius:10px;color:inherit;font-size:13px;padding:5px 10px;width:min(360px,100%)}
.pa-switch{align-items:center;background:var(--dsw-alias-interactive-bg-active,#2631481a);border:none;border-radius:999px;cursor:pointer;display:inline-flex;height:20px;padding:2px;transition:background .15s;width:36px}
.pa-switch[aria-checked="true"]{background:var(--dsw-alias-button-primary-fill,#0f1115)}
.pa-switch:disabled{cursor:default;opacity:.5}
.pa-switch-thumb{background:var(--dsw-alias-switch-thumb,#fff);border-radius:50%;height:16px;width:16px;transition:transform .12s}
.pa-switch[aria-checked="true"] .pa-switch-thumb{transform:translateX(16px)}
.pa-settings-actions{align-items:center;display:flex;gap:10px}
.pa-settings-save{background:var(--dsw-alias-button-primary-fill,#0f1115);border:none;border-radius:16px;color:var(--dsw-alias-bg-layer-2,#fff);cursor:pointer;font-size:13px;height:32px;padding:0 12px}
.pa-settings-save:disabled{cursor:default;opacity:.5}
.pa-settings-note{color:var(--dsw-alias-label-secondary);font-size:13px}
.pa-settings-ok{color:var(--dsw-alias-label-secondary);font-size:12px}
.pa-settings-error{color:#e5484d;font-size:12px}
.pa-subtitle{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.2;margin:0}
.pa-pref-row{border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l3) 55%,transparent);display:flex;flex-direction:column;gap:4px;padding:14px 20px}
.pa-pref-row:last-child{border-bottom:none}
.pa-pref-head{align-items:center;display:flex;gap:8px}
.pa-pref-key{color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:600}
.pa-pref-value{color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
/* 知识正文按「解析侧重」分段：分段名做成小标签，让执行步骤/取舍等与所选收藏原因相关的部分跳出来。 */
.pa-kn-line{white-space:pre-wrap}
.pa-kn-line--seg{align-items:flex-start;display:flex;gap:6px;margin:3px 0;white-space:normal}
.pa-kn-seg{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#f5a623) 16%,transparent);border-radius:6px;color:var(--dsw-alias-label-primary);flex:none;font-size:11px;font-weight:600;line-height:18px;padding:0 6px}
.pa-kn-seg-text{flex:1;min-width:0;white-space:pre-wrap}
.pa-pref-meta{color:var(--dsw-alias-label-caption);font-size:12px}
/* 操作按钮配色：按语义上色，而不是统一灰字。
   --pa-deep 为 DSH 深蓝（deepseek-700 一档），--pa-deep-fill 为深蓝底，实心底一律白字。 */
.pa-settings{--pa-deep:#2f4c8f;--pa-deep-fill:#283142;--pa-ink:#f7f9fc;--pa-green:#1f9d55;--pa-red:#e5484d}
.pa-pref-act{background:transparent;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm,8px);cursor:pointer;font-size:12px;line-height:16px;padding:3px 10px;transition:background-color 120ms ease,color 120ms ease,border-color 120ms ease}
.pa-pref-act:disabled{cursor:default;opacity:.45}
.pa-pref-act--edit{color:var(--pa-green);border-color:color-mix(in srgb,var(--pa-green) 45%,transparent)}
.pa-pref-act--edit:hover:not(:disabled){background:color-mix(in srgb,var(--pa-green) 14%,transparent);color:var(--pa-green)}
.pa-pref-act--archive{color:var(--dsw-alias-label-secondary)}
.pa-pref-act--archive:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active,#2631481a)}
.pa-pref-act--cancel{color:var(--dsw-alias-label-secondary)}
.pa-pref-act--cancel:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-active,#2631481a)}
/* 删除：默认红字，鼠标停留转为红底白字。 */
.pa-pref-act--delete{color:var(--pa-red);border-color:color-mix(in srgb,var(--pa-red) 40%,transparent);margin-left:auto}
.pa-pref-act--delete:hover:not(:disabled){background:var(--pa-red);border-color:var(--pa-red);color:#fff}
.pa-pref-act--delete-armed{background:var(--pa-red);border-color:var(--pa-red);color:#fff}
.pa-pref-form{border-top:1px solid var(--dsw-alias-border-l3);display:flex;flex-direction:column;gap:6px;padding:14px 20px}
.pa-pref-form-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.pa-knowledge-kind-select{flex:0 0 132px;width:132px}
.pa-knowledge-basis-select{flex:0 0 116px;width:116px}
.pa-knowledge-kind-filter{flex:0 0 150px;width:150px}
.pa-pref-input{background:var(--dsw-alias-settings-card-fill,#fff);border:1px solid var(--dsw-alias-border-l3);border-radius:10px;box-sizing:border-box;color:inherit;font-size:13px;padding:5px 10px;min-width:0}
.pa-pref-input--key{flex:1 1 180px}
.pa-pref-input--situation{flex:1 1 160px}
.pa-pref-input--value{flex:1 1 100%;min-height:44px;resize:vertical}
.pa-select{position:relative}
.pa-select-trigger{align-items:center;background:var(--dsw-alias-settings-card-fill,#fff);border:1px solid var(--dsw-alias-border-l3);border-radius:10px;box-sizing:border-box;color:inherit;cursor:pointer;display:flex;font:inherit;font-size:13px;gap:6px;min-width:0;padding:5px 9px;text-align:left;width:100%}
.pa-select-trigger:hover:not(:disabled){border-color:var(--dsw-alias-border-l4)}
.pa-select-trigger[aria-expanded="true"]{border-color:var(--dsw-alias-label-secondary,#8a94a6);box-shadow:0 0 0 2px var(--dsw-alias-interactive-bg-hover,#2631480f)}
.pa-select-trigger:disabled{cursor:default;opacity:.55}
.pa-select-icon{display:inline-flex;flex:none}
.pa-select-value{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pa-select-caret{color:var(--dsw-alias-label-caption);flex:none;font-size:10px;line-height:1}
/* 展开面板：圆角 + 轻微高斯模糊，替代系统绘制的方角下拉列表。 */
.pa-select-panel{-webkit-backdrop-filter:blur(14px) saturate(160%);backdrop-filter:blur(14px) saturate(160%);background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-bg-layer-1,#fff) 94%,transparent),color-mix(in srgb,var(--dsw-alias-bg-layer-1,#fff) 88%,transparent));border:.5px solid var(--dsw-alias-settings-card-stroke,#00000029);border-radius:12px;box-shadow:0 12px 32px -12px rgba(15,17,21,.35),0 2px 8px rgba(15,17,21,.1);box-sizing:border-box;left:0;margin-top:6px;max-height:280px;overflow:auto;padding:4px;position:absolute;right:0;top:100%;z-index:1300}
.pa-select-panel--up{bottom:100%;margin-bottom:6px;margin-top:0;top:auto}
.pa-select-group{color:var(--dsw-alias-label-caption);font-size:11px;line-height:15px;padding:6px 8px 2px}
.pa-select-option{align-items:center;border-radius:8px;cursor:pointer;display:flex;font-size:13px;gap:8px;line-height:18px;padding:6px 8px}
.pa-select-option--active{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}
.pa-select-option--on{font-weight:600}
.pa-select-option-icon{align-items:center;display:inline-flex;flex:none}
.pa-select-option-label{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pa-select-check{color:var(--dsw-alias-brand-primary,#f5a623);flex:none;font-size:11px}
.pa-pref-add{background:var(--dsw-alias-button-primary-fill,#0f1115);border:none;border-radius:16px;box-sizing:border-box;color:var(--dsw-alias-bg-layer-2,#fff);cursor:pointer;font-size:13px;height:32px;padding:0 12px;align-self:flex-start}
.pa-pref-add:disabled{cursor:default;opacity:.5}
.pa-stat-strip{background:var(--dsw-alias-border-l3);border-radius:28px 28px 0 0;display:grid;gap:1px;grid-template-columns:repeat(4,minmax(0,1fr));overflow:hidden}
.pa-stat{background:var(--dsw-alias-settings-card-fill,#fff);display:flex;flex-direction:column;gap:2px;padding:12px 16px}
.pa-stat-value{font-size:20px;font-variant-numeric:tabular-nums;font-weight:700;line-height:1.1}
.pa-stat-label{color:var(--dsw-alias-label-caption);font-size:11px}
.pa-list-toolbar{align-items:center;border-top:1px solid var(--dsw-alias-border-l3);display:flex;gap:8px;padding:10px 16px}
.pa-filter-pills{display:flex;flex-wrap:wrap;gap:6px}
.pa-filter{background:transparent;border:1px solid var(--dsw-alias-border-l3);border-radius:999px;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;font-size:12px;line-height:18px;padding:3px 12px;transition:background-color 120ms ease,border-color 120ms ease,color 120ms ease}
.pa-filter:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}
.pa-filter--on{background:var(--pa-deep-fill,#283142);border-color:var(--pa-deep-fill,#283142);color:var(--pa-ink,#f7f9fc)}
.pa-sort-toggle{align-items:center;display:flex;gap:6px}
.pa-sort-label{color:var(--dsw-alias-label-caption);font-size:11px}
.pa-pref-empty{padding:18px 16px}
.pa-pref-group{border-top:1px solid var(--dsw-alias-border-l3)}
.pa-list-toolbar+.pa-pref-group{border-top:0}
.pa-pref-group-head{align-items:center;background:color-mix(in srgb,var(--pref-tone) 6%,transparent);border:0;border-bottom:1px solid var(--dsw-alias-border-l3);cursor:pointer;display:flex;font:inherit;gap:8px;padding:9px 16px;text-align:left;width:100%}
.pa-pref-group-head:hover{background:color-mix(in srgb,var(--pref-tone) 11%,transparent)}
.pa-pref-group-glyph{align-items:center;color:var(--pref-tone);display:inline-flex;flex:none;height:22px;justify-content:center;width:22px}
.pa-line-icon{display:block}
.pa-pref-group-name{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}
.pa-pref-group-desc{color:var(--dsw-alias-label-secondary);flex:1 1 auto;font-size:11px;line-height:16px;margin-left:2px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pa-pref-group-scope{color:color-mix(in srgb,var(--pref-tone) 55%,var(--dsw-alias-label-caption));font-variant-numeric:tabular-nums}
/* 知识库按属性分组：属性名不换行，右侧两行小字——第一行定义，第二行用途；超长各自省略，悬停给全文。 */
.pa-pref-group-name{flex:0 0 auto;white-space:nowrap}
.pa-pref-group-count{background:color-mix(in srgb,var(--pref-tone) 14%,transparent);border-radius:999px;color:color-mix(in srgb,var(--pref-tone) 65%,var(--dsw-alias-label-primary));font-size:11px;font-variant-numeric:tabular-nums;line-height:17px;padding:0 8px}
.pa-pref-group-caret{color:var(--dsw-alias-label-caption);margin-left:auto;transition:transform 150ms ease}
.pa-pref-group-caret--open{transform:rotate(180deg)}
.pa-pref-group .pa-pref-row:last-child{border-bottom:0}
.pa-pref-crumbs{align-items:center;display:flex;flex-wrap:wrap;gap:4px;min-width:0}
.pa-pref-crumb{background:color-mix(in srgb,var(--pref-tone) 10%,transparent);border:1px solid color-mix(in srgb,var(--pref-tone) 24%,transparent);border-radius:6px;color:color-mix(in srgb,var(--pref-tone) 62%,var(--dsw-alias-label-primary));font-size:11px;line-height:16px;padding:1px 6px}
.pa-pref-crumb-sep{color:var(--dsw-alias-label-caption);font-size:10px}
.pa-pref-item-foot{align-items:center;display:flex;flex-wrap:wrap;gap:6px}
.pa-pref-chip{border:1px solid var(--dsw-alias-border-l3);border-radius:999px;font-size:11px;line-height:16px;padding:1px 8px}
.pa-pref-chip--stable{background:color-mix(in srgb,var(--pa-green) 9%,transparent);border-color:color-mix(in srgb,var(--pa-green) 30%,transparent);color:var(--pa-green)}
.pa-pref-chip--situational{background:color-mix(in srgb,var(--pa-deep) 9%,transparent);border-color:color-mix(in srgb,var(--pa-deep) 26%,transparent);color:var(--pa-deep)}
.pa-pref-chip--source,.pa-pref-chip--time{color:var(--dsw-alias-label-caption)}
.pa-pref-chip--source{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pa-genre-filter{align-items:center;display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px}
.pa-filter-label{color:var(--dsw-alias-label-caption);font-size:11px}
.pa-genre-tag{align-items:center;background:color-mix(in srgb,var(--genre-tone,#2f4c8f) 12%,transparent);border:1px solid color-mix(in srgb,var(--genre-tone,#2f4c8f) 30%,transparent);border-radius:999px;color:color-mix(in srgb,var(--genre-tone,#2f4c8f) 60%,var(--dsw-alias-label-primary));cursor:pointer;display:inline-flex;font:inherit;font-size:11px;gap:5px;line-height:18px;padding:1px 9px;transition:background-color 120ms ease,border-color 120ms ease,box-shadow 120ms ease}
.pa-genre-tag:hover{background:color-mix(in srgb,var(--genre-tone,#2f4c8f) 20%,transparent)}
.pa-genre-tag--active{background:color-mix(in srgb,var(--genre-tone,#2f4c8f) 22%,transparent);border-color:var(--genre-tone);box-shadow:inset 0 0 0 1px var(--genre-tone)}
.pa-attribute-tag .pa-kind-icon{color:var(--kind-tone,#2f4c8f);flex:none}
.pa-attribute-tag{align-items:center;background:color-mix(in srgb,var(--kind-tone,#2f4c8f) 8%,transparent);border:1px solid color-mix(in srgb,var(--kind-tone,#2f4c8f) 26%,transparent);border-radius:8px;color:color-mix(in srgb,var(--kind-tone,#2f4c8f) 58%,var(--dsw-alias-label-primary));display:inline-flex;font-size:11px;gap:5px;line-height:18px;padding:1px 9px}
.pa-genre-dot{background:var(--genre-tone,#2f4c8f);border-radius:50%;display:inline-block;height:6px;width:6px}
.pa-kind-badge{cursor:help}
.pa-kind-badge:focus-visible{outline:2px solid color-mix(in srgb,var(--pa-deep) 55%,transparent);outline-offset:2px}
/* 统一的说明浮窗：圆角卡片 + 轻微高斯模糊（backdrop-filter），插件内所有悬停解释共用一套观感。 */
.pa-tip-card{-webkit-backdrop-filter:blur(14px) saturate(160%);animation:pa-tooltip-in 140ms ease-out;backdrop-filter:blur(14px) saturate(160%);background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-bg-layer-1,#fff) 86%,transparent),color-mix(in srgb,var(--dsw-alias-bg-layer-1,#fff) 66%,transparent));border:.5px solid var(--dsw-alias-settings-card-stroke,#00000029);border-radius:12px;box-shadow:0 12px 32px -12px rgba(15,17,21,.35),0 2px 8px rgba(15,17,21,.1),inset 0 1px 0 rgba(255,255,255,.45);box-sizing:border-box;color:var(--dsw-alias-label-primary);font-size:12px;line-height:18px;max-width:260px;padding:9px 11px;pointer-events:none;position:fixed;white-space:pre-line;width:max-content;word-break:break-word;z-index:1200}
.pa-basis-badge{color:var(--dsw-alias-label-caption)}
.pa-knowledge-tags{gap:6px;margin-top:2px}
.pa-knowledge-tag{background:var(--dsw-alias-interactive-bg-hover,#2631480f);border:1px solid transparent;border-radius:8px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:18px;padding:1px 8px;transition:background-color 120ms ease,border-color 120ms ease}
.pa-knowledge-tag::before{content:'#';margin-right:1px;opacity:.45}
.pa-knowledge-tag:hover{background:var(--dsw-alias-interactive-bg-active,#2631481a);border-color:var(--dsw-alias-border-l3)}
.pa-pref-conf{align-items:center;display:flex;gap:3px;margin-left:auto}
.pa-pref-conf-seg{background:color-mix(in srgb,var(--pref-tone) 16%,transparent);border-radius:3px;height:5px;width:12px}
.pa-pref-conf-seg--on{background:var(--pref-tone)}
.pa-pref-conf-text{color:var(--dsw-alias-label-caption);font-size:10px;font-variant-numeric:tabular-nums;margin-left:2px}
.pa-pref-form-title{font-size:13px;font-weight:600;margin-bottom:2px}
.pa-pref-form-grid{align-items:start;display:grid;gap:10px;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr) minmax(150px,.85fr)}
.pa-pref-field{display:flex;flex-direction:column;gap:4px;min-width:0}
.pa-pref-field--wide{grid-column:1/-1}
.pa-pref-field-label{color:var(--dsw-alias-label-caption);font-size:11px}
.pa-pref-field .pa-pref-input,.pa-pref-field .pa-select{flex:none;min-width:0;width:100%}
/* 统一的右侧小箭头：原生 select 的箭头的样式不可控，这里统一换成主题色小三角。 */
.pa-pref-form-actions{align-items:center;display:flex;gap:8px;margin-top:2px}
@media (max-width:720px){.pa-pref-form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pa-pref-field--key{grid-column:1/-1}}
@media (max-width:640px){.pa-stat-strip{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){.pa-pref-form-grid{grid-template-columns:1fr}}
.pa-wake-filters{display:flex;gap:4px;padding:10px 12px 0}
.pa-wake-filter{background:var(--dsw-alias-interactive-bg-hover,#2631480f);border:.5px solid var(--dsw-alias-border-l4);border-radius:14px;color:var(--dsw-alias-label-caption);cursor:pointer;font-size:14px;height:28px;line-height:26px;padding:0 12px}
.pa-wake-filter--on{background:var(--dsw-alias-interactive-bg-active,#2631481a);color:var(--dsw-alias-label-primary)}
.pa-wake-filter:hover:not(.pa-wake-filter--on){background:var(--dsw-alias-interactive-bg-active,#2631481a)}
.pa-knowledge-tools{align-items:center;border-top:1px solid var(--dsw-alias-border-l3);display:flex;gap:8px;padding:10px 16px;flex-wrap:wrap}
.pa-knowledge-search{flex:1 1 240px}
.pa-knowledge-actions{align-items:center;display:flex;gap:8px;margin-left:auto}
.pa-fav-entry{display:inline-flex;position:relative}
.pa-fav-toggle{align-items:center;background:transparent;border:none;border-radius:8px;color:var(--dsw-alias-label-caption);cursor:pointer;display:inline-flex;justify-content:center;padding:4px}
.pa-fav-toggle:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}
.pa-fav-toggle--on{color:var(--dsw-alias-brand-primary,#f5a623)}
/* 未收藏：灰框空心星。fill 留空，只描边，避免看起来像已收藏的实心灰星。 */
.pa-star-outline{fill:none;stroke:var(--dsw-alias-label-caption);stroke-linecap:round;stroke-linejoin:round}
.pa-fav-backdrop{inset:0;position:fixed;z-index:1000}
.pa-fav-pop{background:var(--dsw-alias-bg-layer-1,#fff);border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-panel,14px);box-shadow:0 0 0 .5px var(--dsw-alias-settings-card-stroke,#00000029),0 8px 24px rgba(0,0,0,.18);box-sizing:border-box;display:flex;flex-direction:column;gap:10px;padding:12px 14px;position:fixed;width:min(264px,calc(100vw - 16px));z-index:1001}
.pa-fav-head{align-items:center;display:flex;gap:8px}
.pa-fav-head-icon{color:#f5a623;display:inline-flex}
.pa-fav-title{color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:600}
.pa-fav-close{align-items:center;background:transparent;border:none;border-radius:8px;color:var(--dsw-alias-label-caption);cursor:pointer;display:inline-flex;font-size:13px;height:22px;justify-content:center;padding:0;width:22px}
.pa-fav-close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.pa-fav-stars{display:flex;gap:3px}
.pa-fav-star-btn{background:transparent;border:none;border-radius:8px;color:var(--dsw-alias-label-caption);cursor:pointer;display:inline-flex;padding:1px}
.pa-fav-star-btn--on{color:#f5a623}
/* 解析按钮按状态分流配色：
   待解析 = 深蓝底白字（主操作，最醒目）；解析中/重试 = 深色底浅色字；
   已解析 = 深蓝字浅底（表示已完成、可再看）。 */
.pa-fav-act{background:transparent;border:.5px solid transparent;border-radius:var(--dsw-radius-sm,8px);cursor:pointer;font-size:12px;font-weight:500;line-height:16px;padding:4px 12px;transition:background-color 120ms ease,color 120ms ease,border-color 120ms ease,filter 120ms ease}
.pa-fav-act:disabled{cursor:default;opacity:.55}
.pa-fav-act--analyze{background:var(--pa-deep-fill,#283142);border-color:var(--pa-deep-fill,#283142);color:var(--pa-ink,#f7f9fc)}
.pa-fav-act--analyze:hover:not(:disabled){filter:brightness(1.22)}
.pa-fav-act--all{margin-left:auto}
.pa-fav-act--analyzing,.pa-fav-act--retry{background:color-mix(in srgb,var(--pa-deep-fill,#283142) 55%,transparent);border-color:color-mix(in srgb,var(--pa-deep-fill,#283142) 70%,transparent);color:var(--pa-ink,#f7f9fc)}
.pa-fav-act--analyzing{cursor:progress}
.pa-fav-act--retry:hover:not(:disabled){background:var(--pa-deep-fill,#283142)}
.pa-fav-act--analyzed{background:color-mix(in srgb,var(--pa-deep) 10%,transparent);border-color:color-mix(in srgb,var(--pa-deep) 35%,transparent);color:var(--pa-deep)}
.pa-fav-act--analyzed:hover:not(:disabled){background:color-mix(in srgb,var(--pa-deep) 18%,transparent)}
.pa-fav-act--edit{color:var(--pa-green);border-color:color-mix(in srgb,var(--pa-green) 45%,transparent)}
.pa-fav-act--edit:hover:not(:disabled){background:color-mix(in srgb,var(--pa-green) 14%,transparent)}
.pa-fav-act--delete{color:var(--pa-red);border-color:color-mix(in srgb,var(--pa-red) 40%,transparent)}
.pa-fav-act--delete:hover:not(:disabled),.pa-fav-act--delete-armed{background:var(--pa-red);border-color:var(--pa-red);color:#fff}
/* 收藏列表：限制高度，超出后内部滚动，避免长列表把设置页拉得很长。 */
/* 列表内部可滚动，但滚到边界后把滚轮交还给设置页（overscroll-behavior:auto），避免卡住整页滚动。 */
.pa-fav-scroll{max-height:min(58vh,520px);overflow-y:auto;overscroll-behavior:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin;padding:8px 10px 10px;position:relative}
/* 展开的长内容不再各自滚动：正文块只负责排版，滚动统一交给 .pa-fav-scroll，
   避免出现多层嵌套滚动区（滚轮被内层吃掉、外层滑不动）。 */
.pa-fav-scroll .pa-pref-row{scroll-margin-top:44px}
.pa-fav-scroll::-webkit-scrollbar{width:8px}
.pa-fav-scroll::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l4);border-radius:999px}
.pa-fav-scroll::-webkit-scrollbar-thumb:hover{background:var(--dsw-alias-label-dimmed)}
.pa-fav-scroll::-webkit-scrollbar-track{background:transparent}
/* 行头吸顶：展开很长内容时，「收起/解析/编辑/删除」始终留在列表可视区顶部，不会被挤走。 */
.pa-fav-row .pa-pref-head{flex-wrap:wrap}
.pa-fav-row-head{align-items:center;background:var(--dsw-alias-settings-card-fill,#fff);border-radius:10px;display:flex;flex-wrap:wrap;gap:8px;padding:4px 2px;position:sticky;top:8px;z-index:6}
.pa-fav-row-head .pa-pref-key{margin-right:auto}
.pa-fav-row-head .pa-pref-crumbs{margin-right:auto;min-width:0}
.pa-fav-row-head .pa-pref-conf{margin-left:0}
/* 折叠开关：三角 + 星级 + 星级文字，整块可点，与右侧操作按钮分开。 */
/* 展开/收起：与其它操作按钮同规格的实底描边按钮，不靠小三角提示。 */
/* 单条折叠开关：轻量文本按钮（无底色无边距），三角比原先更大更醒目。 */
.pa-fav-fold{align-items:center;background:none;border:none;border-radius:var(--dsw-radius-sm,8px);color:var(--dsw-alias-label-secondary);cursor:pointer;display:inline-flex;flex:0 0 auto;font-size:12px;gap:4px;line-height:16px;padding:2px 4px;transition:color 120ms ease}
.pa-fav-fold:hover{background:none;color:var(--pa-deep)}
.pa-fav-fold:focus-visible{outline:1px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.pa-fav-caret{display:inline-block;font-size:16px;line-height:1;transition:transform 140ms ease}
.pa-fav-caret--open{transform:rotate(180deg)}
.pa-fav-body{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2,#f5f6f8) 55%,transparent);border-radius:10px;display:flex;flex-direction:column;gap:6px;margin-top:2px;padding:10px 12px}
.pa-fav-text{display:flex;flex-direction:column;gap:2px;min-width:0}
.pa-fav-meta{color:var(--dsw-alias-label-caption);font-size:12px}
.pa-fav-row-foot{align-items:center;display:flex;gap:8px;justify-content:space-between;margin-top:2px;min-width:0}
/* 知识行：标题优先让位——超长时省略号，置信度与归档/删除固定在同一行右侧。 */
.pa-fav-row-head--nowrap{flex-wrap:nowrap}
.pa-fav-row-head--nowrap .pa-pref-key{margin-right:0}
.pa-fav-row-head--nowrap .pa-col-title{flex:1 1 0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pa-fav-row-head--nowrap .pa-pref-conf{flex:0 0 auto;margin-left:8px}
.pa-fav-row-head--nowrap .pa-knowledge-actions{flex:0 0 auto;margin-left:10px}
.pa-fav-row-foot .pa-fav-meta{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pa-fav-foot-actions{align-items:center;display:flex;flex:none;gap:6px;margin-left:auto}
.pa-fav-foot-actions .pa-pref-act--delete{margin-left:0}
.pa-fav-act--toggle{color:var(--pa-deep);border-color:color-mix(in srgb,var(--pa-deep) 35%,transparent);margin-left:auto}
.pa-fav-act--toggle:hover:not(:disabled){background:color-mix(in srgb,var(--pa-deep) 12%,transparent)}
.pa-fav-hint{color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.5}
.pa-fav-hint--cat{margin-top:2px}
.pa-fav-cats{display:flex;flex-wrap:wrap;gap:6px}
.pa-fav-cat-btn{background:var(--dsw-alias-interactive-bg-hover,#2631480f);border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm,8px);color:var(--dsw-alias-label-primary);cursor:pointer;font-size:12px;height:24px;line-height:22px;padding:0 10px;transition:background-color 120ms ease,border-color 120ms ease,color 120ms ease}
.pa-fav-cat-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.pa-fav-cat-btn--on,.pa-fav-cat-btn--on:hover:not(:disabled){background:var(--dsw-alias-button-primary-fill,#0f1115);border-color:var(--dsw-alias-button-primary-fill,#0f1115);color:var(--dsw-alias-label-primary-foreground,#fff)}
.pa-fav-cat-btn[aria-disabled="true"]{cursor:not-allowed;opacity:.45}
.pa-fav-cat-btn[aria-disabled="true"]:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f);color:var(--dsw-alias-label-primary)}
/* 收藏原因说明：圆角卡片 + 高斯模糊（backdrop-filter），替代浏览器原生 title 的方框提示。 */
.pa-reason-tip{left:0;top:0}
.pa-reason-tip-title{color:var(--dsw-alias-label-primary);font-size:12px;font-weight:600;line-height:16px}
.pa-reason-tip-desc{color:var(--dsw-alias-label-caption);font-size:12px;line-height:17px;margin-top:2px}
.pa-reason-tip-example{color:var(--dsw-alias-label-caption);font-size:11px;line-height:16px;margin-top:4px}
.pa-reason-tip-scope{align-items:center;color:var(--dsw-alias-label-caption);display:flex;font-size:11px;gap:5px;line-height:15px;margin-top:6px}
.pa-reason-tip-dot{background:var(--dsw-alias-brand-primary,#f5a623);border-radius:50%;flex:none;height:4px;width:4px}
/* 选满上限时的短提示：同一张圆角卡片，描边带一点强调色，1.8 秒后自动消失。 */
.pa-reason-tip--limit{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#f5a623) 55%,transparent)}
.pa-fav-row{gap:6px}
.pa-fav-cat{color:var(--dsw-alias-label-secondary)}
/* 正文块：不设内部滚动（滚动由 .pa-fav-scroll 独占），仅按各自上限裁切，
   超出部分由「展开全文/收起」按钮在同层展开，避免撑爆列表高度。 */
/* 提问与回复默认只显示两行（-webkit-line-clamp），其余内容由渐变遮罩提示、点「展开全文」二次展开；
   过程块较长，按 120px 高度裁切，同样可二次展开。统一外层滚动，不用内层滚动区。 */
.pa-fav-content{color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5;white-space:pre-wrap;word-break:break-word;max-height:120px;overflow:hidden;position:relative}
.pa-fav-content--lines{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;max-height:none}
.pa-fav-content--full{max-height:none}
.pa-fav-content--lines.pa-fav-content--full{display:block;-webkit-line-clamp:unset}
/* 渐变遮罩提示“下面还有内容”：两行模式用半行高的浅渐变，高度裁切模式用 28px。 */
.pa-fav-content--clipped::after{background:linear-gradient(to bottom,transparent,var(--dsw-alias-settings-card-fill,#fff));bottom:0;content:'';height:28px;left:0;position:absolute;right:0;pointer-events:none}
.pa-fav-content--lines.pa-fav-content--clipped::after{height:16px}
.pa-fav-more{align-self:flex-start;background:none;border:none;color:var(--pa-deep);cursor:pointer;font-size:12px;line-height:16px;padding:0}
.pa-fav-more:hover{text-decoration:underline}
.pa-fav-content--q{color:var(--dsw-alias-label-secondary)}
.pa-fav-error{color:var(--dsw-alias-danger-fill);font-size:12px;line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:break-all}
.pa-fav-note-row{color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
/* 输入 / 过程 / 输出：同一品牌色系的三档深浅（输入最浅 → 输出最深），不再用三种颜色。 */
.pa-fav-section{--fav-tone:var(--dsw-alias-brand-primary,#f5a623);border-left:2px solid var(--fav-rail);display:flex;flex-direction:column;gap:5px;margin-bottom:14px;padding-left:10px}
.pa-fav-section:last-child{margin-bottom:0}
.pa-fav-section--input{--fav-rail:color-mix(in srgb,var(--fav-tone) 26%,transparent);--fav-dot:color-mix(in srgb,var(--fav-tone) 38%,transparent);--fav-ink:color-mix(in srgb,var(--fav-tone) 46%,var(--dsw-alias-label-primary))}
.pa-fav-section--process{--fav-rail:color-mix(in srgb,var(--fav-tone) 48%,transparent);--fav-dot:color-mix(in srgb,var(--fav-tone) 62%,transparent);--fav-ink:color-mix(in srgb,var(--fav-tone) 68%,var(--dsw-alias-label-primary))}
.pa-fav-section--output{--fav-rail:color-mix(in srgb,var(--fav-tone) 76%,transparent);--fav-dot:color-mix(in srgb,var(--fav-tone) 92%,transparent);--fav-ink:color-mix(in srgb,var(--fav-tone) 90%,var(--dsw-alias-label-primary))}
.pa-fav-section-label{align-items:center;color:var(--fav-ink);display:flex;font-size:12px;font-weight:600;gap:6px;letter-spacing:.06em}
.pa-fav-section-label::after{background:var(--fav-rail);content:'';flex:1 1 auto;height:1px}
.pa-fav-section-dot{background:var(--fav-dot);border-radius:50%;flex:none;height:5px;width:5px}
.pa-fav-proc{display:flex;flex-direction:column;gap:5px;min-width:0}
.pa-fav-proc-chain{align-items:center;display:flex;flex-wrap:wrap;gap:4px}
.pa-fav-proc-step{border-radius:6px;font-size:11px;line-height:17px;padding:0 6px}
.pa-fav-proc-step--think{align-items:center;background:color-mix(in srgb,var(--dsw-alias-brand-primary,#f5a623) 15%,transparent);color:var(--dsw-alias-label-primary);display:inline-flex;font-weight:600;gap:4px}
.pa-think-icon{flex:none}
.pa-fav-proc-step--tool{background:var(--dsw-alias-interactive-bg-hover,#2631480f);color:var(--dsw-alias-label-caption);font-variant-numeric:tabular-nums}
.pa-fav-proc-arrow{color:var(--dsw-alias-label-caption);font-size:10px}
.pa-fav-proc-toggle{align-self:flex-start;background:none;border:none;color:var(--dsw-alias-brand-primary,#f5a623);cursor:pointer;font-size:12px;line-height:16px;padding:0}
/* 输出按 Markdown 渲染：段落/标题/列表/引用/代码块各自成块，长内容折叠用高度而不是行数。 */
.pa-fav-content--md{white-space:normal}
.pa-fav-content--md.pa-fav-content--clipped{display:block;max-height:150px;overflow:hidden;-webkit-line-clamp:unset}
.pa-fav-content--md.pa-fav-content--full{max-height:none;overflow:visible}
.pa-md{display:flex;flex-direction:column;gap:6px;min-width:0}
.pa-md-p{margin:0;white-space:pre-wrap;word-break:break-word}
.pa-md-heading{color:var(--dsw-alias-label-primary);font-weight:600;margin:2px 0 0}
.pa-md-h1{font-size:15px}
.pa-md-h2{font-size:14px}
.pa-md-h3{font-size:13px}
.pa-md-h4{font-size:12px}
.pa-md-list{display:flex;flex-direction:column;gap:2px;margin:0;padding-left:18px}
.pa-md-quote{border-left:2px solid var(--dsw-alias-border-l3);color:var(--dsw-alias-label-secondary);margin:0;padding-left:8px}
.pa-md-pre{background:var(--dsw-alias-interactive-bg-hover,#2631480f);border-radius:8px;font-size:12px;line-height:1.5;margin:0;overflow:auto;padding:8px 10px}
.pa-md-code{background:var(--dsw-alias-interactive-bg-hover,#2631480f);border-radius:4px;font-size:12px;padding:0 4px}
.pa-md-link{color:var(--dsw-alias-brand-primary,#f5a623);text-decoration:underline}
.pa-md-hr{border:0;border-top:1px solid var(--dsw-alias-border-l3);margin:4px 0}
.pa-fav-proc-reasoning{border-left:2px solid var(--dsw-alias-border-l3);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.6;max-height:220px;overflow:auto;padding-left:8px;white-space:pre-wrap;word-break:break-word}
.pa-fav-note-label{color:var(--dsw-alias-label-secondary)}
.pa-fav-note{background:var(--dsw-alias-bg-layer-1,#fff);border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-lg,12px);box-sizing:border-box;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;max-height:200px;min-height:56px;padding:8px 10px;resize:none;transition:border-color 120ms ease,box-shadow 120ms ease;width:100%}
.pa-fav-note::placeholder{color:var(--dsw-alias-label-caption)}
.pa-fav-note:focus{border-color:var(--dsw-alias-border-l3);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary);outline:none}
.pa-fav-actions{align-items:center;display:flex;gap:6px;justify-content:flex-end}
.pa-fav-save{background:var(--dsw-alias-button-primary-fill,#0f1115);border:none;border-radius:var(--dsw-radius-lg,12px);color:var(--dsw-alias-label-primary-foreground,#fff);cursor:pointer;font-size:12px;font-weight:500;height:28px;padding:0 14px}
.pa-fav-save:disabled{cursor:default;opacity:.5}
.pa-fav-remove{background:transparent;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-lg,12px);color:#e5484d;cursor:pointer;font-size:12px;height:28px;margin-right:auto;padding:0 10px}
.pa-fav-remove:hover{background:var(--dsw-alias-interactive-bg-hover-danger,#ec13130d);border-color:#e5484d40}
.pa-fav-remove:disabled{cursor:default;opacity:.5}
.pa-fav-cancel{background:transparent;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-lg,12px);color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:12px;height:28px;padding:0 12px}
.pa-fav-cancel:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f);color:var(--dsw-alias-label-primary)}
.pa-fav-cancel:disabled{cursor:default;opacity:.5}
.pa-fav-tip{transform:none}
@keyframes pa-tooltip-in{from{opacity:0}}
@media (prefers-reduced-motion: reduce){.pa-fav-cat-btn,.pa-fav-note,.pa-tip-card{transition:none;animation:none}}
.pa-star{display:inline-block;flex:none}
/* 收藏夹解析：导入区与条目行 */
.pa-col-folder{--pa-col-accent:#FB7299}
.pa-col-folder.pa-col-platform--zhihu{--pa-col-accent:#0084FF}
.pa-col-folder.pa-col-platform--qqmusic{--pa-col-accent:#0daf52}
.pa-col-folder.pa-col-platform--xiaohongshu{--pa-col-accent:#FF2442}
.pa-col-import{display:flex;flex-direction:column;gap:8px;padding:2px 4px 6px}
.pa-col-url{background:var(--dsw-alias-bg-layer-1,#fff);border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md,10px);box-sizing:border-box;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;height:32px;line-height:18px;padding:0 10px;width:100%}
.pa-col-url:focus{border-color:var(--pa-deep);outline:none}
.pa-col-textarea{background:var(--dsw-alias-bg-layer-1,#fff);border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md,10px);box-sizing:border-box;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;line-height:18px;min-height:64px;padding:8px 10px;resize:vertical;width:100%}
.pa-col-textarea:focus{border-color:var(--pa-deep);outline:none}
.pa-col-import-actions{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
.pa-col-file{display:none}
.pa-col-import-hint{color:var(--dsw-alias-label-caption);font-size:12px;line-height:18px;margin:0}
.pa-col-title{flex:1 1 160px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pa-col-link:hover{text-decoration:underline}
.pa-col-stars{align-items:center;color:var(--dsw-alias-label-caption);display:flex;flex-wrap:wrap;font-size:12px;gap:6px}
.pa-col-stars-select{background:var(--dsw-alias-bg-layer-1,#fff);border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm,8px);color:var(--dsw-alias-label-primary);font-size:12px;height:24px;padding:0 6px}
/* 收藏夹分组内的条目：B 站用粉色、知乎用蓝色；其它平台沿用默认色。 */
.pa-col-folder .pa-fav-body{background:transparent;border-radius:0;margin-top:0;padding:0}
.pa-col-item{border-top:.5px solid var(--dsw-alias-border-l4);padding:14px 2px}
.pa-col-item-main{align-items:flex-start;display:flex;gap:8px}
.pa-col-item-content{display:flex;flex:1;flex-direction:column;gap:10px;min-width:0}
.pa-col-item-head{align-items:baseline;display:flex;gap:8px;min-width:0}
.pa-col-item-thumb{align-self:flex-start;background:var(--dsw-alias-interactive-bg-hover,#2631480f);border-radius:8px;flex:none;height:48px;object-fit:cover;width:48px}
.pa-col-cover-strip{align-items:center;display:inline-flex;flex:none;gap:3px}
.pa-col-cover-strip img{background:var(--dsw-alias-interactive-bg-hover,#2631480f);border-radius:5px;height:22px;object-fit:cover;width:22px}
/* 浏览器书签的 favicon 原生多为 16px：按原尺寸展示，避免放大到 48px 后发虚。 */
.pa-col-platform--browser .pa-col-item-thumb{background:transparent;border-radius:3px;height:16px;margin-top:2px;object-fit:contain;width:16px}
.pa-col-platform--browser .pa-col-cover-strip img{background:transparent;border-radius:3px;height:16px;object-fit:contain;width:16px}
.pa-col-item-idx{color:var(--dsw-alias-label-caption);flex:none;font-size:12px;min-width:20px}
.pa-bili-icon,.pa-col-platform-icon{flex:none;border-radius:4px;vertical-align:middle}
.pa-col-item-title{color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:600;line-height:19px;min-width:0}
.pa-col-item-author{color:var(--pa-col-accent,#FB7299);flex:none;font-size:12px;font-weight:700;line-height:19px}
.pa-col-kind{flex:none;font-size:11px}
.pa-col-desc{border-left:2px solid color-mix(in srgb,var(--pa-col-accent,#FB7299) 40%,transparent);display:flex;gap:6px;margin:2px 0 0;padding:0 0 0 8px}
.pa-col-desc-label{color:var(--pa-col-accent,#FB7299);flex:none;font-size:11px;font-weight:600;line-height:17px}
.pa-col-desc-text{color:var(--dsw-alias-label-caption);font-size:12px;line-height:18px;white-space:pre-line}
.pa-col-desc--clamp .pa-col-desc-text{-webkit-box-orient:vertical;-webkit-line-clamp:3;display:-webkit-box;overflow:hidden;white-space:normal}
.pa-col-desc-toggle{background:none;border:none;color:var(--pa-col-accent,#FB7299);cursor:pointer;font-size:11px;line-height:17px;margin:0;padding:0;text-align:left}
.pa-col-desc-toggle:hover{text-decoration:underline}
.pa-col-extra{color:var(--dsw-alias-label-caption);font-size:11px;line-height:17px;margin:0}
.pa-col-extra-label{color:var(--pa-col-accent,#FB7299);font-weight:600}
.pa-col-source{color:inherit;text-decoration:none}
.pa-col-source:hover{color:var(--pa-col-accent,#FB7299);text-decoration:underline}
.pa-col-tags{display:flex;flex-wrap:wrap;gap:4px}
.pa-col-meta-row{align-items:center;display:flex;flex-wrap:wrap;gap:8px;margin-top:2px}
.pa-col-meta-row .pa-col-tags{flex:1 1 auto}
.pa-col-published{color:var(--dsw-alias-label-caption);font-size:11px;line-height:17px;margin-left:auto;white-space:nowrap}
.pa-col-tags .pa-field-badge{font-size:11px}
.pa-col-item-foot{align-items:center;display:flex;gap:12px;justify-content:space-between;margin-top:2px;min-width:0}
.pa-col-item-stats{align-items:center;color:var(--dsw-alias-label-caption);display:flex;flex:none;flex-wrap:wrap;font-size:11px;gap:10px;line-height:16px}
.pa-col-duration{background:rgba(0,0,0,.06);border-radius:4px;padding:0 4px}
.pa-col-link{color:var(--dsw-alias-label-caption);display:inline-block;flex:1;font-size:11px;min-width:0;overflow:hidden;text-decoration:none;text-overflow:ellipsis;white-space:nowrap}
.pa-col-link--empty{flex:1}
.pa-col-link:hover{color:var(--pa-col-accent,#FB7299);text-decoration:underline}
/* 外部收藏夹导入：平台并排卡片 */
.pa-col-platforms{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr));margin:2px 4px 8px}
@media (max-width:560px){.pa-col-platforms{grid-template-columns:1fr}}
.pa-col-platform-card{--pa-platform-accent:#FB7299;background:var(--dsw-alias-bg-layer-1,#fff);border:.5px solid var(--dsw-alias-border-l4);border-radius:16px;border-top:2px solid var(--pa-platform-accent);display:flex;flex-direction:column;gap:10px;min-width:0;padding:14px}
.pa-col-platform-card--bilibili{--pa-platform-accent:#FB7299}
.pa-col-platform-card--zhihu{--pa-platform-accent:#0084FF}
.pa-col-platform-card--qqmusic{--pa-platform-accent:#0daf52}
.pa-col-platform-card--xiaohongshu{--pa-platform-accent:#FF2442}
.pa-col-platform-card--browser{--pa-platform-accent:#0F6CBD;grid-column:1/-1}
.pa-col-platform-card--browser.pa-col-platform-card--disabled{opacity:.72}
.pa-col-source-badge{max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pa-col-browser-source{gap:4px}
.pa-col-folder.pa-col-platform--browser{--pa-col-accent:#0F6CBD}
.pa-col-filebtn{align-items:center;background:var(--dsw-alias-bg-layer-1,#fff);border:1px dashed color-mix(in srgb,var(--pa-platform-accent) 55%,transparent);border-radius:var(--dsw-radius-md,10px);color:var(--pa-platform-accent);cursor:pointer;display:inline-flex;font-size:12px;font-weight:600;gap:6px;height:30px;max-width:100%;overflow:hidden;padding:0 12px;position:relative;text-overflow:ellipsis;white-space:nowrap}
.pa-col-filebtn:hover{background:color-mix(in srgb,var(--pa-platform-accent) 8%,transparent)}
.pa-col-filebtn:focus-within{outline:2px solid color-mix(in srgb,var(--pa-platform-accent) 45%,transparent);outline-offset:1px}
.pa-col-filebtn input{clip:rect(0 0 0 0);height:1px;opacity:0;overflow:hidden;position:absolute;width:1px}
.pa-col-browser-preview{border-top:.5px solid var(--dsw-alias-border-l4);display:flex;flex-direction:column;gap:8px;padding-top:10px}
.pa-col-browser-preview-head{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
.pa-col-browser-preview-title{color:var(--dsw-alias-label-primary);font-size:12px;font-weight:600;line-height:18px}
.pa-col-browser-preview-note{color:var(--dsw-alias-label-caption);font-size:11px;line-height:16px}
.pa-col-browser-groups{display:grid;gap:6px;grid-template-columns:repeat(2,minmax(0,1fr));max-height:220px;overflow:auto;padding:1px}
@media (max-width:560px){.pa-col-browser-groups{grid-template-columns:1fr}}
.pa-col-browser-group{align-items:center;border:.5px solid var(--dsw-alias-border-l4);border-radius:10px;cursor:pointer;display:flex;gap:8px;min-width:0;padding:6px 9px}
.pa-col-browser-group:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}
.pa-col-browser-group input{accent-color:#0F6CBD;flex:none;margin:0}
.pa-col-browser-group-name{color:var(--dsw-alias-label-primary);flex:1;font-size:12px;line-height:18px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pa-col-browser-group-count{color:var(--dsw-alias-label-caption);flex:none;font-size:11px;white-space:nowrap}
.pa-col-browser-actions{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
.pa-col-browser-selected{color:var(--dsw-alias-label-caption);font-size:11px;line-height:16px;margin-left:auto;white-space:nowrap}
.pa-col-platform-card--browser .pa-col-textbtn{color:var(--pa-platform-accent)}
.pa-col-platform-card-head{align-items:center;display:flex;gap:8px;min-width:0}
.pa-col-platform-card-name{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:700;line-height:19px}
.pa-col-platform-card-tag{background:color-mix(in srgb,var(--pa-platform-accent) 12%,transparent);border-radius:999px;color:var(--pa-platform-accent);font-size:10px;font-weight:600;line-height:16px;padding:0 6px;white-space:nowrap}
.pa-col-platform-card-link{color:var(--dsw-alias-label-caption);font-size:11px;margin-left:auto;text-decoration:none;white-space:nowrap}
.pa-col-platform-card-link:hover{color:var(--pa-platform-accent);text-decoration:underline}
.pa-col-platform-card .pa-col-url{height:30px;font-size:12px}
.pa-col-platform-card-actions{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
.pa-col-platform-card-actions--text{gap:12px;margin-top:-2px}
.pa-col-textbtn{background:none;border:none;color:var(--dsw-alias-label-caption);cursor:pointer;font-family:inherit;font-size:11px;line-height:16px;padding:0;text-decoration:underline}
.pa-col-textbtn:hover{color:var(--pa-platform-accent)}
.pa-col-textbtn:disabled{cursor:default;opacity:.5}
.pa-col-platform-card-hint{color:var(--dsw-alias-label-caption);font-size:11px;line-height:18px;margin:0}
.pa-col-paste{display:flex;flex-direction:column;gap:6px}
.pa-col-paste .pa-col-textarea{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;min-height:96px}
.pa-col-bookmarklet{align-items:center;background:color-mix(in srgb,var(--pa-platform-accent,#0084FF) 10%,transparent);border:1px dashed var(--pa-platform-accent,#0084FF);border-radius:var(--dsw-radius-sm,8px);color:color-mix(in srgb,var(--pa-platform-accent,#0084FF) 82%,#000 18%);cursor:grab;display:inline-flex;font-size:12px;font-weight:600;line-height:18px;padding:5px 10px;text-decoration:none;user-select:none}
.pa-col-bookmarklet:hover{background:color-mix(in srgb,var(--pa-platform-accent,#0084FF) 16%,transparent);text-decoration:none}
.pa-col-bookmarklet:active{cursor:grabbing}
`

    function injectCss() {
      for (const stale of Array.from(document.querySelectorAll('style[data-personal-assistant-css]'))) stale.remove()
      const style = document.createElement('style')
      style.dataset.personalAssistantCss = 'true'
      style.textContent = CSS
      document.head.appendChild(style)
    }

    function fieldControl(field, current, onDraft, disabled) {
      if (field.kind === 'boolean') {
        return h('button', {
          className: 'pa-switch',
          type: 'button',
          role: 'switch',
          'aria-checked': current === true ? 'true' : 'false',
          onClick: () => onDraft(field.key, !(current === true)),
          disabled,
        }, h('span', { className: 'pa-switch-thumb' }))
      }
      const inputType = field.kind === 'number' ? 'number' : 'text'
      return h('input', {
        className: 'pa-field-input',
        type: inputType,
        ...(field.kind === 'number' ? { min: 0, max: MAX_LEAD_MINUTES, step: 1 } : {}),
        value: current === undefined || current === null ? '' : String(current),
        onChange: event => onDraft(field.key, event.target.value),
        disabled,
      })
    }

    // 把 **强调** 片段渲染成 <strong>，供说明文字在保持单条文案的同时加粗关键词。
    function richText(value) {
      return String(value).split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => part.startsWith('**') && part.endsWith('**')
        ? h('strong', { key: index }, part.slice(2, -2))
        : part)
    }

    function formatTime(iso) {
      if (typeof iso !== 'string' || iso === '') return ''
      try {
        return new Date(iso).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      } catch { return iso }
    }

    // 三个清单共用的统计条与筛选胶囊；直接返回节点，保持列表卡片的同一套视觉语言。
    function statStrip(items) {
      return h('div', { className: 'pa-stat-strip' },
        items.map(item => h('div', { className: 'pa-stat', key: item.key ?? item.label },
          h('span', { className: 'pa-stat-value' }, item.value),
          h('span', { className: 'pa-stat-label' }, item.label),
        )),
      )
    }

    /**
     * 统一的自定义下拉：原生 select 的展开面板由系统绘制，无法做圆角/毛玻璃；
     * 这里用按钮 + 浮层面板替代，键盘（↑↓/Home/End/Enter/Esc）与点击外部关闭都支持。
     * @param props - { value, onChange, options?, groups?, icon?, tone?, disabled?, ariaLabel?, className?, placeholder? }
     */
    /**
     * 知识库「全部展开」的判定：所有行都展开，且没有任何分组处于折叠态。
     * 分组头与全局按钮共用同一套语义，避免出现“按钮说已展开、组却收着”的矛盾状态。
     */
    function knowledgeAllExpanded(rowIds, groupTokens, expanded, collapsedGroups) {
      if (!Array.isArray(rowIds) || rowIds.length === 0) return false
      if (rowIds.some(id => !expanded.has(id))) return false
      return (groupTokens ?? []).every(token => !collapsedGroups.has(token))
    }

    function PaSelect({ value, onChange, options, groups, icon, tone, disabled, ariaLabel, className, placeholder }) {
      const [open, setOpen] = useState(false)
      const [active, setActive] = useState(-1)
      const rootRef = useRef(null)
      const flat = groups && groups.length
        ? groups.flatMap(group => group.options.map(option => ({ ...option, group: group.label })))
        : (options ?? [])
      const current = flat.find(option => option.value === value)
      const close = () => { setOpen(false); setActive(-1) }
      const commit = index => {
        const option = flat[index]
        if (!option) return
        onChange(option.value)
        close()
      }
      const openList = () => {
        if (disabled) return
        setOpen(true)
        setActive(Math.max(0, flat.findIndex(option => option.value === value)))
      }
      // 点击外部关闭
      useEffect(() => {
        if (!open) return undefined
        const onPointerDown = event => {
          if (rootRef.current && !rootRef.current.contains(event.target)) close()
        }
        document.addEventListener('pointerdown', onPointerDown, true)
        return () => document.removeEventListener('pointerdown', onPointerDown, true)
      }, [open])
      // 展开方向：下方空间不足时翻到上方，避免面板超出视口底边
      useLayoutEffect(() => {
        if (!open) return
        const panel = rootRef.current?.querySelector('.pa-select-panel')
        if (!panel) return
        const rect = rootRef.current.getBoundingClientRect()
        const below = window.innerHeight - rect.bottom
        panel.classList.toggle('pa-select-panel--up', below < panel.offsetHeight + 12 && rect.top > panel.offsetHeight + 12)
      })
      const onKeyDown = event => {
        if (event.key === 'Escape') { if (open) { event.preventDefault(); close() } return }
        if (!open) {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openList() }
          return
        }
        if (event.key === 'ArrowDown') { event.preventDefault(); setActive(index => Math.min(flat.length - 1, index + 1)) }
        else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(index => Math.max(0, index - 1)) }
        else if (event.key === 'Home') { event.preventDefault(); setActive(0) }
        else if (event.key === 'End') { event.preventDefault(); setActive(flat.length - 1) }
        else if (event.key === 'Enter') { event.preventDefault(); commit(active) }
        else if (event.key === 'Tab') close()
      }
      const renderOption = option => {
        const index = flat.findIndex(item => item.value === option.value)
        const selected = option.value === value
        return h('div', {
          key: String(option.value),
          className: `pa-select-option${selected ? ' pa-select-option--on' : ''}${index === active ? ' pa-select-option--active' : ''}`,
          role: 'option',
          'aria-selected': selected ? 'true' : 'false',
          onPointerEnter: () => setActive(index),
          onClick: () => commit(index),
        },
        option.icon ? h('span', { className: 'pa-select-option-icon', 'aria-hidden': 'true' }, option.icon) : null,
        h('span', { className: 'pa-select-option-label' }, option.label),
        selected ? h('span', { className: 'pa-select-check', 'aria-hidden': 'true' }, '✓') : null,
        )
      }
      return h('div', { className: `pa-select${className ? ` ${className}` : ''}`, ref: rootRef },
        h('button', {
          className: 'pa-select-trigger',
          type: 'button',
          disabled,
          'aria-haspopup': 'listbox',
          'aria-expanded': open ? 'true' : 'false',
          'aria-label': ariaLabel,
          onClick: () => (open ? close() : openList()),
          onKeyDown,
        },
        icon ? h('span', { className: 'pa-select-icon', style: tone ? { color: tone } : undefined, 'aria-hidden': 'true' }, icon) : null,
        h('span', { className: 'pa-select-value' }, current ? current.label : (placeholder ?? '')),
        h('span', { className: 'pa-select-caret', 'aria-hidden': 'true' }, '▾'),
        ),
        open ? h('div', { className: 'pa-select-panel', role: 'listbox', 'aria-label': ariaLabel },
          groups && groups.length
            ? groups.flatMap((group, groupIndex) => [
              h('div', { className: 'pa-select-group', key: `group-${groupIndex}` }, group.label),
              ...group.options.map(renderOption),
            ])
            : flat.map(renderOption),
        ) : null,
      )
    }

    const KNOWLEDGE_GENRE_ORDER = ['教学', '攻略', '资源库', '评测', '案例', '观点', '资讯', '工具']
    const KNOWLEDGE_GENRE_TONES = {
      '教学': '#6366f1', '攻略': '#10b981', '资源库': '#0ea5e9', '评测': '#f59e0b',
      '案例': '#f43f5e', '观点': '#a855f7', '资讯': '#06b6d4', '工具': '#64748b',
    }
    const KNOWLEDGE_FALLBACK_TONE = '#2f4c8f'

    function confidenceMeter(value, tone, label) {
      const numeric = typeof value === 'number' && Number.isFinite(value) ? value : null
      const filled = numeric === null ? 0 : Math.max(1, Math.min(5, Math.round(numeric * 5)))
      return h('span', {
        className: 'pa-pref-conf',
        style: tone ? { '--pref-tone': tone } : undefined,
        'data-pa-tip': numeric === null ? label : `${label} ${numeric.toFixed(2)}`,
      },
      Array.from({ length: 5 }, (_, index) => h('span', {
        key: index,
        className: `pa-pref-conf-seg${index < filled ? ' pa-pref-conf-seg--on' : ''}`,
      })),
      numeric === null ? null : h('span', { className: 'pa-pref-conf-text' }, numeric.toFixed(2)),
      )
    }

    function filterPills(items, value, onChange) {
      return h('div', { className: 'pa-filter-pills' },
        items.map(item => h('button', {
          key: item.key,
          type: 'button',
          className: `pa-filter${value === item.key ? ' pa-filter--on' : ''}`,
          onClick: () => onChange(item.key),
        }, item.count === undefined ? item.label : `${item.label} ${item.count}`)),
      )
    }

    // star.svg 造型（圆角金星）11 段路径，金色立体渐变由各段自带 fill 保留。
    const STAR_PATHS = [
      { d: 'M476.612 39.856a41.468 41.468 0 0 1 70.776 0l139.708 228.812a3.612 3.612 0 0 0 2.22 1.612l260.784 62.164a41.46 41.46 0 0 1 21.872 67.308l-174.44 203.58a3.54 3.54 0 0 0-0.848 2.608l21.464 267.232a41.468 41.468 0 0 1-57.256 41.6l-247.52-102.992a3.588 3.588 0 0 0-2.744 0l-247.52 102.992a41.464 41.464 0 0 1-57.256-41.6l21.464-267.232a3.552 3.552 0 0 0-0.848-2.608l-174.44-203.58a41.464 41.464 0 0 1 21.872-67.308L334.684 270.28a3.612 3.612 0 0 0 2.22-1.612l139.708-228.812z', fill: '#FFD677' },
      { d: 'M511.712 20v491.6L334.224 270.388l0.46-0.108a3.612 3.612 0 0 0 2.22-1.612l139.708-228.812A41.464 41.464 0 0 1 511.712 20z', fill: '#FFD677' },
      { d: 'M226.58 603.472a3.432 3.432 0 0 0-0.112-0.14l-174.44-203.58a41.456 41.456 0 0 1-8.596-37.584l468.28 149.432-285.132 91.872z', fill: '#FFE387' },
      { d: 'M223.176 910.3l-0.368-0.264a41.468 41.468 0 0 1-16.956-36.864l21.464-267.232a3.552 3.552 0 0 0-0.736-2.468l285.132-91.872-288.536 398.7z', fill: '#FFBF51' },
      { d: 'M512.608 811.56a3.588 3.588 0 0 0-1.98 0.22l-247.52 102.992a41.448 41.448 0 0 1-39.932-4.472l288.536-398.7 0.896 299.96z', fill: '#FFC97D' },
      { d: 'M800.576 910.476a41.464 41.464 0 0 1-39.684 4.296l-247.52-102.992a3.468 3.468 0 0 0-0.764-0.22l-0.896-299.96 288.864 398.876z', fill: '#FFAB5B' },
      { d: 'M796.756 604.896a3.512 3.512 0 0 0-0.072 1.044l21.464 267.232a41.468 41.468 0 0 1-16.956 36.864l-0.04 0.028-289.44-398.464 285.044 93.296z', fill: '#FFC76D' },
      { d: 'M979.412 358.492a41.464 41.464 0 0 1-7.44 41.26l-174.44 203.58a3.54 3.54 0 0 0-0.684 1.22l-0.052 0.172-285.084-93.124 467.7-153.108z', fill: '#FFBE51' },
      { d: 'M687.46 269.16a3.612 3.612 0 0 0 1.856 1.12l260.784 62.164a41.464 41.464 0 0 1 29.308 26.036L511.712 511.6l175.748-242.44z', fill: '#FFD684' },
      { d: 'M687.404 269.096L511.712 511.6V20H512c14.448 0 27.856 7.524 35.388 19.856l139.708 228.812a3.992 3.992 0 0 0 0.308 0.428z', fill: '#FFAB5B' },
      { d: 'M43.432 362.168a41.46 41.46 0 0 1 30.468-29.724l260.324-62.056 177.488 241.212-468.28-149.432z', fill: '#FFF9E7' },
    ]

    // 星体几何：viewBox 1024，中心 (512,512)，外角半径约 492（-90+72n°），
    // 内凹顶点半径约 300（-54+72n°）。星的 1/5 瓣 k（顶部起顺时针）=
    // (中心, 内凹 k-1, 外角 k, 内凹 k)，五瓣并集 = 整颗星。
    function starSlice(k) {
      const cx = 512
      const cy = 512
      const outer = 492
      const inner = 300
      const angle = (base, n) => ((base + 72 * n) * Math.PI) / 180
      const point = (radius, theta) => [cx + radius * Math.cos(theta), cy + radius * Math.sin(theta)]
      return [...point(inner, angle(-54, (k + 4) % 5)), ...point(outer, angle(-90, k)), ...point(inner, angle(-54, k))]
    }

    // 挖角 mask：未点亮（k >= stars）的 1/5 瓣涂黑以抹去颜色，点亮瓣保留金色。
    function StarMask({ id, stars }) {
      const blacks = []
      for (let k = 0; k < 5; k += 1) {
        if (k >= stars) {
          const [ax, ay, bx, by, cx2, cy2] = starSlice(k)
          blacks.push(h('polygon', {
            key: k,
            points: `512,512 ${ax.toFixed(2)},${ay.toFixed(2)} ${bx.toFixed(2)},${by.toFixed(2)} ${cx2.toFixed(2)},${cy2.toFixed(2)}`,
            fill: '#000',
          }))
        }
      }
      return h('mask', { id, maskContentUnits: 'userSpaceOnUse' },
        h('rect', { x: 0, y: 0, width: 1024, height: 1024, fill: '#fff' }),
        blacks,
      )
    }

    // 未收藏的空心星：与实心星共用外角/内凹半径，只描边不填充。
    // 描边按屏幕像素折算回 1024 视窗，并整体内缩半个描边宽度 ——
    // 这样空心星外缘与实心星外缘重合，描边也不会被视窗裁掉。
    const STAR_OUTLINE_STROKE_PX = 1.5
    function starOutlinePath(size) {
      const strokeWidth = (STAR_OUTLINE_STROKE_PX * 1024) / size
      const outer = 492 - strokeWidth / 2
      const inner = (300 * outer) / 492
      const points = []
      for (let k = 0; k < 10; k += 1) {
        const radius = k % 2 === 0 ? outer : inner
        const theta = ((-90 + 36 * k) * Math.PI) / 180
        points.push(`${(512 + radius * Math.cos(theta)).toFixed(2)},${(512 + radius * Math.sin(theta)).toFixed(2)}`)
      }
      return { d: `M${points.join('L')}Z`, strokeWidth: Number(strokeWidth.toFixed(2)) }
    }

    // 收藏星：stars 0 = 灰色空心星（未收藏的入口）；1–5 = star.svg 金星，
    // 顶部起顺时针点亮 n 个角，未点亮角抹去颜色（透明）。
    function CornerStar({ stars, size = 16 }) {
      const [maskId] = useState(() => `pa-star-mask-${Math.random().toString(36).slice(2, 10)}`)
      const gray = stars < 1
      const outline = gray ? starOutlinePath(size) : null
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 1024 1024',
        className: 'pa-star',
        'aria-hidden': true,
      },
      gray
        ? h('path', {
          d: outline.d,
          strokeWidth: outline.strokeWidth,
          className: 'pa-star-outline',
        })
        : [
          h(StarMask, { key: 'mask', id: maskId, stars }),
          ...STAR_PATHS.map((path, index) => h('path', {
            key: index,
            d: path.d,
            fill: path.fill,
            mask: `url(#${maskId})`,
          })),
        ])
    }

    function StarGlyph({ filled, size = 16 }) {
      return h(CornerStar, { stars: filled ? 5 : 0, size })
    }

    // 采集预算：与宿主 plugin.js 的 FAVORITE_LIMITS 同源（宿主会再按 token 校验一次并拒绝超限）。
    // token 估算系数由本机 3090 条真实模型输出回归得到（tokens ≈ 0.829×CJK 字符 + 0.2514×其他字符）
    // —— 按字符数设限在中文长回复下浪费预算、在英文长回复下截得过狠，因此按估算 token 截断。
    const TOKENS_PER_CJK_CHAR = 0.829
    const TOKENS_PER_OTHER_CHAR = 0.2514
    const FAVORITE_LIMITS = { questionTokens: 1024, replyTokens: 2048, processTokens: 16384, toolNames: 32, fileNames: 12, noteChars: 800 }
    const MAX_FAVORITE_REPLY_CHARS = 4 * FAVORITE_LIMITS.replyTokens
    const CJK_CHAR = /[\u3400-\u9fff\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/g

    function estimateTokens(value) {
      if (!value) return 0
      const cjk = (value.match(CJK_CHAR) ?? []).length
      const total = Array.from(value).length
      return TOKENS_PER_CJK_CHAR * cjk + TOKENS_PER_OTHER_CHAR * (total - cjk)
    }

    // 折叠空白但保留换行：思考与回复的段落、列表、代码块结构本身就是解析要用的信息。
    function normalizeCaptured(value) {
      return String(value ?? '')
        .replace(/\r\n?/g, '\n')
        .replace(/[ \t\u00a0]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    }

    // 按估算 token 截断：先按比例粗切，再逐步回退到预算内，避免把长回复截得过短或超限。
    function clampTokens(value, budget) {
      if (!value) return ''
      if (estimateTokens(value) <= budget) return value
      const points = Array.from(value)
      let cut = Math.floor((points.length * budget) / estimateTokens(value))
      while (cut > 0 && estimateTokens(points.slice(0, cut).join('')) > budget) {
        cut -= Math.max(1, Math.floor(cut * 0.02))
      }
      return points.slice(0, Math.max(0, cut)).join('').trimEnd()
    }

    function basenameOf(value) {
      const path = String(value ?? '').trim()
      if (path === '') return ''
      const parts = path.split(/[\\/]/)
      return parts[parts.length - 1] || ''
    }

    // 交付文件只留文件名：本轮交付（present）与产出（write/edit）的文件名 + 回复里的图片附件名，
    // 既不记路径也不记内容（ui-deliverables 未挂载时该轮数据不存在，自动跳过）。
    function capturedFileNames(snapshot, turn, closing) {
      const names = []
      const push = value => {
        const name = basenameOf(value)
        if (name && !names.includes(name) && names.length < FAVORITE_LIMITS.fileNames) names.push(name)
      }
      const deliverables = snapshot.timeline?.turns?.get?.(turn)?.data?.get?.('deliverables')
      for (const file of deliverables?.presented ?? []) push(file?.path)
      for (const file of deliverables?.produced ?? []) push(file?.path)
      for (const block of closing?.blocks ?? []) if (block?.kind === 'image') push(block.attachment?.name)
      return names
    }

    const EMPTY_TURN = { reply: '', question: '', process: '', turn: null, fileNames: [] }

    // 从会话快照抓取该轮完整信息：用户提问、整轮执行与思考过程、最终输出、交付文件名、轮次。
    // 抽成纯函数以便单测（输入是 useChat 提供的 ChatSnapshot）；匹配不到该轮时返回空值。
    function captureTurn(snapshot, messageId) {
      for (const node of snapshot.nodes.values()) {
        const closing = node.kind === 'turn-tail' ? node.data?.closing : undefined
        if (closing?.finalNode?.messageId !== messageId) continue
        const turn = node.data.turn
        const keys = snapshot.locations.getTurn(turn)
        const reply = (closing.blocks ?? []).filter(block => block.kind === 'text').map(block => block.text).join('')
        // 整轮过程概述：该轮所有助手步骤的思考按 step 顺序拼接 + 工具调用序列。
        // 只记录工具名与顺序，不记录参数与执行结果（避免把命令、路径、正文带进知识库）。
        // 早期版本只读 closing 消息自身的块，而工具调用都在更早的 step 里，工具序列因此恒为空。
        const steps = []
        for (const key of keys) {
          const peer = snapshot.nodes.get(key)
          if (peer?.kind === 'assistant-step' && peer.data) steps.push(peer.data)
        }
        steps.sort((left, right) => (left.step ?? 0) - (right.step ?? 0))
        const reasoning = steps
          .map(data => (data.blocks ?? []).filter(block => block.kind === 'reasoning').map(block => block.text || '').join(''))
          .filter(chunk => chunk.trim() !== '')
          .join('\n\n')
        const toolNames = []
        outer: for (const data of steps) {
          for (const block of data.blocks ?? []) {
            if (block.kind !== 'tool-call') continue
            const name = String(block.name || '').trim()
            if (name && toolNames[toolNames.length - 1] !== name) toolNames.push(name)
            if (toolNames.length >= FAVORITE_LIMITS.toolNames) break outer
          }
        }
        const process = [
          reasoning ? `思考：\n${reasoning}` : '',
          toolNames.length > 0 ? `工具：${toolNames.join(' → ')}` : '',
        ].filter(Boolean).join('\n')
        const fileNames = capturedFileNames(snapshot, turn, closing)
        let question = ''
        for (const key of keys) {
          const peer = snapshot.nodes.get(key)
          if ((peer?.kind === 'user' || peer?.kind === 'steering') && Array.isArray(peer.data?.content)) {
            question = peer.data.content.filter(block => block?.type === 'text').map(block => block.text).join('')
            break
          }
        }
        // 轮次：该轮在时间线里的位置（1 起），取自导航索引（按 timeline 顺序）。
        const items = snapshot.navigation?.items?.() ?? []
        const index = items.findIndex(item => item.turn === turn)
        return { reply, question, process, turn: index >= 0 ? index + 1 : null, fileNames }
      }
      return EMPTY_TURN
    }

    function captureMessageSnapshot(anchor) {
      if (!anchor || typeof anchor.parentElement !== 'object') return ''
      let el = anchor.parentElement
      let best = ''
      const ceiling = MAX_FAVORITE_REPLY_CHARS
      for (let depth = 0; depth < 10 && el; depth += 1, el = el.parentElement) {
        // 克隆后剔除收藏浮窗（标题/提示/备注/按钮），避免把浮窗文案混入对话内容。
        const clone = el.cloneNode(true)
        for (const node of Array.from(clone.querySelectorAll('.pa-fav-pop, .pa-fav-backdrop'))) node.remove()
        const text = (clone.textContent || '').trim()
        if (text.length >= ceiling) break
        if (text.length > best.length) best = text
      }
      return best.slice(0, ceiling)
    }

    function shortId(value) {
      return typeof value === 'string' && value.length > 12 ? `${value.slice(0, 12)}…` : String(value)
    }

    function favStatusLabel(status) {
      const key = { pending: 'favStatusPending', analyzing: 'favStatusAnalyzing', analyzed: 'favStatusAnalyzed', failed: 'favStatusFailed', skipped: 'favStatusSkipped' }[status]
      return key ? t(key) : status
    }

    // 知识类别（kind）的中文标签；未知值回退原样显示，保证旧数据不空白。
    const KIND_LABEL_KEYS = {
      entity: 'kindEntity', event: 'kindEvent', state: 'kindState', observation: 'kindObservation',
      pattern: 'kindPattern', goal: 'kindGoal', decision: 'kindDecision', commitment: 'kindCommitment',
      artifact: 'kindArtifact', relation: 'kindRelation', rule: 'kindRule', hypothesis: 'kindHypothesis',
    }
    function kindLabel(kind) {
      const key = KIND_LABEL_KEYS[kind]
      return key ? t(key) : String(kind ?? '')
    }

    // 12 类 kind 的说明与家族：说明用于行内浮窗，家族用于筛选下拉分组。
    const KIND_HELP_KEYS = {
      entity: 'kindHelpEntity', event: 'kindHelpEvent', state: 'kindHelpState', observation: 'kindHelpObservation',
      pattern: 'kindHelpPattern', goal: 'kindHelpGoal', decision: 'kindHelpDecision', commitment: 'kindHelpCommitment',
      artifact: 'kindHelpArtifact', relation: 'kindHelpRelation', rule: 'kindHelpRule', hypothesis: 'kindHelpHypothesis',
    }
    // kind 的“属性”色调按 4 个家族分配：事实蓝、方法绿、意向橙、资产紫。
    const KIND_TONES = {
      entity: '#3b82f6', event: '#3b82f6', state: '#3b82f6', observation: '#3b82f6',
      pattern: '#10b981', rule: '#10b981',
      goal: '#f59e0b', decision: '#f59e0b', commitment: '#f59e0b',
      artifact: '#8b5cf6', relation: '#8b5cf6', hypothesis: '#8b5cf6',
    }
    const KIND_FAMILIES = [
      { key: 'facts', labelKey: 'kindFamilyFacts', kinds: ['entity', 'event', 'state', 'observation'] },
      { key: 'methods', labelKey: 'kindFamilyMethods', kinds: ['pattern', 'rule'] },
      { key: 'intent', labelKey: 'kindFamilyIntent', kinds: ['goal', 'decision', 'commitment'] },
      { key: 'assets', labelKey: 'kindFamilyAssets', kinds: ['artifact', 'relation', 'hypothesis'] },
    ]

    // 12 类 kind 的线性 SVG 图标（24×24，stroke 继承 currentColor），避免组头用「方块+单字」。
    const KIND_ICON_PATHS = {
      entity: ['M12 2.8 20 7v10l-8 4.2L4 17V7z', 'M4 7l8 4.2L20 7', 'M12 11.2v10'],
      event: ['M5 5.5h14v14H5z', 'M8 3.5v4', 'M16 3.5v4', 'M5 9.5h14', 'M12 13.5h.01'],
      state: ['M2.5 12h4l2.5-6 4 12 2.5-6H21.5'],
      observation: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
      pattern: ['M4 4.5h5v5H4z', 'M15 4.5h5v5h-5z', 'M9.5 16h5v5h-5z', 'M9 7h6', 'M12 9.5V16'],
      goal: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z', 'M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'],
      decision: ['M5 20V4', 'M5 12h5a4 4 0 0 0 4-4V4', 'M5 12h5a4 4 0 0 1 4 4v4'],
      commitment: ['M12 3l7 2.8v5.7c0 4.2-3 7.2-7 8.5-4-1.3-7-4.3-7-8.5V5.8z', 'M8.8 11.8l2.2 2.2 4.2-4.2'],
      artifact: ['M6 3.5h8l4 4v13H6z', 'M14 3.5v4h4', 'M9 12h6', 'M9 15.5h6', 'M9 19h4'],
      relation: ['M9.5 8H7a4 4 0 0 0 0 8h2.5', 'M14.5 8H17a4 4 0 0 1 0 8h-2.5', 'M8.5 12h7'],
      rule: ['M4 5.5h7.5v14H4z', 'M12.5 5.5H20v14h-7.5z', 'M12 5.5v14'],
      hypothesis: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M9.5 9.2a2.6 2.6 0 1 1 4.1 2.1c-.8.6-1.6 1.2-1.6 2.4', 'M12 16.8h.01'],
      unknown: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 8v5', 'M12 16h.01'],
    }
    const TAG_ICON_PATHS = ['M3.5 12.5V4h8.5l8 8-8.5 8.5z', 'M7.5 7.5h.01']

    // 13 类偏好领域的线性 SVG 图标（24×24，stroke 继承 currentColor）：
    // 8 个核心领域在前，4 个按需领域随后，other 兜底；未知分类回退到 other。
    const PREF_CATEGORY_ICON_PATHS = {
      travel: ['M12 2.5c.9 0 1.6.7 1.6 1.6v4.6l6.4 3.7v2.1l-6.4-2v4.2l2.1 1.6v1.7L12 19l-3.7 1v-1.7l2.1-1.6v-4.2l-6.4 2v-2.1l6.4-3.7V4.1c0-.9.7-1.6 1.6-1.6z'],
      food: ['M6 3v5a2.5 2.5 0 0 0 5 0V3', 'M8.5 3v5', 'M8.5 8V21', 'M16.5 3c-1.6 2.1-2.4 4.3-2.4 6.6V13H18V3z', 'M16.5 13v8'],
      schedule: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7.2V12l3.2 2'],
      communication: ['M5 5h14v9.5H9.5L5 18.5z', 'M8.5 9.75h.01', 'M12 9.75h.01', 'M15.5 9.75h.01'],
      work: ['M4 8h16v11H4z', 'M9 8V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V8', 'M4 12.5h16', 'M10.5 12.5h3'],
      health: ['M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z'],
      finance: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M8.5 8 12 11.5 15.5 8', 'M12 11.5V17', 'M9 13.5h6', 'M9 16h6'],
      clothing: ['M8.5 4.5 4.5 6.6l1.6 3.7 2.4-1V20h7V9.3l2.4 1 1.6-3.7-4-2.1', 'M9.5 4.5a2.5 2.5 0 0 0 5 0'],
      sports: ['M4 9.5v5', 'M7 7v10', 'M17 7v10', 'M20 9.5v5', 'M7 12h10'],
      media: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M10 8.5 16 12l-6 3.5z'],
      learning: ['M12 4 2.8 8.4 12 12.8l9.2-4.4z', 'M6.5 10.5v4.3c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-4.3', 'M21.2 8.4v5.2'],
      shopping: ['M5.2 8h13.6l-1.1 12H6.3z', 'M9 8V5.8A3 3 0 0 1 12 3a3 3 0 0 1 3 2.8V8'],
      other: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M8.2 12h.01', 'M12 12h.01', 'M15.8 12h.01'],
    }

    function lineIcon(paths, size, className) {
      return h('svg', {
        className: `pa-line-icon${className ? ` ${className}` : ''}`,
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: size <= 14 ? 2.1 : 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
        focusable: 'false',
      }, paths.map((d, index) => h('path', { key: index, d })))
    }
    function kindIcon(kind, size = 18) {
      return lineIcon(KIND_ICON_PATHS[kind] ?? KIND_ICON_PATHS.unknown, size, 'pa-kind-icon')
    }
    function tagIcon(size = 18) {
      return lineIcon(TAG_ICON_PATHS, size, 'pa-tag-icon')
    }
    function prefCategoryIcon(category, size = 18) {
      const known = PREF_CATEGORY_ICON_PATHS[category] !== undefined
      return lineIcon(PREF_CATEGORY_ICON_PATHS[category] ?? PREF_CATEGORY_ICON_PATHS.other, size, `pa-pref-category-icon pa-pref-category-icon--${known ? category : 'other'}`)
    }

    // 收藏解析要求 content 按所选原因的内容骨架分段（如「执行步骤：…」）。这些分段名的集合
    // 与宿主 FAVORITE_REASON_META.contentGuide 一一对应；命中时界面上把分段名渲染成小标签。
    const KNOWLEDGE_SEGMENT_LABELS = new Set(['适用场景', '执行步骤', '取舍与理由', '边界', '要求与约束', '如何满足', '验收标准', '要复用的表达', '具体写法', '反例', '产物', '用法与边界', '触发场景', '处理套路', '错误表现', '原因', '正确做法', '偏好内容', '适用范围与依据', '思路框架', '为什么有效', '可迁移点'])
    const KNOWLEDGE_SEGMENT_PATTERN = /^\s*([\u4e00-\u9fa5]{2,9})\s*[:：]\s*([\s\S]*)$/

    /**
     * 把知识正文拆成「分段行 / 普通行」。没有任何分段标签时返回 null，交由调用方按纯文本渲染，
     * 保证旧知识（自由文本）显示完全不变。
     */
    function knowledgeContentLines(content) {
      const lines = String(content ?? '').split('\n')
      const parsed = lines.map(line => {
        const hit = line.match(KNOWLEDGE_SEGMENT_PATTERN)
        if (hit && KNOWLEDGE_SEGMENT_LABELS.has(hit[1])) return { segment: hit[1], text: hit[2] }
        return { text: line }
      })
      return parsed.some(item => item.segment) ? parsed : null
    }

    // 与宿主 PROCESS_REASONS 对齐：这些收藏原因会把执行过程（思考 + 工具顺序）纳入解析。
    const PROCESS_REASON_KEYS = ['instruction', 'recurring', 'process', 'correction', 'spark']
    const MAX_FAVORITE_REASONS = 2
    const FAVORITE_REASON_KEYS = ['instruction', 'expression', 'output', 'recurring', 'process', 'correction', 'preference', 'spark']

    function favReasonLabel(reason) {
      const key = {
        instruction: 'favReasonInstruction', expression: 'favReasonExpression', output: 'favReasonOutput',
        recurring: 'favReasonRecurring', process: 'favReasonProcess', correction: 'favReasonCorrection',
        preference: 'favReasonPreference', spark: 'favReasonSpark',
      }[reason]
      return key ? t(key) : reason
    }

    // 原因的标签/映射提示/案例以宿主快照（favoriteReasons）为唯一来源，界面不再维护第二份文案；
    // 只有 8 个短标签保留本地兜底，保证快照尚未到达时也能渲染。
    const REASON_LABEL_KEYS = {
      instruction: 'favReasonInstruction', expression: 'favReasonExpression', output: 'favReasonOutput',
      recurring: 'favReasonRecurring', process: 'favReasonProcess', correction: 'favReasonCorrection',
      preference: 'favReasonPreference', spark: 'favReasonSpark',
    }
    function reasonField(reasonMeta, reason, field) {
      const list = Array.isArray(reasonMeta) ? reasonMeta : []
      const entry = list.find(item => item && item.key === reason)
      if (!entry) return ''
      const english = currentLocale() === 'en'
      const value = english ? (entry[`${field}En`] ?? entry[field]) : entry[field]
      return typeof value === 'string' ? value : ''
    }
    function favReasonLabel(reason, reasonMeta) {
      return reasonField(reasonMeta, reason, 'label') || (REASON_LABEL_KEYS[reason] ? t(REASON_LABEL_KEYS[reason]) : reason)
    }
    // 悬停说明：这个原因通常会被解析成哪些知识属性/偏好分类（候选，不是绑定）。
    function favReasonHint(reason, reasonMeta) {
      return reasonField(reasonMeta, reason, 'hint')
    }
    // 悬停说明里的示例：与宿主提示词中的案例同源，方便对照“这条原因会产出什么”。
    function favReasonExample(reason, reasonMeta) {
      return reasonField(reasonMeta, reason, 'example')
    }

    // 每个会话一个收藏控制器：懒加载一次、本地缓存、变更通知订阅。
    const favoriteControllers = new Map()

    function favoriteController(sessionId) {
      let controller = favoriteControllers.get(sessionId)
      if (!controller) {
        const listeners = new Set()
        const items = new Map()
        controller = {
          loaded: false,
          loading: false,
          items,
          listeners,
          async ensure() {
            if (controller.loaded || controller.loading || !sessionId) return
            controller.loading = true
            try {
              const body = await postPanelAction({ type: 'favorites.list', sessionId })
              items.clear()
              for (const favorite of body.favorites?.favorites ?? []) items.set(favorite.messageId, favorite)
              controller.reasonMeta = Array.isArray(body.favoriteReasons) ? body.favoriteReasons : controller.reasonMeta
              controller.loaded = true
              controller.notify()
            } catch { /* 保持未加载；下次交互再试。 */ }
            controller.loading = false
          },
          applyFavorite(favorite) {
            items.set(favorite.messageId, favorite)
            controller.notify()
          },
          removeFavorite(messageId) {
            items.delete(messageId)
            controller.notify()
          },
          notify() {
            for (const listener of listeners) {
              try { listener() } catch { /* 忽略单个监听器异常。 */ }
            }
          },
        }
        favoriteControllers.set(sessionId, controller)
      }
      return controller
    }

    /**
     * 标签说明卡/上限提示的定位：默认出现在载体下方并与载体左边缘对齐；
     * 仅当下方空间不够时翻到上方（同样左对齐），再按视口做水平 clamp。
     */
    function placeReasonTip(tip, anchor) {
      if (!tip || !anchor) return
      const rect = tip.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const fitsBelow = anchor.bottom + 8 + rect.height <= vh - 8
      tip.style.left = `${Math.max(8, Math.min(anchor.left, vw - rect.width - 8))}px`
      tip.style.transform = 'none'
      tip.style.top = fitsBelow
        ? `${anchor.bottom + 8}px`
        : `${Math.max(8, Math.min(anchor.top - rect.height - 8, vh - rect.height - 8))}px`
      tip.style.opacity = '1'
    }

    /** 元素当前视口位置，作为说明卡的锚点。 */
    function anchorRectOf(element) {
      const rect = element.getBoundingClientRect()
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height, bottom: rect.bottom }
    }

    // 收藏浮窗：星级（1–5）+ 收藏原因 + 备注 + 保存/移除/取消。
    // 由消息栏星标（StarEntry）与设置页收藏夹（FavoritesCard）共用。
    // submit 执行写操作并返回响应（消息栏走 postPanelAction，设置页走 onAction 以刷新快照）。
    function FavoritePop({ sessionId, messageId, favorite, position, snapshotText, questionText, processText, turnText, reasonMeta, submit, onSaved, onRemoved, onClose }) {
      const [draft, setDraft] = useState(favorite?.stars ?? 0)
      const [hover, setHover] = useState(0)
      const [note, setNote] = useState(favorite?.note ?? '')
      const [reasons, setReasons] = useState(() => (Array.isArray(favorite?.reasons) ? favorite.reasons : []))
      const [saving, setSaving] = useState(false)
      const [reasonTip, setReasonTip] = useState(null)
      const [limitNotice, setLimitNotice] = useState(null)
      const popRef = useRef(null)
      const reasonTipRef = useRef(null)
      const limitNoticeRef = useRef(null)
      const limitTimer = useRef(null)

      // 浮窗不超出视口：渲染后按实际尺寸把位置整体 clamp 进页面边框，
      // 避免底部/右侧越界导致分类与备注无法操作。
      useLayoutEffect(() => {
        const pop = popRef.current
        if (!pop) return
        const rect = pop.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight
        const left = Math.max(8, Math.min(rect.left, vw - rect.width - 8))
        const top = Math.max(8, Math.min(rect.top, vh - rect.height - 8))
        if (left !== rect.left || top !== rect.top) {
          pop.style.left = `${left}px`
          pop.style.top = `${top}px`
        }
      })

      // 原因说明浮窗与「选满 2 个」提示共用同一套定位：按实际尺寸测量后再摆放。
      useLayoutEffect(() => { placeReasonTip(reasonTipRef.current, reasonTip?.anchor) })
      useLayoutEffect(() => { placeReasonTip(limitNoticeRef.current, limitNotice?.anchor) })
      // 上限提示 1.8 秒后自动消失；关闭浮窗时清掉定时器，避免遗留状态。
      useEffect(() => () => { if (limitTimer.current) clearTimeout(limitTimer.current) }, [])
      const flashReasonLimit = anchor => {
        if (limitTimer.current) clearTimeout(limitTimer.current)
        setLimitNotice({ anchor })
        limitTimer.current = setTimeout(() => setLimitNotice(null), 1800)
      }

      const save = async () => {
        if (draft < 1) return
        setSaving(true)
        try {
          const updated = await submit({
            type: 'favorites.add',
            sessionId,
            messageId,
            stars: draft,
            reasons,
            note: note.trim(),
            ...(snapshotText ? { snapshot: snapshotText } : {}),
            ...(questionText ? { question: questionText } : {}),
            ...(processText ? { process: processText } : {}),
            ...(typeof turnText === 'number' && turnText > 0 ? { turn: turnText } : {}),
          })
          onSaved(updated)
        } catch { /* submit 已上报错误信息。 */ }
        setSaving(false)
      }

      const remove = async () => {
        setSaving(true)
        try {
          await submit({ type: 'favorites.remove', sessionId, messageId })
          onRemoved()
        } catch { /* submit 已上报错误信息。 */ }
        setSaving(false)
      }

      return h('div', { className: 'pa-fav-backdrop', onClick: onClose },
        h('div', {
          ref: popRef,
          className: 'pa-fav-pop',
          style: { left: position.left - 280, top: position.top },
          role: 'dialog',
          'aria-label': favorite ? t('favStarActive', favorite.stars) : t('favPickerTitle'),
          onClick: event => event.stopPropagation(),
        },
        h('div', { className: 'pa-fav-head' },
          h('span', { className: 'pa-fav-head-icon' },
            h(CornerStar, { stars: draft || favorite?.stars || 0, size: 14 })),
          h('div', { className: 'pa-fav-title' }, favorite ? t('favStarActive', favorite.stars) : t('favPickerTitle')),
          h('button', {
            className: 'pa-fav-close',
            type: 'button',
            'aria-label': t('favCancel'),
            onClick: onClose,
          }, '✕'),
        ),
        h('div', { className: 'pa-fav-stars', role: 'radiogroup' },
          [1, 2, 3, 4, 5].map(index => {
            const active = index <= (hover || draft)
            return h('button', {
              key: index,
              className: `pa-fav-star-btn${active ? ' pa-fav-star-btn--on' : ''}`,
              type: 'button',
              role: 'radio',
              'aria-checked': draft === index ? 'true' : 'false',
              'aria-label': t('favStarN', index),
              onClick: () => setDraft(index),
              onMouseEnter: () => setHover(index),
              onMouseLeave: () => setHover(0),
            }, h(StarGlyph, { filled: active, size: 18 }))
          }),
        ),
        h('div', { className: 'pa-fav-hint' }, t('favPickerHint')),
        h('div', { className: 'pa-fav-cats', role: 'group', 'aria-label': t('favReasonHint') },
          FAVORITE_REASON_KEYS.map(key => {
            const active = reasons.includes(key)
            const label = favReasonLabel(key, reasonMeta)
            const description = favReasonHint(key, reasonMeta) || label
            // 达到上限后其余原因不可再选，但仍可悬停看说明（disabled 按钮不触发指针事件）。
            const blocked = !active && reasons.length >= MAX_FAVORITE_REASONS
            const showTip = event => setReasonTip({ reason: key, anchor: anchorRectOf(event.currentTarget) })
            return h('button', {
              key,
              className: `pa-fav-cat-btn${active ? ' pa-fav-cat-btn--on' : ''}`,
              type: 'button',
              'aria-pressed': active ? 'true' : 'false',
              'aria-disabled': blocked ? 'true' : undefined,
              'aria-label': description,
              onPointerEnter: showTip,
              onPointerLeave: () => setReasonTip(null),
              onFocus: showTip,
              onBlur: () => setReasonTip(null),
              onClick: event => {
                // 选满上限时点第三个：不写静态文案，只在这次点击上弹一条短提示。
                if (blocked) {
                  flashReasonLimit(anchorRectOf(event.currentTarget))
                  return
                }
                setReasons(previous => previous.includes(key)
                  ? previous.filter(item => item !== key)
                  : previous.length >= MAX_FAVORITE_REASONS ? previous : [...previous, key])
              },
            }, label)
          }),
        ),
        reasonTip ? h('div', {
          className: 'pa-tip-card pa-reason-tip',
          role: 'tooltip',
          ref: reasonTipRef,
          style: {
            left: `${reasonTip.anchor.left}px`,
            top: `${reasonTip.anchor.bottom + 8}px`,
            transform: 'none',
            opacity: 0,
          },
        },
        h('div', { className: 'pa-reason-tip-title' }, favReasonLabel(reasonTip.reason, reasonMeta)),
        (() => {
          const hint = favReasonHint(reasonTip.reason, reasonMeta)
          return hint ? h('div', { className: 'pa-reason-tip-desc' }, hint) : null
        })(),
        (() => {
          const example = favReasonExample(reasonTip.reason, reasonMeta)
          return example ? h('div', { className: 'pa-reason-tip-example' }, example) : null
        })(),
        h('div', { className: 'pa-reason-tip-scope' },
          h('span', { className: 'pa-reason-tip-dot', 'aria-hidden': 'true' }),
          PROCESS_REASON_KEYS.includes(reasonTip.reason) ? t('favReasonScopeProcess') : t('favReasonScopeResult'),
        ),
        ) : null,
        limitNotice ? h('div', {
          className: 'pa-tip-card pa-reason-tip pa-reason-tip--limit',
          role: 'status',
          ref: limitNoticeRef,
          style: {
            left: `${limitNotice.anchor.left}px`,
            top: `${limitNotice.anchor.bottom + 8}px`,
            transform: 'none',
            opacity: 0,
          },
        },
        h('div', { className: 'pa-reason-tip-title' }, t('favReasonLimit')),
        h('div', { className: 'pa-reason-tip-desc' }, t('favReasonLimitBody')),
        ) : null,
        h('div', { className: 'pa-fav-hint pa-fav-hint--cat' }, t('favReasonHint')),
        h('textarea', {
          className: 'pa-fav-note',
          'aria-label': t('favNote'),
          placeholder: t('favNote'),
          maxLength: FAVORITE_LIMITS.noteChars,
          value: note,
          onChange: event => setNote(event.target.value),
        }),
        h('div', { className: 'pa-fav-actions' },
          favorite ? h('button', {
            className: 'pa-fav-remove',
            type: 'button',
            disabled: saving,
            onClick: () => { void remove() },
          }, t('favRemove')) : null,
          h('button', {
            className: 'pa-fav-cancel',
            type: 'button',
            disabled: saving,
            onClick: onClose,
          }, t('favCancel')),
          h('button', {
            className: 'pa-fav-save',
            type: 'button',
            disabled: saving || draft < 1,
            onClick: () => { void save() },
          }, saving ? t('favSaving') : (favorite ? t('favUpdate') : t('favSave'))),
        ),
        ),
      )
    }

    function StarEntry(props) {
      const messageId = props.messageId
      const sessionId = typeof props.sessionId === 'string' && props.sessionId !== '' ? props.sessionId : null
      const [open, setOpen] = useState(false)
      const [position, setPosition] = useState(null)
      const [tip, setTip] = useState(null)
      const buttonRef = useRef(null)
      const [, force] = useState(0)
      const controller = favoriteController(sessionId ?? '')
      const useChat = typeof props.useChat === 'function' ? props.useChat : null

      useEffect(() => {
        const listener = () => force(value => value + 1)
        controller.listeners.add(listener)
        // 挂载即拉取本会话收藏，让重启/刷新后已收藏的星标立即可辨。
        void controller.ensure()
        return () => { controller.listeners.delete(listener) }
      }, [controller])

      if (!messageId || !sessionId) return null
      const favorite = controller.items.get(messageId)
      // 直接从会话快照按 messageId 取该轮对话（提问 + 整轮过程 + 最终输出 + 交付文件名）；
      // 快照不可用时回退 DOM 启发式（只有回复正文）。
      const turnText = useChat ? useChat(snapshot => captureTurn(snapshot, messageId)) : EMPTY_TURN
      // 交付文件只记名字，附在回复末尾，解析提示词据此知道本轮交付了什么而不必猜内容。
      const fileLine = turnText.fileNames.length > 0 ? `[文件] ${turnText.fileNames.join('、')}` : ''
      const snapshotText = clampTokens(normalizeCaptured([turnText.reply || captureMessageSnapshot(buttonRef.current), fileLine].filter(Boolean).join('\n')), FAVORITE_LIMITS.replyTokens)
      const questionText = clampTokens(normalizeCaptured(turnText.question), FAVORITE_LIMITS.questionTokens)
      const processText = clampTokens(normalizeCaptured(turnText.process), FAVORITE_LIMITS.processTokens)

      const openPicker = () => {
        void controller.ensure()
        const button = buttonRef.current
        if (button) {
          const rect = button.getBoundingClientRect()
          setPosition({ left: rect.right, top: rect.bottom + 6 })
        }
        setOpen(true)
      }

      // 未收藏：hover 显示对标点赞/点踩的 tooltip 提醒收藏；
      // 已收藏：hover 直接打开收藏页（替代简陋的“已收藏”提示）。浮窗打开后保持稳定，手动关闭。
      const onPointerEnter = () => {
        void controller.ensure()
        if (favorite) {
          setTip(null)
          openPicker()
          return
        }
        const button = buttonRef.current
        if (button) {
          const rect = button.getBoundingClientRect()
          setTip({ left: rect.left, top: rect.bottom + 8 })
        }
      }

      const onPointerLeave = () => {
        setTip(null)
      }

      const submit = async action => {
        const body = await postPanelAction(action)
        return (body?.favorites?.favorites ?? []).find(item => item.messageId === messageId) ?? null
      }

      return h('div', { className: 'pa-fav-entry' },
        h('button', {
          ref: buttonRef,
          className: `pa-fav-toggle${favorite ? ' pa-fav-toggle--on' : ''}`,
          type: 'button',
          'aria-label': favorite ? t('favStarActive', favorite.stars) : t('favStar'),
          onClick: openPicker,
          onPointerEnter: onPointerEnter,
          onPointerLeave: onPointerLeave,
          onFocus: () => { void controller.ensure() },
        }, h(CornerStar, { stars: favorite ? favorite.stars : 0, size: 14 })),
        tip && !favorite && !open ? h('div', {
          className: 'pa-tip-card pa-fav-tip',
          style: { left: tip.left, top: tip.top },
        }, t('favStar')) : null,
        open && position ? h(FavoritePop, {
          sessionId,
          messageId,
          favorite,
          position,
          snapshotText,
          questionText,
          processText,
          turnText: turnText.turn,
          reasonMeta: controller.reasonMeta,
          submit,
          onSaved: updated => {
            if (updated) controller.applyFavorite(updated)
            setOpen(false)
          },
          onRemoved: () => {
            controller.removeFavorite(messageId)
            setOpen(false)
          },
          onClose: () => setOpen(false),
        }) : null,
      )
    }

    function ProactiveSourcesCard({ snapshot, onAction, busy }) {
      const data = snapshot.proactiveSources ?? {}
      const rows = Array.isArray(data.sources) ? data.sources : []
      const [key, setKey] = useState('')
      const [label, setLabel] = useState('')
      const [purpose, setPurpose] = useState('')
      const [query, setQuery] = useState('')
      const [confirmId, setConfirmId] = useState(null)
      const add = async () => {
        if (!key.trim() || !label.trim() || !purpose.trim() || !query.trim()) return
        try {
          await onAction({ type: 'proactiveSource.create', key, label, purpose, capabilityQuery: query, enabled: true })
          setKey(''); setLabel(''); setPurpose(''); setQuery('')
        } catch {}
      }
      const toggle = async source => {
        try { await onAction({ type: 'proactiveSource.update', id: source.id, expectedUpdatedAt: source.updatedAt, enabled: !source.enabled }) } catch {}
      }
      const remove = async source => {
        if (confirmId !== source.id) { setConfirmId(source.id); return }
        try { await onAction({ type: 'proactiveSource.delete', id: source.id, expectedUpdatedAt: source.updatedAt }); setConfirmId(null) } catch {}
      }
      return h('div', null,
        h('div', { className: 'pa-field-head' },
          h('span', { className: 'pa-subtitle' }, t('externalSourcesTitle')),
          h('span', { className: 'pa-field-badge' }, t('externalSourceCount', data.sourceCount ?? rows.length, data.enabledCount ?? rows.filter(item => item.enabled).length)),
        ),
        h('p', { className: 'pa-settings-desc' }, t('externalSourcesDesc')),
        h('div', { className: 'pa-settings-card' },
          rows.length === 0 ? h('div', { className: 'pa-pref-row' }, h('span', { className: 'pa-pref-meta' }, t('externalSourcesEmpty'))) : null,
          rows.map(source => h('div', { className: 'pa-pref-row', key: source.id },
            h('div', { className: 'pa-pref-head' },
              h('button', { className: 'pa-switch', role: 'switch', 'aria-checked': source.enabled ? 'true' : 'false', 'aria-label': source.label, onClick: () => { void toggle(source) }, disabled: busy }, h('span', { className: 'pa-switch-thumb' })),
              h('span', { className: 'pa-pref-key' }, source.label),
              h('span', { className: 'pa-field-badge' }, source.origin === 'owner' ? t('externalSourceOriginOwner') : t('externalSourceOriginAssistant')),
              h('button', { className: `pa-pref-act pa-pref-act--delete${confirmId === source.id ? ' pa-pref-act--delete-armed' : ''}`, onClick: () => { void remove(source) }, disabled: busy }, confirmId === source.id ? t('confirmDelete') : t('externalSourceDelete')),
            ),
            h('span', { className: 'pa-pref-value' }, source.purpose),
            h('span', { className: 'pa-pref-meta' }, `${source.key} · ${source.capabilityQuery}`),
          )),
          h('div', { className: 'pa-pref-form' },
            h('input', { className: 'pa-pref-input', value: key, placeholder: t('externalSourceKey'), onChange: event => setKey(event.target.value), disabled: busy }),
            h('input', { className: 'pa-pref-input', value: label, placeholder: t('externalSourceLabel'), onChange: event => setLabel(event.target.value), disabled: busy }),
            h('input', { className: 'pa-pref-input', value: purpose, placeholder: t('externalSourcePurpose'), onChange: event => setPurpose(event.target.value), disabled: busy }),
            h('input', { className: 'pa-pref-input', value: query, placeholder: t('externalSourceQuery'), onChange: event => setQuery(event.target.value), disabled: busy }),
            h('button', { className: 'pa-pref-add', onClick: () => { void add() }, disabled: busy || !key.trim() || !label.trim() || !purpose.trim() || !query.trim() }, t('externalSourceAdd')),
          ),
        ),
      )
    }

    // 已解析且内容未变更的收藏不显示「重新解析」按钮；编辑过（dirty）才显示。
    const favoriteParseVisible = favorite => !(favorite.status === 'analyzed' && !favorite.dirty)

    // 收藏行里的一段正文（提问/过程/回复）：默认裁到 ~120px，超长时提供「展开全文/收起」，
    // 展开后不再内部滚动，滚动交给列表容器，避免嵌套滚动劫持滚轮。
    const FAV_CLIP_CHARS = 220
    // 提问与回复按两行裁切（见 .pa-fav-content--lines），过程按 120px 高度裁切。
    const FAV_TWO_LINE_FIELDS = new Set(['question', 'reply'])
    /**
     * 拆解收藏里保存的过程文本。存储格式固定为「思考：\n<推理>\n工具：a → b」，
     * 展示时只保留摘要结构，长的推理正文按需展开，避免详情页被大段思考刷屏。
     */
    function parseFavoriteProcess(value) {
      const text = String(value ?? '')
      const toolIndex = text.search(/\n工具[：:]/)
      const toolPart = toolIndex >= 0 ? text.slice(toolIndex) : text.match(/^工具[：:]/) ? text : ''
      const reasoningPart = toolIndex >= 0 ? text.slice(0, toolIndex) : (toolPart ? '' : text)
      const reasoning = reasoningPart.replace(/^思考[：:]\s*/, '').trim()
      const toolNames = toolPart
        .replace(/^\n?工具[：:]\s*/, '')
        .split('→')
        .map(name => name.trim())
        .filter(Boolean)
      return { reasoning, tools: toolNames }
    }

    /** 把过程压成交互链：思考 → 工具 → 思考 → 工具 → 思考（没有推理时只列工具）。 */
    function favoriteProcessChain(parsed) {
      const steps = []
      const hasReasoning = Boolean(parsed?.reasoning)
      const tools = Array.isArray(parsed?.tools) ? parsed.tools : []
      if (hasReasoning) steps.push({ type: 'think' })
      tools.forEach((name, index) => {
        steps.push({ type: 'tool', name })
        if (hasReasoning && index < tools.length - 1) steps.push({ type: 'think' })
      })
      if (hasReasoning && tools.length > 0) steps.push({ type: 'think' })
      return steps
    }

    // 深度求索式阅读辅助：思考标记用大脑图标（Lucide brain, ISC），不加书名号。
    const BRAIN_PATHS = [
      'M12 5.5a2.5 2.5 0 0 0-4.9-.7A3.5 3.5 0 0 0 5 11.2a3.5 3.5 0 0 0 1.6 5.9A2.5 2.5 0 0 0 11 18V5.5',
      'M12 5.5a2.5 2.5 0 0 1 4.9-.7 3.5 3.5 0 0 1 2.1 6.4 3.5 3.5 0 0 1-1.6 5.9A2.5 2.5 0 0 1 13 18V5.5',
      'M9 9.5h1.5M13.5 12H15M9.5 14H11',
    ]
    function thinkIcon(size = 13) {
      return h('svg', {
        className: 'pa-think-icon', width: size, height: size, viewBox: '0 0 24 24',
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': 'true',
      }, BRAIN_PATHS.map((d, index) => h('path', { key: index, d })))
    }

    /**
     * 轻量 Markdown 解析：标题、段落、无序/有序列表、引用、代码块、分隔线与行内粗体/斜体/代码/链接。
     * 只做展示层解析，不执行 HTML，所有文本都作为 React 子节点渲染，天然转义。
     */
    function parseMarkdownBlocks(source) {
      const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n')
      const blocks = []
      let paragraph = []
      const flush = () => {
        if (paragraph.length === 0) return
        blocks.push({ type: 'paragraph', text: paragraph.join('\n') })
        paragraph = []
      }
      let index = 0
      while (index < lines.length) {
        const line = lines[index]
        if (/^\s*```/.test(line)) {
          flush()
          const lang = line.replace(/^\s*```\s*/, '').trim()
          const body = []
          index += 1
          while (index < lines.length && !/^\s*```/.test(lines[index])) { body.push(lines[index]); index += 1 }
          index += 1
          blocks.push({ type: 'code', lang, text: body.join('\n') })
          continue
        }
        if (/^\s*$/.test(line)) { flush(); index += 1; continue }
        const heading = /^(#{1,4})\s+(.*)$/.exec(line)
        if (heading) { flush(); blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] }); index += 1; continue }
        if (/^\s*([-*+])\s+/.test(line)) {
          flush()
          const items = []
          while (index < lines.length && /^\s*([-*+])\s+/.test(lines[index])) {
            items.push(lines[index].replace(/^\s*([-*+])\s+/, ''))
            index += 1
          }
          blocks.push({ type: 'list', ordered: false, items })
          continue
        }
        if (/^\s*\d+[.)]\s+/.test(line)) {
          flush()
          const items = []
          while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
            items.push(lines[index].replace(/^\s*\d+[.)]\s+/, ''))
            index += 1
          }
          blocks.push({ type: 'list', ordered: true, items })
          continue
        }
        if (/^\s*>\s?/.test(line)) {
          flush()
          const quoted = []
          while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
            quoted.push(lines[index].replace(/^\s*>\s?/, ''))
            index += 1
          }
          blocks.push({ type: 'quote', text: quoted.join('\n') })
          continue
        }
        if (/^\s*([-*_])\s*\1\s*\1[\s-*_]*$/.test(line)) { flush(); blocks.push({ type: 'hr' }); index += 1; continue }
        paragraph.push(line)
        index += 1
      }
      flush()
      return blocks
    }

    /** 行内标记：代码 → 粗体 → 斜体 → http(s) 链接，避免嵌套解析带来的错位。 */
    function renderInlineMarkdown(text, keyPrefix = 'i') {
      const source = String(text ?? '')
      const nodes = []
      const pattern = /(`[^`]+`|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\)|\*[^*\n]+\*)/g
      let cursor = 0
      let match
      let order = 0
      while ((match = pattern.exec(source)) !== null) {
        if (match.index > cursor) nodes.push(source.slice(cursor, match.index))
        const token = match[0]
        const key = `${keyPrefix}-${order++}`
        if (token.startsWith('`')) {
          nodes.push(h('code', { className: 'pa-md-code', key }, token.slice(1, -1)))
        } else if (token.startsWith('**')) {
          nodes.push(h('strong', { key }, token.slice(2, -2)))
        } else if (token.startsWith('[')) {
          const link = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(token)
          nodes.push(link
            ? h('a', { className: 'pa-md-link', key, href: link[2], target: '_blank', rel: 'noreferrer noopener' }, link[1])
            : token)
        } else {
          nodes.push(h('em', { key }, token.slice(1, -1)))
        }
        cursor = match.index + token.length
      }
      if (cursor < source.length) nodes.push(source.slice(cursor))
      return nodes
    }

    /** 渲染 markdown 块；纯文本内容不包任何额外容器，保持与旧版一致的阅读密度。 */
    function renderMarkdown(source) {
      return parseMarkdownBlocks(source).map((block, index) => {
        const key = `md-${index}`
        if (block.type === 'heading') return h(`h${block.level}`, { className: `pa-md-heading pa-md-h${block.level}`, key }, renderInlineMarkdown(block.text, key))
        if (block.type === 'code') return h('pre', { className: 'pa-md-pre', key }, h('code', null, block.text))
        if (block.type === 'list') {
          const tag = block.ordered ? 'ol' : 'ul'
          return h(tag, { className: 'pa-md-list', key }, block.items.map((item, order) => h('li', { key: `${key}-li-${order}` }, renderInlineMarkdown(item, `${key}-li-${order}`))))
        }
        if (block.type === 'quote') return h('blockquote', { className: 'pa-md-quote', key }, renderInlineMarkdown(block.text, key))
        if (block.type === 'hr') return h('hr', { className: 'pa-md-hr', key })
        return h('p', { className: 'pa-md-p', key }, renderInlineMarkdown(block.text, key))
      })
    }

    /** 过程块：只展示「思考 → 工具名 → 思考…」链，完整思考按需展开。 */
    function FavoriteProcessBlock({ id, value, fullText, onToggleFull }) {
      const parsed = parseFavoriteProcess(value)
      const chain = favoriteProcessChain(parsed)
      const key = `${id}:reasoning`
      const full = fullText.has(key)
      if (chain.length === 0) {
        return h('div', { className: 'pa-fav-content' }, String(value ?? ''))
      }
      const steps = []
      chain.forEach((step, index) => {
        if (index > 0) steps.push(h('span', { className: 'pa-fav-proc-arrow', key: `arrow-${index}`, 'aria-hidden': 'true' }, '→'))
        steps.push(step.type === 'think'
          ? h('span', { className: 'pa-fav-proc-step pa-fav-proc-step--think', key: `step-${index}`, 'aria-label': t('favThinkingChip') }, thinkIcon(12), t('favThinkingChip'))
          : h('span', { className: 'pa-fav-proc-step pa-fav-proc-step--tool', key: `step-${index}` }, step.name))
      })
      return h('div', { className: 'pa-fav-proc' },
        h('div', { className: 'pa-fav-proc-chain' }, steps),
        parsed.reasoning ? h('button', {
          className: 'pa-fav-proc-toggle',
          type: 'button',
          onClick: () => onToggleFull(id, 'reasoning'),
          'aria-expanded': full ? 'true' : 'false',
        }, full ? t('favThinkingCollapse') : t('favThinkingExpand')) : null,
        full && parsed.reasoning ? h('div', { className: 'pa-fav-proc-reasoning' }, parsed.reasoning) : null,
      )
    }

    function favoriteTextBlock({ id, field, label, value, quiet, fullText, onToggleFull, hideLabel = false, markdown = false }) {
      const text = String(value ?? '')
      const key = `${id}:${field}`
      const full = fullText.has(key)
      const twoLine = FAV_TWO_LINE_FIELDS.has(field)
      // 粗略判断是否需要折叠：两行字段按字符数/换行估两行容量，过程字段按 120px 约 6 行估。
      const long = twoLine
        ? text.length > 60 || text.split('\n').length > 2
        : text.length > FAV_CLIP_CHARS || text.split('\n').length > 6
      const clipClass = full ? ' pa-fav-content--full' : long ? (twoLine ? ' pa-fav-content--lines pa-fav-content--clipped' : ' pa-fav-content--clipped') : (twoLine ? ' pa-fav-content--lines' : '')
      return h('div', { className: 'pa-fav-text' },
        h('div', {
          className: `pa-fav-content${quiet ? ' pa-fav-content--q' : ''}${markdown ? ' pa-fav-content--md' : ''}${clipClass}`,
        },
        hideLabel ? null : h('span', { className: 'pa-fav-note-label' }, `${label}：`),
        markdown ? renderMarkdown(text) : text),
        long ? h('button', {
          className: 'pa-fav-more',
          type: 'button',
          onClick: () => onToggleFull(id, field),
          'aria-expanded': full ? 'true' : 'false',
        }, full ? t('favShowLess') : t('favShowMore')) : null,
      )
    }

    function FavoritesCard({ snapshot, onAction, onPoll, notice, busy }) {
      const favorites = snapshot.favorites ?? {}
      const rows = Array.isArray(favorites.favorites) ? favorites.favorites : []
      const reasonMeta = Array.isArray(snapshot.favoriteReasons) ? snapshot.favoriteReasons : null
      // 上限以宿主下发的 FAVORITE_LIMITS 为准，缺失时退回本地同源默认值。
      const limits = { ...FAVORITE_LIMITS, ...(snapshot.favoriteLimits ?? {}) }
      const [mode, setMode] = useState('all')
      const parsedCount = rows.filter(item => item.status === 'analyzed').length
      const pendingCount = rows.filter(item => item.status === 'pending' || item.status === 'analyzing').length
      const failedCount = rows.filter(item => item.status === 'failed').length
      const averageStars = rows.length > 0 ? (rows.reduce((sum, item) => sum + (Number(item.stars) || 0), 0) / rows.length).toFixed(1) : '—'
      const visible = rows.filter(item => mode === 'all'
        || (mode === 'parsed' ? item.status === 'analyzed' : mode === 'pending' ? ['pending', 'analyzing'].includes(item.status) : item.status === 'failed'))
      const [confirmId, setConfirmId] = useState(null)
      const [edit, setEdit] = useState(null)
      // 折叠：默认全部折叠（只看星级/操作/元信息），逐行可展开，也可一键全展开/全收起。
      const [expanded, setExpanded] = useState(() => new Set())
      // 已展开行内仍有超长正文时，正文块按字段单独「展开全文」，避免一次撑出极高行。
      const [fullText, setFullText] = useState(() => new Set())
      const toggleFull = (id, field) => setFullText(previous => {
        const next = new Set(previous)
        const key = `${id}:${field}`
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
      const allExpanded = visible.length > 0 && visible.every(item => expanded.has(item.id))
      const toggleRow = id => setExpanded(previous => {
        const next = new Set(previous)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
      const toggleDesc = key => setExpandedDescs(previous => {
        const next = new Set(previous)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
      const toggleAll = () => setExpanded(allExpanded ? new Set() : new Set(visible.map(item => item.id)))
      // 解析在宿主后台逐条跑（LLM 调用）；只要还有解析中的行就静默轮询列表跟踪进度。
      const analyzing = rows.some(item => item.status === 'analyzing')
      useEffect(() => {
        if (!analyzing) return undefined
        const timer = setInterval(() => { void onPoll({ type: 'favorites.list' }) }, 2000)
        return () => clearInterval(timer)
      }, [analyzing, onPoll])
      const remove = async favorite => {
        try {
          await onAction({ type: 'favorites.remove', sessionId: favorite.sessionId, messageId: favorite.messageId })
          setConfirmId(null)
          notice({ kind: 'ok', text: t('favRemoved') })
        } catch { /* runAction 已上报失败。 */ }
      }
      const openEdit = (favorite, anchor) => {
        const rect = anchor.getBoundingClientRect()
        setEdit({ favorite, position: { left: rect.right, top: rect.bottom + 6 } })
      }
      const analyze = async favorite => {
        try {
          await onAction({ type: 'favorites.analyze', id: favorite.id })
        } catch { /* runAction 已上报失败。 */ }
      }
      const analyzeAll = async () => {
        try {
          await onAction({ type: 'favorites.analyzeAll' })
        } catch { /* runAction 已上报失败。 */ }
      }
      const actionable = rows.some(item => item.status === 'pending' || item.status === 'failed')
      return h('div', null,
        h('div', { className: 'pa-field-head' },
          h('span', { className: 'pa-subtitle' }, t('favTitle')),
          h('span', { className: 'pa-field-badge' }, t('favCount', favorites.favoriteCount ?? 0, rows.length)),
          h('button', {
            className: 'pa-fav-act pa-fav-act--analyze pa-fav-act--all',
            onClick: () => { void analyzeAll() },
            disabled: busy || !actionable,
            'data-pa-tip': actionable ? undefined : t('favAnalyzeAllDisabled'),
          }, t('favAnalyzeAll')),
        ),
        h('p', { className: 'pa-settings-desc' }, t('favDesc')),
        h('p', { className: 'pa-settings-desc' }, t('favLimitsHint',
          limits.questionTokens, limits.replyTokens, limits.processTokens, limits.toolNames)),
        h('div', { className: 'pa-settings-card' },
          statStrip([
            { key: 'total', label: t('favStatTotal'), value: rows.length },
            { key: 'parsed', label: t('favStatParsed'), value: parsedCount },
            { key: 'pending', label: t('favStatPending'), value: pendingCount },
            { key: 'stars', label: t('favStatStars'), value: averageStars },
          ]),
          h('div', { className: 'pa-list-toolbar' },
            filterPills([
              { key: 'all', label: t('wakeFilterAll'), count: rows.length },
              { key: 'parsed', label: t('favStatusAnalyzed'), count: parsedCount },
              { key: 'pending', label: t('favStatusPending'), count: pendingCount },
              { key: 'failed', label: t('favStatusFailed'), count: failedCount },
            ], mode, setMode),
            visible.length > 0 ? h('button', {
              className: 'pa-fav-act pa-fav-act--toggle',
              type: 'button',
              onClick: toggleAll,
              disabled: busy,
              'aria-expanded': allExpanded ? 'true' : 'false',
            }, `${allExpanded ? t('favCollapseAll') : t('favExpandAll')} (${visible.length})`) : null,
          ),
          h('div', { className: 'pa-fav-scroll' },
          rows.length === 0 ? h('div', { className: 'pa-pref-row' }, h('span', { className: 'pa-pref-meta' }, t('favEmpty'))) : null,
          rows.length > 0 && visible.length === 0 ? h('div', { className: 'pa-pref-row' }, h('span', { className: 'pa-pref-meta' }, t('listFilterEmpty'))) : null,
          visible.map(favorite => {
            const open = expanded.has(favorite.id)
            return h('div', { className: `pa-pref-row pa-fav-row${open ? ' pa-fav-row--open' : ''}`, key: favorite.id },
              h('div', { className: 'pa-pref-head pa-fav-row-head' },
                // 折叠开关：点击星级区域展开/收起正文（按钮自身不嵌套按钮，操作按钮独立在外）。
                h('button', {
                  className: 'pa-fav-fold',
                  type: 'button',
                  onClick: () => toggleRow(favorite.id),
                  'aria-expanded': open ? 'true' : 'false',
                  'aria-label': open ? t('favCollapse') : t('favExpand'),
                },
                h('span', { className: `pa-fav-caret${open ? ' pa-fav-caret--open' : ''}`, 'aria-hidden': 'true' }, '▾'),
                h('span', null, open ? t('favCollapse') : t('favExpand')),
                ),
                h(CornerStar, { stars: favorite.stars, size: 14 }),
                h('span', { className: 'pa-pref-key' }, `${t('favStars')} ${favorite.stars}`),
                ...(Array.isArray(favorite.reasons) && favorite.reasons.length > 0
                  ? favorite.reasons.map(reason => h('span', { className: 'pa-field-badge pa-fav-cat', key: reason }, favReasonLabel(reason, reasonMeta)))
                  : []),
                h('span', { className: 'pa-field-badge' }, favorite.status === 'analyzed' && favorite.dirty ? t('favDirtyBadge') : favStatusLabel(favorite.status)),
                (favorite.knowledgeIds?.length || favorite.preferenceIds?.length)
                  ? h('span', { className: 'pa-field-badge' }, t('favParsedCounts', favorite.knowledgeIds?.length ?? 0, favorite.preferenceIds?.length ?? 0))
                  : null,
                h('button', {
                  className: `pa-fav-act pa-fav-act--${favorite.status === 'analyzing' ? 'analyzing' : favorite.status === 'analyzed' ? 'analyzed' : favorite.status === 'failed' ? 'retry' : 'analyze'}`,
                  onClick: () => { void analyze(favorite) },
                  disabled: busy || favorite.status === 'analyzing',
                }, favorite.status === 'analyzing' ? t('favAnalyzing') : favorite.status === 'failed' ? t('favRetry') : favorite.status === 'analyzed' ? t('favReanalyze') : t('favAnalyze')),
              ),
              // 正文仅在展开时渲染；折叠态只留首行（星级+操作）与末行（会话/轮次/时间）。
              open ? h('div', { className: 'pa-fav-body' },
                favorite.question ? h('div', { className: 'pa-fav-section pa-fav-section--input' },
                  h('div', { className: 'pa-fav-section-label' },
                    h('span', { className: 'pa-fav-section-dot', 'aria-hidden': 'true' }),
                    t('favSectionInput')),
                  favoriteTextBlock({
                    id: favorite.id, field: 'question', label: t('favQuestion'), value: favorite.question, quiet: true, fullText, onToggleFull: toggleFull, hideLabel: true,
                  }),
                ) : null,
                favorite.process ? h('div', { className: 'pa-fav-section pa-fav-section--process' },
                  h('div', { className: 'pa-fav-section-label' },
                    h('span', { className: 'pa-fav-section-dot', 'aria-hidden': 'true' }),
                    t('favSectionProcess')),
                  h(FavoriteProcessBlock, { id: favorite.id, value: favorite.process, fullText, onToggleFull: toggleFull }),
                ) : null,
                h('div', { className: 'pa-fav-section pa-fav-section--output' },
                  h('div', { className: 'pa-fav-section-label' },
                    h('span', { className: 'pa-fav-section-dot', 'aria-hidden': 'true' }),
                    t('favSectionOutput')),
                  favoriteTextBlock({
                    id: favorite.id, field: 'reply', label: t('favReply'), value: favorite.snapshot || t('favSnapshotEmpty'), quiet: false, fullText, onToggleFull: toggleFull, hideLabel: true, markdown: true,
                  }),
                ),
                favorite.note ? h('div', { className: 'pa-fav-note-row' }, h('span', { className: 'pa-fav-note-label' }, `${t('favNoteLabel')}：`), favorite.note) : null,
              ) : null,
              favorite.analyzeError ? h('div', { className: 'pa-fav-error', 'data-pa-tip': favorite.analyzeError }, `${t('favError')}${favorite.analyzeError}`) : null,
              h('div', { className: 'pa-fav-row-foot' },
                h('div', { className: 'pa-pref-meta pa-fav-meta' }, [
                  favorite.sessionId ? `${t('favSession')} ${shortId(favorite.sessionId)}` : null,
                  favorite.turn ? t('favTurnN', favorite.turn) : null,
                  favorite.createdAt ? `${t('favSavedAt')} ${formatTime(favorite.createdAt)}` : null,
                ].filter(Boolean).join(' · ')),
                // 次要操作固定在行右下角：与解析（行首主操作）分开，避免挤在同一行。
                h('div', { className: 'pa-fav-foot-actions' },
                  h('button', {
                    className: 'pa-fav-act pa-fav-act--edit',
                    onClick: event => openEdit(favorite, event.currentTarget),
                    disabled: busy,
                  }, t('favEdit')),
                  h('button', {
                    className: `pa-fav-act pa-fav-act--delete${confirmId === favorite.id ? ' pa-fav-act--delete-armed' : ''}`,
                    onClick: () => { void (confirmId === favorite.id ? remove(favorite) : setConfirmId(favorite.id)) },
                    disabled: busy,
                  }, confirmId === favorite.id ? t('confirmDelete') : t('delete')),
                ),
              ),
            )
          }),
          ),
        ),
        edit ? h(FavoritePop, {
          sessionId: edit.favorite.sessionId,
          messageId: edit.favorite.messageId,
          favorite: edit.favorite,
          position: edit.position,
          reasonMeta,
          submit: onAction,
          onSaved: () => setEdit(null),
          onRemoved: () => setEdit(null),
          onClose: () => setEdit(null),
        }) : null,
      )
    }

    /**
     * Official Bilibili / Zhihu brand marks, inlined from Simple Icons
     * (CC0 1.0; the marks themselves belong to their owners).
     */
    const BILI_PINK = '#FB7299'
    const BILI_LOGO_PATH = 'M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z'
    function BiliIcon({ size = 18 }) {
      return h('svg', {
        className: 'pa-bili-icon pa-col-platform-icon',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        'aria-hidden': 'true',
        focusable: 'false',
      }, h('path', { fill: BILI_PINK, d: BILI_LOGO_PATH }))
    }

    const ZHIHU_BLUE = '#0084FF'
    const ZHIHU_LOGO_PATH = 'M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0zm1.964 4.078c-.271.73-.5 1.434-.68 2.11h4.587c.545-.006.445 1.168.445 1.171H9.384a58.104 58.104 0 01-.112 3.797h2.712c.388.023.393 1.251.393 1.266H9.183a9.223 9.223 0 01-.408 2.102l.757-.604c.452.456 1.512 1.712 1.906 2.177.473.681.063 2.081.063 2.081l-2.794-3.382c-.653 2.518-1.845 3.607-1.845 3.607-.523.468-1.58.82-2.64.516 2.218-1.73 3.44-3.917 3.667-6.497H4.491c0-.015.197-1.243.806-1.266h2.71c.024-.32.086-3.254.086-3.797H6.598c-.136.406-.158.447-.268.753-.594 1.095-1.603 1.122-1.907 1.155.906-1.821 1.416-3.6 1.591-4.064.425-1.124 1.671-1.125 1.671-1.125zM13.078 6h6.377v11.33h-2.573l-2.184 1.373-.401-1.373h-1.219zm1.313 1.219v8.86h.623l.263.937 1.455-.938h1.456v-8.86z'
    function ZhihuIcon({ size = 18 }) {
      return h('svg', {
        className: 'pa-col-platform-icon',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        'aria-hidden': 'true',
        focusable: 'false',
      }, h('path', { fill: ZHIHU_BLUE, d: ZHIHU_LOGO_PATH }))
    }


    const QQ_MUSIC_GREEN = '#0daf52'
    function QQMusicIcon({ size = 18 }) {
      return h('svg', {
        className: 'pa-col-platform-icon',
        width: size,
        height: size,
        viewBox: '-147 -173.3 470 492.3',
        'aria-hidden': 'true',
        focusable: 'false',
      },
      h('defs', null, h('linearGradient', {
        id: 'pa-qqmusic-gradient',
        gradientTransform: 'rotate(-90 1397 232)',
        gradientUnits: 'userSpaceOnUse',
        x1: '1310', x2: '1780', y1: '-1077', y2: '-1077',
      },
      h('stop', { offset: '0', stopColor: '#fbbe0a' }),
      h('stop', { offset: '1', stopColor: '#feda24' }),
      )),
      h('circle', { cx: 88, cy: 84, r: 235, fill: 'url(#pa-qqmusic-gradient)' }),
      h('path', { d: 'M123.8 104c-5.9-8.3-11.5-16.1-17.1-23.8C85.2 50.4 63.6 20.6 42-9.1 28.3-28 14.7-46.9.8-65.6-3.4-71.2-3.9-77.1-2-83.5c3.9-13.3 13.2-22.5 24.2-30.1 20.1-13.9 42.8-21 66.6-25.2 20.7-3.6 41.2-8 59.3-19.4 4.9-3.1 9-7.3 13.5-11 1.2-1 2.3-2.1 4.6-4.1 1.5 7.3 3 13.4 4 19.5 3 18 1.9 35.5-6.2 52.1-11 22.4-29 36.4-52.6 43.6C97-53.5 82.1-52.4 67-52.5c-1.1 0-2.2.3-4.1.5 3.7 6.5 7 12.6 10.6 18.5 14.5 23.7 29 47.4 43.4 71.2l47.4 78.6c4.1 6.8 8.4 13.6 12.4 20.5 9.3 16 16.1 32.7 14.8 51.9-1.3 18.8-8.1 35.2-19.8 49.6-19.1 23.5-43.9 37.1-73.5 42.4-27.9 4.9-54.5 1.8-79.2-12.3-27.8-15.8-45.6-44.5-41.4-78.7 2.7-22.5 13.9-41.1 30.4-56.4 17.6-16.2 38.5-26.1 61.8-30.6 17.2-3.4 34.4-3.2 51.4 1.4.5.1 1.1-.1 2.6-.1z', fill: QQ_MUSIC_GREEN }),
      )
    }

    const XHS_RED = '#FF2442'
    const XHS_LOGO_PATH = 'M22.405 9.879c.002.016.01.02.07.019h.725a.797.797 0 0 0 .78-.972.794.794 0 0 0-.884-.618.795.795 0 0 0-.692.794c0 .101-.002.666.001.777zm-11.509 4.808c-.203.001-1.353.004-1.685.003a2.528 2.528 0 0 1-.766-.126.025.025 0 0 0-.03.014L7.7 16.127a.025.025 0 0 0 .01.032c.111.06.336.124.495.124.66.01 1.32.002 1.981 0 .01 0 .02-.006.023-.015l.712-1.545a.025.025 0 0 0-.024-.036zM.477 9.91c-.071 0-.076.002-.076.01a.834.834 0 0 0-.01.08c-.027.397-.038.495-.234 3.06-.012.24-.034.389-.135.607-.026.057-.033.042.003.112.046.092.681 1.523.787 1.74.008.015.011.02.017.02.008 0 .033-.026.047-.044.147-.187.268-.391.371-.606.306-.635.44-1.325.486-1.706.014-.11.021-.22.03-.33l.204-2.616.022-.293c.003-.029 0-.033-.03-.034zm7.203 3.757a1.427 1.427 0 0 1-.135-.607c-.004-.084-.031-.39-.235-3.06a.443.443 0 0 0-.01-.082c-.004-.011-.052-.008-.076-.008h-1.48c-.03.001-.034.005-.03.034l.021.293c.076.982.153 1.964.233 2.946.05.4.186 1.085.487 1.706.103.215.223.419.37.606.015.018.037.051.048.049.02-.003.742-1.642.804-1.765.036-.07.03-.055.003-.112zm3.861-.913h-.872a.126.126 0 0 1-.116-.178l1.178-2.625a.025.025 0 0 0-.023-.035l-1.318-.003a.148.148 0 0 1-.135-.21l.876-1.954a.025.025 0 0 0-.023-.035h-1.56c-.01 0-.02.006-.024.015l-.926 2.068c-.085.169-.314.634-.399.938a.534.534 0 0 0-.02.191.46.46 0 0 0 .23.378.981.981 0 0 0 .46.119h.59c.041 0-.688 1.482-.834 1.972a.53.53 0 0 0-.023.172.465.465 0 0 0 .23.398c.15.092.342.12.475.12l1.66-.001c.01 0 .02-.006.023-.015l.575-1.28a.025.025 0 0 0-.024-.035zm-6.93-4.937H3.1a.032.032 0 0 0-.034.033c0 1.048-.01 2.795-.01 6.829 0 .288-.269.262-.28.262h-.74c-.04.001-.044.004-.04.047.001.037.465 1.064.555 1.263.01.02.03.033.051.033.157.003.767.009.938-.014.153-.02.3-.06.438-.132.3-.156.49-.419.595-.765.052-.172.075-.353.075-.533.002-2.33 0-4.66-.007-6.991a.032.032 0 0 0-.032-.032zm11.784 6.896c0-.014-.01-.021-.024-.022h-1.465c-.048-.001-.049-.002-.05-.049v-4.66c0-.072-.005-.07.07-.07h.863c.08 0 .075.004.075-.074V8.393c0-.082.006-.076-.08-.076h-3.5c-.064 0-.075-.006-.075.073v1.445c0 .083-.006.077.08.077h.854c.075 0 .07-.004.07.07v4.624c0 .095.008.084-.085.084-.37 0-1.11-.002-1.304 0-.048.001-.06.03-.06.03l-.697 1.519s-.014.025-.008.036c.006.01.013.008.058.008 1.748.003 3.495.002 5.243.002.03-.001.034-.006.035-.033v-1.539zm4.177-3.43c0 .013-.007.023-.02.024-.346.006-.692.004-1.037.004-.014-.002-.022-.01-.022-.024-.005-.434-.007-.869-.01-1.303 0-.072-.006-.071.07-.07l.733-.003c.041 0 .081.002.12.015.093.025.16.107.165.204.006.431.002 1.153.001 1.153zm2.67.244a1.953 1.953 0 0 0-.883-.222h-.18c-.04-.001-.04-.003-.042-.04V10.21c0-.132-.007-.263-.025-.394a1.823 1.823 0 0 0-.153-.53 1.533 1.533 0 0 0-.677-.71 2.167 2.167 0 0 0-1-.258c-.153-.003-.567 0-.72 0-.07 0-.068.004-.068-.065V7.76c0-.031-.01-.041-.046-.039H17.93s-.016 0-.023.007c-.006.006-.008.012-.008.023v.546c-.008.036-.057.015-.082.022h-.95c-.022.002-.028.008-.03.032v1.481c0 .09-.004.082.082.082h.913c.082 0 .072.128.072.128V11.19s.003.117-.06.117h-1.482c-.068 0-.06.082-.06.082v1.445s-.01.068.064.068h1.457c.082 0 .076-.006.076.079v3.225c0 .088-.007.081.082.081h1.43c.09 0 .082.007.082-.08v-3.27c0-.029.006-.035.033-.035l2.323-.003c.098 0 .191.02.28.061a.46.46 0 0 1 .274.407c.008.395.003.79.003 1.185 0 .259-.107.367-.33.367h-1.218c-.023.002-.029.008-.028.033.184.437.374.871.57 1.303a.045.045 0 0 0 .04.026c.17.005.34.002.51.003.15-.002.517.004.666-.01a2.03 2.03 0 0 0 .408-.075c.59-.18.975-.698.976-1.313v-1.981c0-.128-.01-.254-.034-.38 0 .078-.029-.641-.724-.998z'
    function XiaohongshuIcon({ size = 18 }) {
      return h('svg', {
        className: 'pa-col-platform-icon',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        'aria-hidden': 'true',
        focusable: 'false',
      }, h('path', { fill: XHS_RED, d: XHS_LOGO_PATH }))
    }

    // 浏览器收藏夹：通用蓝的圆角方块 + 白色书签丝带，不冒充任何单一浏览器品牌。
    const BROWSER_BLUE = '#0F6CBD'
    function BrowserIcon({ size = 18 }) {
      return h('svg', {
        className: 'pa-col-platform-icon',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        'aria-hidden': 'true',
        focusable: 'false',
      },
      h('rect', { x: 2, y: 3, width: 20, height: 18, rx: 5, fill: BROWSER_BLUE }),
      h('path', { fill: '#fff', d: 'M8 7.5h8v10l-4-2.85L8 17.5Z' }),
      )
    }

    // Official browser source marks, inlined from Simple Icons (CC0 1.0; the
    // marks themselves belong to their owners). Safari uses a simplified compass
    // so the client bundle stays small.
    const EDGE_LOGO_PATH = "M21.86 17.86q.14 0 .25.12.1.13.1.25t-.11.33l-.32.46-.43.53-.44.5q-.21.25-.38.42l-.22.23q-.58.53-1.34 1.04-.76.51-1.6.91-.86.4-1.74.64t-1.67.24q-.9 0-1.69-.28-.8-.28-1.48-.78-.68-.5-1.22-1.17-.53-.66-.92-1.44-.38-.77-.58-1.6-.2-.83-.2-1.67 0-1 .32-1.96.33-.97.87-1.8.14.95.55 1.77.41.82 1.02 1.5.6.68 1.38 1.21.78.54 1.64.9.86.36 1.77.56.92.2 1.8.2 1.12 0 2.18-.24 1.06-.23 2.06-.72l.2-.1.2-.05zm-15.5-1.27q0 1.1.27 2.15.27 1.06.78 2.03.51.96 1.24 1.77.74.82 1.66 1.4-1.47-.2-2.8-.74-1.33-.55-2.48-1.37-1.15-.83-2.08-1.9-.92-1.07-1.58-2.33T.36 14.94Q0 13.54 0 12.06q0-.81.32-1.49.31-.68.83-1.23.53-.55 1.2-.96.66-.4 1.35-.66.74-.27 1.5-.39.78-.12 1.55-.12.7 0 1.42.1.72.12 1.4.35.68.23 1.32.57.63.35 1.16.83-.35 0-.7.07-.33.07-.65.23v-.02q-.63.28-1.2.74-.57.46-1.05 1.04-.48.58-.87 1.26-.38.67-.65 1.39-.27.71-.42 1.44-.15.72-.15 1.38zM11.96.06q1.7 0 3.33.39 1.63.38 3.07 1.15 1.43.77 2.62 1.93 1.18 1.16 1.98 2.7.49.94.76 1.96.28 1 .28 2.08 0 .89-.23 1.7-.24.8-.69 1.48-.45.68-1.1 1.22-.64.53-1.45.88-.54.24-1.11.36-.58.13-1.16.13-.42 0-.97-.03-.54-.03-1.1-.12-.55-.1-1.05-.28-.5-.19-.84-.5-.12-.09-.23-.24-.1-.16-.1-.33 0-.15.16-.35.16-.2.35-.5.2-.28.36-.68.16-.4.16-.95 0-1.06-.4-1.96-.4-.91-1.06-1.64-.66-.74-1.52-1.28-.86-.55-1.79-.89-.84-.3-1.72-.44-.87-.14-1.76-.14-1.55 0-3.06.45T.94 7.55q.71-1.74 1.81-3.13 1.1-1.38 2.52-2.35Q6.68 1.1 8.37.58q1.7-.52 3.58-.52Z"
    function EdgeIcon({ size = 18 }) {
      return h('svg', {
        className: 'pa-col-platform-icon',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        'aria-hidden': 'true',
        focusable: 'false',
      },
      h('defs', null, h('linearGradient', { id: 'pa-edge-gradient', x1: '0', y1: '0', x2: '1', y2: '1' },
        h('stop', { offset: '0', stopColor: '#0F6CBD' }),
        h('stop', { offset: '1', stopColor: '#35C1F1' }),
      )),
      h('path', { fill: 'url(#pa-edge-gradient)', d: EDGE_LOGO_PATH }),
      )
    }

    const CHROME_LOGO_PATHS = Object.freeze([
      { fill: '#EA4335', d: "M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0z" },
      { fill: '#34A853', d: "M1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29z" },
      { fill: '#FBBC05', d: "M15.273 7.636a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364z" },
      { fill: '#4285F4', d: "M12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z" },
    ])
    function ChromeIcon({ size = 18 }) {
      return h('svg', {
        className: 'pa-col-platform-icon',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        'aria-hidden': 'true',
        focusable: 'false',
      }, ...CHROME_LOGO_PATHS.map(part => h('path', { key: part.fill, fill: part.fill, d: part.d })))
    }

    const FIREFOX_LOGO_PATH = "M20.452 3.445a11.002 11.002 0 00-2.482-1.908C16.944.997 15.098.093 12.477.032c-.734-.017-1.457.03-2.174.144-.72.114-1.398.292-2.118.56-1.017.377-1.996.975-2.574 1.554.583-.349 1.476-.733 2.55-.992a10.083 10.083 0 013.729-.167c2.341.34 4.178 1.381 5.48 2.625a8.066 8.066 0 011.298 1.587c1.468 2.382 1.33 5.376.184 7.142-.85 1.312-2.67 2.544-4.37 2.53-.583-.023-1.438-.152-2.25-.566-2.629-1.343-3.021-4.688-1.118-6.306-.632-.136-1.82.13-2.646 1.363-.742 1.107-.7 2.816-.242 4.028a6.473 6.473 0 01-.59-1.895 7.695 7.695 0 01.416-3.845A8.212 8.212 0 019.45 5.399c.896-1.069 1.908-1.72 2.75-2.005-.54-.471-1.411-.738-2.421-.767C8.31 2.583 6.327 3.061 4.7 4.41a8.148 8.148 0 00-1.976 2.414c-.455.836-.691 1.659-.697 1.678.122-1.445.704-2.994 1.248-4.055-.79.413-1.827 1.668-2.41 3.042C.095 9.37-.2 11.608.14 13.989c.966 5.668 5.9 9.982 11.843 9.982C18.62 23.971 24 18.591 24 11.956a11.93 11.93 0 00-3.548-8.511z"
    function FirefoxIcon({ size = 18 }) {
      return h('svg', {
        className: 'pa-col-platform-icon',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        'aria-hidden': 'true',
        focusable: 'false',
      }, h('path', { fill: '#FF7139', d: FIREFOX_LOGO_PATH }))
    }

    function SafariIcon({ size = 18 }) {
      return h('svg', {
        className: 'pa-col-platform-icon',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        'aria-hidden': 'true',
        focusable: 'false',
      },
      h('circle', { cx: 12, cy: 12, r: 12, fill: '#006CFF' }),
      h('circle', { cx: 12, cy: 12, r: 8.6, fill: 'none', stroke: '#fff', strokeWidth: 1 }),
      h('path', { fill: '#fff', d: 'M16.2 7.8 13.2 13.2 7.8 16.2 10.8 10.8Z' }),
      h('path', { fill: '#FF3B30', d: 'M16.2 7.8 13.2 13.2 10.8 10.8Z' }),
      )
    }

    /** Map a stored source label such as "Edge · favorites_….html" to its icon. */
    function browserSourceKey(source) {
      if (typeof source !== 'string' || source === '') return null
      const match = /^(edge|chrome|firefox|safari)\b/i.exec(source.trim())
      return match ? match[1].toLowerCase() : null
    }

    function BrowserSourceIcon({ source, size = 18 }) {
      const key = browserSourceKey(source)
      if (key === 'edge') return h(EdgeIcon, { size })
      if (key === 'chrome') return h(ChromeIcon, { size })
      if (key === 'firefox') return h(FirefoxIcon, { size })
      if (key === 'safari') return h(SafariIcon, { size })
      return h(BrowserIcon, { size })
    }

    function CollectionPlatformIcon({ platform, source, size = 18 }) {
      if (platform === 'bilibili') return h(BiliIcon, { size })
      if (platform === 'zhihu') return h(ZhihuIcon, { size })
      if (platform === 'qqmusic') return h(QQMusicIcon, { size })
      if (platform === 'xiaohongshu') return h(XiaohongshuIcon, { size })
      if (platform === 'browser') return h(BrowserSourceIcon, { source, size })
      return h('span', { className: 'pa-field-badge' }, collectionPlatformLabel(platform))
    }

    const hideBrokenImage = event => {
      event.currentTarget.style.display = 'none'
    }

    function formatCount(value) {
      if (!Number.isFinite(value)) return ''
      if (value >= 100000000) return `${(value / 100000000).toFixed(1).replace(/\.0$/, '')}亿`
      if (value >= 10000) return `${(value / 10000).toFixed(1).replace(/\.0$/, '')}万`
      return String(value)
    }

    function formatDuration(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) return ''
      const total = Math.floor(seconds)
      const h = Math.floor(total / 3600)
      const m = Math.floor((total % 3600) / 60)
      const sec = total % 60
      return `${h > 0 ? `${h}:` : ''}${h > 0 ? String(m).padStart(2, '0') : m}:${String(sec).padStart(2, '0')}`
    }

    function displayLink(url) {
      if (typeof url !== 'string' || url === '') return ''
      try {
        const parsed = new URL(url)
        const path = parsed.pathname.length > 34 ? `${parsed.pathname.slice(0, 34)}…` : parsed.pathname
        return `${parsed.hostname.replace(/^www\./, '')}${path}`
      } catch {
        return url
      }
    }

    const COLLECTION_PLATFORM_KEYS = {
      bilibili: 'colPlatformBilibili',
      zhihu: 'colPlatformZhihu',
      xiaohongshu: 'colPlatformXiaohongshu',
      qqmusic: 'colPlatformQQMusic',
      browser: 'colPlatformBrowser',
      other: 'colPlatformOther',
    }

    const COLLECTION_ITEM_KIND_KEYS = {
      answer: 'colAnswer',
      article: 'colArticle',
      song: 'colSong',
      note: 'colNote',
      bookmark: 'colBookmark',
    }

    const COLLECTION_SOURCE_KEYS = {
      bilibili: 'colSourceBilibili',
      zhihu: 'colSourceZhihu',
      qqmusic: 'colSourceQQMusic',
      xiaohongshu: 'colSourceXiaohongshu',
      browser: 'colSourceBrowser',
    }

    function collectionPlatformLabel(platform) {
      return t(COLLECTION_PLATFORM_KEYS[platform] ?? 'colPlatformOther')
    }

    function collectionSourceLabel(folder) {
      const key = COLLECTION_SOURCE_KEYS[folder.platform]
      return key ? t(key) : (folder.sourceUrl ?? '')
    }

    function collectionStatusLabel(status) {
      const key = { pending: 'colStatusPending', analyzing: 'colStatusAnalyzing', analyzed: 'colStatusAnalyzed', failed: 'colStatusFailed', skipped: 'colStatusSkipped' }[status]
      return t(key ?? 'colStatusPending')
    }

    function collectionWebUrl(url) {
      if (typeof url !== 'string' || url === '') return null
      const app = url.match(/^bilibili:\/\/video\/(\d+)/)
      return app ? `https://www.bilibili.com/video/av${app[1]}` : url
    }

    function collectionParseVisible(item) {
      return item.status === 'pending' || item.status === 'failed' || (item.status === 'analyzed' && item.dirty)
    }

    /**
     * Runs in the Zhihu page via the draggable bookmarklet. It must stay
     * self-contained (only browser globals) because it is serialized with
     * Function#toString; it never reads or copies the login Cookie.
     */
    function zhihuExtractScript() {
      return (async () => {
        const match = location.pathname.match(/^\/collection\/(\d+)/)
        const collectionId = match && match[1]
        if (!collectionId) {
          alert('请在具体的知乎收藏夹页面运行（网址形如 www.zhihu.com/collection/数字）。')
          return
        }
        const getJson = async url => {
          const response = await fetch(url, { credentials: 'include', headers: { accept: 'application/json, text/plain, */*' } })
          if (!response.ok) throw new Error('HTTP ' + response.status)
          return response.json()
        }
        const plain = value => {
          if (typeof value !== 'string' || value === '') return ''
          const area = document.createElement('textarea')
          area.innerHTML = value.replace(/<[^>]*>/g, ' ')
          return (area.value || '').replace(/\s+/g, ' ').trim()
        }
        const firstInt = values => {
          for (const value of values) if (Number.isInteger(value) && value >= 0) return value
          return undefined
        }
        let meta = null
        try {
          const info = await getJson('/api/v4/collections/' + collectionId + '?include=title,item_count,owner')
          const collection = info && (info.collection || info.data) ? (info.collection || info.data) : info
          if (collection && typeof collection === 'object') {
            meta = {
              title: plain(collection.title),
              owner: plain((collection.creator && collection.creator.name) || (collection.owner && collection.owner.name) || ''),
              count: Number.isInteger(collection.item_count) ? collection.item_count : undefined,
            }
          }
        } catch (error) {
          // Metadata is optional; the items below still carry the content.
        }
        const items = []
        let fetched = 0
        let dropped = 0
        let offset = 0
        let totals
        try {
          for (let page = 0; page < 25 && items.length < 300; page += 1) {
            const data = await getJson('/api/v4/collections/' + collectionId + '/items?offset=' + offset + '&limit=20')
            const rows = data && Array.isArray(data.data) ? data.data : []
            if (rows.length === 0) break
            for (const row of rows) {
              fetched += 1
              const content = row && row.content && typeof row.content === 'object' ? row.content : row
              if (!content || (content.type !== 'answer' && content.type !== 'article')) {
                dropped += 1
                continue
              }
              const kind = content.type
              const question = content.question && typeof content.question === 'object' ? content.question : {}
              const rawUrl = typeof content.url === 'string' ? content.url : ''
              const idText = content.id !== undefined && content.id !== null ? String(content.id) : ''
              const questionFromUrl = rawUrl.match(/\/questions?\/(\d+)/)
              const questionId = questionFromUrl ? questionFromUrl[1] : (question.id !== undefined && question.id !== null ? String(question.id) : '')
              let url = ''
              const answerFromWeb = rawUrl.match(/\/question\/(\d+)\/answer\/(\d+)/)
              const articleFromWeb = rawUrl.match(/(?:zhuanlan\.zhihu\.com\/p\/|\/p\/)(\d+)/)
              const answerFromApi = rawUrl.match(/\/answers\/(\d+)/)
              const articleFromApi = rawUrl.match(/\/articles\/(\d+)/)
              if (kind === 'answer') {
                if (answerFromWeb) url = 'https://www.zhihu.com/question/' + answerFromWeb[1] + '/answer/' + answerFromWeb[2]
                else if (questionId && answerFromApi) url = 'https://www.zhihu.com/question/' + questionId + '/answer/' + answerFromApi[1]
                else if (questionId && idText) url = 'https://www.zhihu.com/question/' + questionId + '/answer/' + idText
              } else if (articleFromWeb) url = 'https://zhuanlan.zhihu.com/p/' + articleFromWeb[1]
              else if (articleFromApi) url = 'https://zhuanlan.zhihu.com/p/' + articleFromApi[1]
              else if (idText) url = 'https://zhuanlan.zhihu.com/p/' + idText
              if (!url) {
                dropped += 1
                continue
              }
              const excerpt = plain(content.excerpt || content.summary || content.content || '')
              const rawTitle = kind === 'answer' ? (question.title || content.title) : (content.title || content.excerpt_title)
              const title = (plain(rawTitle) || plain((excerpt.split(/[。！？!?\n]/)[0] || ''))).slice(0, 200)
              if (!title) {
                dropped += 1
                continue
              }
              const item = { title: title, url: url, kind: kind }
              if (excerpt) item.description = excerpt.slice(0, 400)
              const author = plain((content.author && content.author.name) || '')
              if (author) item.author = author.slice(0, 100)
              const cover = typeof content.thumbnail === 'string' ? content.thumbnail : (typeof content.image_url === 'string' ? content.image_url : (typeof content.cover === 'string' ? content.cover : ''))
              if (cover) item.cover = cover.slice(0, 1000)
              const read = firstInt([content.visit_count, content.visited_count, content.read_count, content.browse_count])
              if (read !== undefined) item.read = read
              const voteup = firstInt([content.voteup_count, content.voteup])
              if (voteup !== undefined) item.voteup = voteup
              const comment = firstInt([content.comment_count, content.comments_count])
              if (comment !== undefined) item.comment = comment
              const favorite = firstInt([content.favorite_count, content.collect_count])
              if (favorite !== undefined) item.favorite = favorite
              const tagSource = [
                ...(Array.isArray(content.topics) ? content.topics : []),
                ...(Array.isArray(content.tags) ? content.tags : []),
                ...(Array.isArray(question.topics) ? question.topics : []),
              ]
              const tags = [...new Set(tagSource
                .map(tag => plain(typeof tag === 'string' ? tag : ((tag && (tag.name || tag.title)) || '')))
                .filter(Boolean))].slice(0, 12)
              if (tags.length) item.tags = tags
              items.push(item)
              if (items.length >= 300) break
            }
            if (data && data.paging && Number.isInteger(data.paging.totals)) totals = data.paging.totals
            if (data && data.paging && data.paging.is_end === true) break
            offset += 20
          }
        } catch (error) {
          alert('提取失败：' + (error && error.message ? error.message : String(error)) + '\n请确认已登录知乎，然后重试。')
          return
        }
        if (items.length === 0) {
          alert('没有提取到有效条目。请确认已登录知乎，且收藏夹里有回答或文章。')
          return
        }
        const payload = {
          platform: 'zhihu',
          folder: meta && meta.title ? meta.title : '知乎收藏夹',
          upper: meta && meta.owner ? meta.owner : undefined,
          sourceUrl: 'https://www.zhihu.com/collection/' + collectionId,
          mediaCount: meta && Number.isInteger(meta.count) ? meta.count : (Number.isInteger(totals) ? totals : fetched),
          fetched: fetched,
          dropped: dropped,
          items: items,
        }
        const text = JSON.stringify(payload)
        try {
          await navigator.clipboard.writeText(text)
          alert('已提取「' + payload.folder + '」' + items.length + ' 条，结果已复制到剪贴板。\n回到 DSH 收藏夹解析，点「从剪贴板导入」。')
        } catch (error) {
          console.log(text)
          prompt('自动复制失败，请手动复制下面的 JSON：', text)
        }
      })()
    }

    const ZHIHU_EXTRACT_CODE = `(${zhihuExtractScript.toString()})()`
    const ZHIHU_BOOKMARKLET = `javascript:${encodeURIComponent(`void ${ZHIHU_EXTRACT_CODE}`)}`

    /**
     * Runs in the Xiaohongshu board page via the draggable bookmarklet. It
     * reads the hydrated __INITIAL_STATE__ (the same state the page renders),
     * scrolls to load the full board, and copies a normalized payload.
     */
    function xiaohongshuExtractScript() {
      return (async () => {
        const match = location.pathname.match(/^\/board\/([A-Za-z0-9]+)/)
        const boardId = match && match[1]
        if (!boardId || typeof window === 'undefined' || !window.__INITIAL_STATE__) {
          alert('请在小红书收藏专辑页面运行（网址形如 www.xiaohongshu.com/board/…）。')
          return
        }
        const unwrap = value => value && typeof value === 'object' && '_rawValue' in value ? value._rawValue : value
        const plain = value => {
          if (typeof value !== 'string' || value === '') return ''
          const area = document.createElement('textarea')
          area.innerHTML = value.replace(/<[^>]*>/g, ' ')
          return (area.value || '').replace(/\s+/g, ' ').trim()
        }
        const count = value => {
          if (Number.isInteger(value) && value >= 0) return value
          if (typeof value === 'string') {
            const hit = value.trim().match(/^([\d.]+)(万|w)?$/i)
            if (hit) return Math.round(Number(hit[1]) * (hit[2] ? 10000 : 1))
          }
          return undefined
        }
        const date = value => {
          const number = typeof value === 'number' ? value : Number(value)
          if (!Number.isFinite(number) || number <= 0) return undefined
          const parsed = new Date(number > 1e12 ? number : number * 1000)
          if (Number.isNaN(parsed.getTime())) return undefined
          return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
        }
        const pickNote = (root, noteId) => {
          if (!root || typeof root !== 'object') return null
          const map = root.note && root.note.noteDetailMap
          if (map && typeof map === 'object') {
            const entry = map[noteId] || map[String(noteId)]
            if (entry && entry.note) return entry.note
            const current = root.note.currentNoteId
            if (current && map[current] && map[current].note) return map[current].note
          }
          if (root.noteData && root.noteData.data && root.noteData.data.noteData) return root.noteData.data.noteData
          return null
        }
        const parseInitialState = html => {
          if (typeof html !== 'string') return null
          const marker = 'window.__INITIAL_STATE__'
          const at = html.indexOf(marker)
          if (at < 0) return null
          const start = html.indexOf('{', at)
          if (start < 0) return null
          let depth = 0
          let inString = false
          let escaped = false
          for (let index = start; index < html.length; index += 1) {
            const char = html[index]
            if (inString) {
              if (escaped) escaped = false
              else if (char === '\\') escaped = true
              else if (char === '"') inString = false
              continue
            }
            if (char === '"') {
              inString = true
              continue
            }
            if (char === '{') depth += 1
            else if (char === '}') {
              depth -= 1
              if (depth === 0) {
                try {
                  return JSON.parse(html.slice(start, index + 1))
                } catch {
                  return null
                }
              }
            }
          }
          return null
        }
        const fetchNoteDetail = async (noteId, token) => {
          const url = 'https://www.xiaohongshu.com/discovery/item/' + noteId + '?source=webshare&xhsshare=pc_web&xsec_token=' + encodeURIComponent(token || '') + '&xsec_source=pc_share'
          if (typeof fetch === 'function') {
            try {
              const response = await fetch(url, { credentials: 'include' })
              if (response.ok) {
                const html = await response.text()
                const note = pickNote(parseInitialState(html), noteId)
                if (note) return note
              }
            } catch (error) {
              // Fall through to the iframe loader.
            }
          }
          if (typeof document === 'undefined' || !document.body || typeof document.body.appendChild !== 'function') return null
          return await new Promise(resolve => {
            const frame = document.createElement('iframe')
            frame.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;border:0;'
            frame.src = url
            let settled = false
            let timer = null
            const finish = note => {
              if (settled) return
              settled = true
              if (timer) clearInterval(timer)
              try { frame.remove() } catch (error) {}
              resolve(note)
            }
            frame.onload = () => {
              let attempts = 0
              timer = setInterval(() => {
                attempts += 1
                let note = null
                try {
                  note = pickNote(frame.contentWindow.__INITIAL_STATE__, noteId)
                } catch (error) {
                  note = null
                }
                if (note || attempts >= 12) finish(note)
              }, 500)
            }
            frame.onerror = () => finish(null)
            document.body.appendChild(frame)
            setTimeout(() => finish(null), 12000)
          })
        }
        const state = () => window.__INITIAL_STATE__ || {}
        const board = () => unwrap(state().board) || {}
        const details = unwrap(board().boardDetails) || {}
        const user = unwrap(details.user) || {}
        const folder = plain(details.name) || '小红书收藏'
        const upper = plain(user.nickname || user.nickName || '')
        const total = Number.isInteger(details.total) ? details.total : undefined
        const readEntry = () => {
          const feeds = unwrap(board().boardFeedsMap) || {}
          const record = unwrap(feeds[boardId]) || {}
          const rawNotes = unwrap(record.notes)
          return { notes: Array.isArray(rawNotes) ? rawNotes : [], hasMore: record.hasMore !== false }
        }
        let notes = []
        let last = -1
        let stable = 0
        for (let index = 0; index < 30; index += 1) {
          const current = readEntry()
          notes = current.notes
          if (notes.length >= 300) break
          if (notes.length === last) stable += 1
          else stable = 0
          last = notes.length
          if (current.hasMore === false && index > 0) break
          if (stable >= 3) break
          window.scrollTo(0, document.body.scrollHeight)
          await new Promise(resolve => setTimeout(resolve, 900))
        }
        const items = []
        const records = []
        let fetched = 0
        let dropped = 0
        for (const note of notes) {
          fetched += 1
          if (!note || typeof note !== 'object') {
            dropped += 1
            continue
          }
          const card = note.noteCard && typeof note.noteCard === 'object' ? note.noteCard : {}
          const noteId = String(note.noteId || note.id || card.noteId || '')
          if (!noteId) {
            dropped += 1
            continue
          }
          const xsec = typeof note.xsecToken === 'string' ? note.xsecToken : (typeof note.xsec_token === 'string' ? note.xsec_token : '')
          const noteUser = note.user && typeof note.user === 'object' ? note.user : (card.user && typeof card.user === 'object' ? card.user : {})
          const author = plain(noteUser.nickname || noteUser.nickName || '')
          const rawTitle = note.displayTitle || note.title || card.displayTitle || card.title || ''
          const desc = plain(note.desc || card.desc || '')
          const title = (plain(rawTitle) || plain(desc.split(/[。！？!?\n]/)[0] || '')).slice(0, 200)
          if (!title) {
            dropped += 1
            continue
          }
          const coverValue = note.cover || card.cover || ''
          const cover = typeof coverValue === 'string' ? coverValue : (coverValue.urlDefault || coverValue.url || '')
          const url = 'https://www.xiaohongshu.com/explore/' + noteId + (xsec ? '?xsec_token=' + encodeURIComponent(xsec) + '&xsec_source=pc_share' : '')
          const item = { title: title, url: url, kind: 'note' }
          if (desc) item.description = desc.slice(0, 1000)
          if (author) item.author = author.slice(0, 100)
          if (cover) item.cover = String(cover).slice(0, 1000)
          const published = date(note.time || note.lastUpdateTime || card.time || card.lastUpdateTime)
          if (published) item.releasedAt = published
          const rawTags = note.tagList || note.topics || card.tagList || []
          const tags = Array.isArray(rawTags)
            ? [...new Set(rawTags.map(tag => plain(typeof tag === 'string' ? tag : (tag.name || tag.title || ''))).filter(Boolean))].slice(0, 12)
            : []
          if (tags.length) item.tags = tags
          const info = note.interactInfo && typeof note.interactInfo === 'object' ? note.interactInfo : (card.interactInfo && typeof card.interactInfo === 'object' ? card.interactInfo : {})
          const like = count(info.likedCount || info.liked_count)
          if (like !== undefined) item.like = like
          const collected = count(info.collectedCount || info.collected_count)
          if (collected !== undefined) item.favorite = collected
          const comments = count(info.commentCount || info.comments_count)
          if (comments !== undefined) item.comment = comments
          items.push(item)
          records.push({ item: item, noteId: noteId, xsec: xsec })
          if (items.length >= 300) break
        }
        if (items.length === 0) {
          alert('没有读取到笔记：请确认已登录、专辑有笔记，并等页面加载完成后重试。')
          return
        }
        const missingBody = records.filter(record => !record.item.description)
        if (missingBody.length > 0 && typeof confirm === 'function' && confirm('列表页通常只有标题和互动数，没有完整正文。\n是否逐篇打开笔记详情提取正文和标签？\n会慢一些（约十几秒），也可能触发风控。')) {
          let cursor = 0
          let done = 0
          let progress = null
          if (typeof document !== 'undefined' && document.body && typeof document.body.appendChild === 'function') {
            progress = document.createElement('div')
            progress.textContent = '正在提取正文 0/' + missingBody.length
            progress.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;background:#111;color:#fff;padding:8px 12px;border-radius:8px;font:12px/1.5 sans-serif;'
            document.body.appendChild(progress)
          }
          const workers = Array.from({ length: Math.min(3, missingBody.length) }, async () => {
            for (;;) {
              const index = cursor
              cursor += 1
              if (index >= missingBody.length) return
              const record = missingBody[index]
              const note = await fetchNoteDetail(record.noteId, record.xsec)
              if (note) {
                const detailDesc = plain(note.desc || note.description || '')
                if (detailDesc) record.item.description = detailDesc.slice(0, 1000)
                const detailTagSource = note.tagList || note.topics || []
                const detailTags = Array.isArray(detailTagSource)
                  ? [...new Set(detailTagSource.map(tag => plain(typeof tag === 'string' ? tag : (tag.name || tag.title || ''))).filter(Boolean))].slice(0, 12)
                  : []
                if (detailTags.length) record.item.tags = detailTags
                const detailInfo = note.interactInfo && typeof note.interactInfo === 'object' ? note.interactInfo : {}
                const detailLike = count(detailInfo.likedCount || detailInfo.liked_count)
                if (detailLike !== undefined) record.item.like = detailLike
                const detailCollected = count(detailInfo.collectedCount || detailInfo.collected_count)
                if (detailCollected !== undefined) record.item.favorite = detailCollected
                const detailComments = count(detailInfo.commentCount || detailInfo.comments_count)
                if (detailComments !== undefined) record.item.comment = detailComments
                const detailPublished = date(note.time || note.lastUpdateTime)
                if (detailPublished) record.item.releasedAt = detailPublished
              }
              done += 1
              if (progress) progress.textContent = '正在提取正文 ' + done + '/' + missingBody.length
            }
          })
          await Promise.all(workers)
          if (progress) {
            try { progress.remove() } catch (error) {}
          }
        }
        const payload = {
          platform: 'xiaohongshu',
          folder: folder,
          upper: upper || undefined,
          sourceUrl: 'https://www.xiaohongshu.com/board/' + boardId,
          mediaCount: Number.isInteger(total) ? total : items.length,
          fetched: fetched,
          dropped: dropped,
          items: items,
        }
        const text = JSON.stringify(payload)
        try {
          await navigator.clipboard.writeText(text)
          alert('已提取「' + folder + '」' + items.length + ' 条，结果已复制到剪贴板。\n回到 DSH 收藏夹解析，点「从剪贴板导入」。')
        } catch (error) {
          console.log(text)
          prompt('自动复制失败，请手动复制下面的 JSON：', text)
        }
      })()
    }

    const XHS_EXTRACT_CODE = `(${xiaohongshuExtractScript.toString()})()`
    const XHS_BOOKMARKLET = `javascript:${encodeURIComponent(`void ${XHS_EXTRACT_CODE}`)}`

    async function copyText(text) {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(text)
          return true
        }
      } catch {
        // Fall through to the legacy textarea copy.
      }
      try {
        const area = document.createElement('textarea')
        area.value = text
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        const ok = document.execCommand('copy')
        area.remove()
        return ok
      } catch {
        return false
      }
    }

    async function readClipboardText() {
      if (typeof navigator === 'undefined' || !navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
        throw new Error('当前浏览器不支持读取剪贴板，请使用「手动粘贴」')
      }
      return navigator.clipboard.readText()
    }

    const BOOKMARK_FILE_MAX_BYTES = 4 * 1024 * 1024

    function CollectionsCard({ snapshot, onAction, onPoll, notice, busy }) {
      const data = snapshot.collections ?? {}
      const rows = Array.isArray(data.collections) ? data.collections : []
      // 旧宿主没有该能力标记：说明只有客户端更新了，文件/粘贴入口先禁用并提示重启。
      const bookmarkReady = snapshot.collectionCapabilities?.bookmarkImport === true
      // 服务端摘要优先；旧宿主没有该字段时退回偏好列表现算（受最近 50 条窗口限制）。
      const preferenceCountOf = folder => typeof folder.preferenceCount === 'number'
        ? folder.preferenceCount
        : (snapshot.preferences?.preferences ?? []).filter(item => item.source === `collection:${folder.id}`).length
      const [linkText, setLinkText] = useState('')
      const [cookieText, setCookieText] = useState('')
      const [importing, setImporting] = useState(false)
      // 解析结果/失败直接显示在卡片内（页面顶部提示在卡片滚动区外，用户看不到）。
      const [cardNotice, setCardNoticeState] = useState(null)
      const cardNoticeTimer = useRef(null)
      const setCardNotice = next => {
        if (cardNoticeTimer.current) {
          clearTimeout(cardNoticeTimer.current)
          cardNoticeTimer.current = null
        }
        setCardNoticeState(next)
      }
      // 导入成功这类一次性结果只停留几秒，避免常驻在卡片里。
      const flashCardNotice = (next, milliseconds = 3000) => {
        setCardNotice(next)
        cardNoticeTimer.current = setTimeout(() => {
          cardNoticeTimer.current = null
          setCardNoticeState(null)
        }, milliseconds)
      }
      useEffect(() => () => {
        if (cardNoticeTimer.current) clearTimeout(cardNoticeTimer.current)
      }, [])
      const [expanded, setExpanded] = useState(() => new Set())
      const [confirmId, setConfirmId] = useState(null)
      const [confirmClear, setConfirmClear] = useState(false)
      const [expandedDescs, setExpandedDescs] = useState(new Set())
      const [showPaste, setShowPaste] = useState(false)
      const [pasteText, setPasteText] = useState('')
      const [qqLinkText, setQqLinkText] = useState('')
      const [qqBusy, setQqBusy] = useState(false)
      const [extractBusy, setExtractBusy] = useState(false)
      const [bookmarkName, setBookmarkName] = useState('')
      const [bookmarkHtml, setBookmarkHtml] = useState('')
      const [bookmarkPreview, setBookmarkPreview] = useState(null)
      const [bookmarkSelected, setBookmarkSelected] = useState(() => new Set())
      const [bookmarkBusy, setBookmarkBusy] = useState(false)
      const [showBookmarkPaste, setShowBookmarkPaste] = useState(false)
      const [bookmarkPasteText, setBookmarkPasteText] = useState('')
      const bookmarkRequest = useRef(0)
      const toggleRow = id => setExpanded(previous => {
        const next = new Set(previous)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
      const toggleDesc = key => setExpandedDescs(previous => {
        const next = new Set(previous)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
      const allExpanded = rows.length > 0 && rows.every(item => expanded.has(item.id))
      const toggleAll = () => setExpanded(allExpanded ? new Set() : new Set(rows.map(item => item.id)))
      // 解析在宿主后台逐夹执行（一次整夹调用）；只要还有解析中的收藏夹就静默轮询。
      const analyzing = rows.some(item => item.status === 'analyzing')
      useEffect(() => {
        if (!analyzing) return undefined
        const timer = setInterval(() => { void onPoll({ type: 'collections.list' }) }, 2000)
        return () => clearInterval(timer)
      }, [analyzing, onPoll])

      const parseLink = async () => {
        const url = linkText.trim()
        if (url === '') { setCardNotice({ kind: 'error', text: t('colLinkEmpty') }); return }
        setImporting(true)
        setCardNotice(null)
        try {
          const cookie = cookieText.trim()
          const result = await onAction({ type: 'collections.parseLink', url, ...(cookie !== '' ? { cookie } : {}) })
          const link = result?.linkResult
          if (link === undefined) { setCardNotice({ kind: 'ok', text: t('colLinkDone', '', 0, 0, 0) }); return }
          setCardNotice({
            kind: link.valid > 0 ? 'ok' : 'error',
            text: t('colLinkDone', link.folder ?? '', link.fetched, link.dropped, link.valid),
          })
          if (link.valid > 0) { setLinkText(''); setCookieText('') }
        } catch (error) {
          setCardNotice({ kind: 'error', text: `${t('colLinkError')}${error instanceof Error ? error.message : String(error)}` })
        } finally {
          setImporting(false)
        }
      }
      const parseQQ = async () => {
        const url = qqLinkText.trim()
        if (url === '') { setCardNotice({ kind: 'error', text: t('colQQLinkEmpty') }); return }
        setQqBusy(true)
        setCardNotice(null)
        try {
          const result = await onAction({ type: 'collections.parseLink', url })
          const link = result?.linkResult
          if (link === undefined) { setCardNotice({ kind: 'ok', text: t('colLinkDone', '', 0, 0, 0) }); return }
          setCardNotice({
            kind: link.valid > 0 ? 'ok' : 'error',
            text: t('colLinkDone', link.folder ?? '', link.fetched, link.dropped, link.valid),
          })
          if (link.valid > 0) setQqLinkText('')
        } catch (error) {
          setCardNotice({ kind: 'error', text: `${t('colLinkError')}${error instanceof Error ? error.message : String(error)}` })
        } finally {
          setQqBusy(false)
        }
      }
      // 浏览器收藏夹：文件只在本地读取，原文发给宿主解析成分类预览；确认后再落库。
      // 每次预览带一个请求序号：连续选择两个文件时，先到后到的旧响应不会覆盖新预览。
      const resetBookmarkPreview = () => {
        setBookmarkName('')
        setBookmarkHtml('')
        setBookmarkPreview(null)
        setBookmarkSelected(new Set())
      }
      const loadBookmarkHtml = async (html, name) => {
        const request = bookmarkRequest.current + 1
        bookmarkRequest.current = request
        setBookmarkBusy(true)
        setCardNotice(null)
        try {
          const result = await onAction({ type: 'collections.previewBookmarks', html, ...(name !== '' ? { fileName: name } : {}) })
          if (request !== bookmarkRequest.current) return
          const preview = result?.bookmarkPreview
          if (!preview || !Array.isArray(preview.groups)) throw new Error(t('colBrowserPreviewFailed'))
          if (preview.groups.length === 0) {
            resetBookmarkPreview()
            setCardNotice({ kind: 'error', text: t('colBrowserEmpty') })
            return
          }
          setBookmarkName(name)
          setBookmarkHtml(html)
          setBookmarkPreview(preview)
          setBookmarkSelected(new Set(preview.groups.map(group => group.name)))
        } catch (error) {
          if (request !== bookmarkRequest.current) return
          resetBookmarkPreview()
          setCardNotice({ kind: 'error', text: `${t('colBrowserPreviewFailed')}${error instanceof Error ? error.message : String(error)}` })
        } finally {
          if (request === bookmarkRequest.current) setBookmarkBusy(false)
        }
      }
      const chooseBookmarkFile = async event => {
        const file = event.target.files && event.target.files[0]
        if (!file) return
        const input = event.target
        if (!/\.html?$/i.test(file.name) && file.type !== 'text/html') {
          setCardNotice({ kind: 'error', text: t('colBrowserBadFile') })
          input.value = ''
          return
        }
        if (file.size > BOOKMARK_FILE_MAX_BYTES) {
          setCardNotice({ kind: 'error', text: t('colBrowserTooLarge') })
          input.value = ''
          return
        }
        const request = bookmarkRequest.current + 1
        bookmarkRequest.current = request
        resetBookmarkPreview()
        try {
          const html = await file.text()
          if (request !== bookmarkRequest.current) return
          await loadBookmarkHtml(html, file.name)
        } catch (error) {
          if (request !== bookmarkRequest.current) return
          resetBookmarkPreview()
          setCardNotice({ kind: 'error', text: `${t('colBrowserPreviewFailed')}${error instanceof Error ? error.message : String(error)}` })
        } finally {
          input.value = ''
        }
      }
      const parseBookmarkPaste = async () => {
        const html = bookmarkPasteText.trim()
        if (html === '') { setCardNotice({ kind: 'error', text: t('colBrowserEmpty') }); return }
        await loadBookmarkHtml(html, '')
      }
      const toggleBookmarkGroup = name => setBookmarkSelected(previous => {
        const next = new Set(previous)
        if (next.has(name)) next.delete(name)
        else next.add(name)
        return next
      })
      const bookmarkGroups = bookmarkPreview?.groups ?? []
      const allBookmarkGroupsSelected = bookmarkGroups.length > 0 && bookmarkGroups.every(group => bookmarkSelected.has(group.name))
      const toggleAllBookmarkGroups = () => {
        setBookmarkSelected(allBookmarkGroupsSelected ? new Set() : new Set(bookmarkGroups.map(group => group.name)))
      }
      const importSelectedBookmarks = async () => {
        if (bookmarkHtml === '' || bookmarkPreview === null) return
        const selected = bookmarkGroups.filter(group => bookmarkSelected.has(group.name)).map(group => group.name)
        if (selected.length === 0) { setCardNotice({ kind: 'error', text: t('colBrowserSelectRequired') }); return }
        setBookmarkBusy(true)
        setCardNotice(null)
        try {
          const result = await onAction({ type: 'collections.importBookmarks', html: bookmarkHtml, selected, ...(bookmarkName !== '' ? { fileName: bookmarkName } : {}) })
          const imported = result?.bookmarkResult
          flashCardNotice({
            kind: 'ok',
            text: t('colBrowserImported', imported?.imported ?? selected.length, imported?.items ?? 0),
          })
          setBookmarkName('')
          setBookmarkPasteText('')
          setShowBookmarkPaste(false)
          bookmarkRequest.current += 1
          resetBookmarkPreview()
        } catch (error) {
          setCardNotice({ kind: 'error', text: `${t('colBrowserImportError')}${error instanceof Error ? error.message : String(error)}` })
        } finally {
          setBookmarkBusy(false)
        }
      }
      const analyze = async id => {
        try { await onAction({ type: 'collections.analyze', id }) } catch { /* runAction 已上报失败。 */ }
      }
      const importExtractedPayload = async (raw, preferredUrl) => {
        let payload
        try {
          payload = JSON.parse(String(raw))
        } catch {
          throw new Error(t('colExtractBadJson'))
        }
        if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !Array.isArray(payload.items)) throw new Error(t('colExtractBadJson'))
        const payloadUrl = typeof payload.sourceUrl === 'string' ? payload.sourceUrl.trim() : ''
        const url = payloadUrl || (preferredUrl ?? '').trim()
        if (url === '') throw new Error(t('colExtractNeedLink'))
        const result = await onAction({ type: 'collections.importPayload', url, payload })
        const link = result?.linkResult
        if (link === undefined) {
          setCardNotice({ kind: 'ok', text: t('colExtractImported', payload.folder ?? '', payload.items.length) })
          return
        }
        setCardNotice({
          kind: link.valid > 0 ? 'ok' : 'error',
          text: t('colLinkDone', link.folder ?? '', link.fetched, link.dropped, link.valid),
        })
        if (link.valid > 0) {
          setLinkText('')
          setPasteText('')
          setShowPaste(false)
        }
      }
      const importFromClipboard = async () => {
        setExtractBusy(true)
        setCardNotice(null)
        try {
          const text = await readClipboardText()
          if (typeof text !== 'string' || text.trim() === '') throw new Error(t('colExtractEmpty'))
          await importExtractedPayload(text, linkText)
        } catch (error) {
          setCardNotice({ kind: 'error', text: `${t('colExtractImportError')}${error instanceof Error ? error.message : String(error)}` })
        } finally {
          setExtractBusy(false)
        }
      }
      const importPasted = async () => {
        if (pasteText.trim() === '') {
          setCardNotice({ kind: 'error', text: t('colExtractEmpty') })
          return
        }
        setExtractBusy(true)
        setCardNotice(null)
        try {
          await importExtractedPayload(pasteText, linkText)
        } catch (error) {
          setCardNotice({ kind: 'error', text: `${t('colExtractImportError')}${error instanceof Error ? error.message : String(error)}` })
        } finally {
          setExtractBusy(false)
        }
      }
      const copyScript = async (code, copiedKey) => {
        const ok = await copyText(code)
        setCardNotice({ kind: ok ? 'ok' : 'error', text: ok ? t(copiedKey) : t('colZhihuCopyFailed') })
      }
      const analyzeAll = async () => {
        try { await onAction({ type: 'collections.analyzeAll' }) } catch { /* runAction 已上报失败。 */ }
      }
      const remove = async id => {
        try {
          await onAction({ type: 'collections.remove', id })
          setConfirmId(null)
          notice({ kind: 'ok', text: t('colRemoved') })
        } catch { /* runAction 已上报失败。 */ }
      }
      const clearAll = async () => {
        if (!confirmClear) { setConfirmClear(true); return }
        try {
          const result = await onAction({ type: 'collections.removeAll' })
          setConfirmClear(false)
          const removed = result?.removeResult
          notice({ kind: 'ok', text: t('colRemovedAll', removed?.removed ?? rows.length, removed?.removedKnowledge ?? 0) })
        } catch { /* runAction 已上报失败。 */ }
      }
      const actionable = rows.some(item => item.status === 'pending' || item.status === 'failed')
      return h('div', null,
        h('div', { className: 'pa-field-head pa-col-header' },
          h('span', { className: 'pa-subtitle' }, t('colTitle')),
          h('span', { className: 'pa-field-badge' }, t('colCount', data.collectionCount ?? 0)),
          rows.length > 0 ? h('button', {
            className: 'pa-fav-act pa-fav-act--toggle',
            onClick: toggleAll,
            disabled: busy,
            'aria-expanded': allExpanded ? 'true' : 'false',
          }, `${allExpanded ? t('colCollapseAll') : t('colExpandAll')} (${rows.length})`) : null,
          h('button', {
            className: 'pa-fav-act pa-fav-act--analyze pa-fav-act--all',
            onClick: () => { void analyzeAll() },
            disabled: busy || !actionable,
            'data-pa-tip': actionable ? undefined : t('colAnalyzeAllDisabled'),
          }, t('colAnalyzeAll')),
          rows.length > 0 ? h('button', {
            className: `pa-fav-act pa-fav-act--delete${confirmClear ? ' pa-fav-act--delete-armed' : ''}`,
            onClick: () => { void clearAll() },
            disabled: busy,
          }, confirmClear ? t('colRemoveAllConfirm') : t('colRemoveAll')) : null,
        ),
        // 外部收藏夹导入：B 站/知乎/QQ 音乐/小红书并排，浏览器收藏夹卡片独占一行，各自保留所需操作，说明文字压到一行。
        h('div', { className: 'pa-col-platforms' },
          h('div', { className: 'pa-col-platform-card pa-col-platform-card--bilibili' },
            h('div', { className: 'pa-col-platform-card-head' },
              h(BiliIcon, { size: 22 }),
              h('span', { className: 'pa-col-platform-card-name' }, t('colPlatformBilibili')),
              h('span', { className: 'pa-col-platform-card-tag' }, t('colBiliTag')),
            ),
            h('input', {
              className: 'pa-col-url',
              type: 'text',
              value: linkText,
              placeholder: t('colBiliLinkPlaceholder'),
              onChange: event => setLinkText(event.target.value),
              spellCheck: false,
            }),
            h('input', {
              className: 'pa-col-url',
              type: 'password',
              value: cookieText,
              placeholder: t('colBiliCookiePlaceholder'),
              onChange: event => setCookieText(event.target.value),
              autoComplete: 'off',
              spellCheck: false,
            }),
            h('div', { className: 'pa-col-platform-card-actions' },
              h('button', {
                className: 'pa-fav-act pa-fav-act--analyze',
                onClick: () => { void parseLink() },
                disabled: busy || importing,
              }, importing ? t('colParsingLink') : t('colParseLink')),
            ),
            h('p', { className: 'pa-col-platform-card-hint' }, t('colBiliHint')),
          ),
          h('div', { className: 'pa-col-platform-card pa-col-platform-card--zhihu' },
            h('div', { className: 'pa-col-platform-card-head' },
              h(ZhihuIcon, { size: 22 }),
              h('span', { className: 'pa-col-platform-card-name' }, t('colPlatformZhihu')),
              h('span', { className: 'pa-col-platform-card-tag' }, t('colZhihuTag')),
              h('a', {
                className: 'pa-col-platform-card-link',
                href: 'https://www.zhihu.com/collections/mine',
                target: '_blank',
                rel: 'noopener noreferrer',
              }, t('colZhihuOpenMine')),
            ),
            h('div', { className: 'pa-col-platform-card-actions' },
              h('a', {
                className: 'pa-col-bookmarklet',
                href: ZHIHU_BOOKMARKLET,
                draggable: true,
                onClick: event => {
                  event.preventDefault()
                  setCardNotice({ kind: 'ok', text: t('colZhihuDragHint') })
                },
                onDragStart: event => {
                  try {
                    event.dataTransfer.setData('text/uri-list', ZHIHU_BOOKMARKLET)
                    event.dataTransfer.setData('text/plain', ZHIHU_BOOKMARKLET)
                  } catch { /* Some browsers restrict drag data; the href still carries the bookmark. */ }
                },
                'data-pa-tip': t('colZhihuDragHint'),
              }, t('colZhihuBookmark')),
              h('button', {
                className: 'pa-fav-act pa-fav-act--analyze',
                onClick: () => { void importFromClipboard() },
                disabled: busy || extractBusy,
              }, t('colZhihuImportClipboard')),
            ),
            h('div', { className: 'pa-col-platform-card-actions pa-col-platform-card-actions--text' },
              h('button', {
                className: 'pa-col-textbtn',
                onClick: () => { void copyScript(ZHIHU_EXTRACT_CODE, 'colZhihuScriptCopied') },
                disabled: busy,
              }, t('colZhihuCopyScript')),
              h('button', {
                className: 'pa-col-textbtn',
                onClick: () => setShowPaste(value => !value),
                disabled: busy,
              }, showPaste ? t('colZhihuHidePaste') : t('colZhihuShowPaste')),
            ),
            h('p', { className: 'pa-col-platform-card-hint' }, t('colZhihuHint')),
          ),
          h('div', { className: 'pa-col-platform-card pa-col-platform-card--qqmusic' },
            h('div', { className: 'pa-col-platform-card-head' },
              h(QQMusicIcon, { size: 22 }),
              h('span', { className: 'pa-col-platform-card-name' }, t('colPlatformQQMusic')),
              h('span', { className: 'pa-col-platform-card-tag' }, t('colQQTag')),
            ),
            h('input', {
              className: 'pa-col-url',
              type: 'text',
              value: qqLinkText,
              placeholder: t('colQQLinkPlaceholder'),
              onChange: event => setQqLinkText(event.target.value),
              spellCheck: false,
            }),
            h('div', { className: 'pa-col-platform-card-actions' },
              h('button', {
                className: 'pa-fav-act pa-fav-act--analyze',
                onClick: () => { void parseQQ() },
                disabled: busy || qqBusy,
              }, qqBusy ? t('colParsingLink') : t('colParseLink')),
            ),
            h('p', { className: 'pa-col-platform-card-hint' }, t('colQQHint')),
          ),
          h('div', { className: 'pa-col-platform-card pa-col-platform-card--xiaohongshu' },
            h('div', { className: 'pa-col-platform-card-head' },
              h(XiaohongshuIcon, { size: 22 }),
              h('span', { className: 'pa-col-platform-card-name' }, t('colPlatformXiaohongshu')),
              h('span', { className: 'pa-col-platform-card-tag' }, t('colXhsTag')),
            ),
            h('div', { className: 'pa-col-platform-card-actions' },
              h('a', {
                className: 'pa-col-bookmarklet',
                href: XHS_BOOKMARKLET,
                draggable: true,
                onClick: event => {
                  event.preventDefault()
                  setCardNotice({ kind: 'ok', text: t('colXhsDragHint') })
                },
                onDragStart: event => {
                  try {
                    event.dataTransfer.setData('text/uri-list', XHS_BOOKMARKLET)
                    event.dataTransfer.setData('text/plain', XHS_BOOKMARKLET)
                  } catch { /* Some browsers restrict drag data; the href still carries the bookmark. */ }
                },
                'data-pa-tip': t('colXhsDragHint'),
              }, t('colXhsBookmark')),
              h('button', {
                className: 'pa-fav-act pa-fav-act--analyze',
                onClick: () => { void importFromClipboard() },
                disabled: busy || extractBusy,
              }, t('colZhihuImportClipboard')),
            ),
            h('div', { className: 'pa-col-platform-card-actions pa-col-platform-card-actions--text' },
              h('button', {
                className: 'pa-col-textbtn',
                onClick: () => { void copyScript(XHS_EXTRACT_CODE, 'colXhsScriptCopied') },
                disabled: busy,
              }, t('colZhihuCopyScript')),
              h('button', {
                className: 'pa-col-textbtn',
                onClick: () => setShowPaste(value => !value),
                disabled: busy,
              }, showPaste ? t('colZhihuHidePaste') : t('colZhihuShowPaste')),
            ),
            h('p', { className: 'pa-col-platform-card-hint' }, t('colXhsHint')),
          ),
          h('div', { className: `pa-col-platform-card pa-col-platform-card--browser${bookmarkReady ? '' : ' pa-col-platform-card--disabled'}` },
            h('div', { className: 'pa-col-platform-card-head' },
              h(BrowserSourceIcon, { source: bookmarkPreview?.source?.label, size: 22 }),
              h('span', { className: 'pa-col-platform-card-name' }, t('colPlatformBrowser')),
              h('span', { className: 'pa-col-platform-card-tag' }, t('colBrowserTag')),
            ),
            bookmarkReady ? null : h('p', { className: 'pa-col-platform-card-hint pa-settings-error' }, t('colBrowserRestartRequired')),
            h('div', { className: 'pa-col-platform-card-actions' },
              h('label', { className: 'pa-col-filebtn', 'data-pa-tip': t('colBrowserHint') },
                bookmarkBusy ? t('colBrowserBusy') : (bookmarkName || t('colBrowserChoose')),
                h('input', {
                  type: 'file',
                  accept: '.html,.htm,text/html',
                  onChange: event => { void chooseBookmarkFile(event) },
                  disabled: !bookmarkReady || busy || bookmarkBusy,
                }),
              ),
              h('button', {
                className: 'pa-col-textbtn',
                onClick: () => setShowBookmarkPaste(value => !value),
                disabled: !bookmarkReady || busy || bookmarkBusy,
              }, showBookmarkPaste ? t('colBrowserHidePaste') : t('colBrowserPaste')),
            ),
            h('p', { className: 'pa-col-platform-card-hint' }, t('colBrowserHint')),
            showBookmarkPaste ? h('div', { className: 'pa-col-browser-preview' },
              h('textarea', {
                className: 'pa-col-textarea',
                value: bookmarkPasteText,
                placeholder: t('colBrowserPastePlaceholder'),
                onChange: event => setBookmarkPasteText(event.target.value),
                spellCheck: false,
              }),
              h('div', { className: 'pa-col-browser-actions' },
                h('button', {
                  className: 'pa-fav-act pa-fav-act--analyze',
                  onClick: () => { void parseBookmarkPaste() },
                  disabled: !bookmarkReady || busy || bookmarkBusy || bookmarkPasteText.trim() === '',
                }, t('colBrowserParsePaste')),
              ),
            ) : null,
            bookmarkPreview ? h('div', { className: 'pa-col-browser-preview' },
              h('div', { className: 'pa-col-browser-preview-head' },
                h('span', { className: 'pa-col-browser-preview-title' },
                  t('colBrowserPreviewTitle', bookmarkGroups.length, bookmarkPreview.validCount ?? 0)),
                bookmarkPreview.source?.label ? h('span', { className: 'pa-field-badge pa-col-browser-source' },
                  h(BrowserSourceIcon, { source: bookmarkPreview.source.label, size: 14 }),
                  `${t('colBrowserSource')} ${bookmarkPreview.source.label}`) : null,
                h('button', {
                  className: 'pa-col-textbtn',
                  onClick: toggleAllBookmarkGroups,
                  disabled: !bookmarkReady || busy || bookmarkBusy,
                }, allBookmarkGroupsSelected ? t('colBrowserSelectNone') : t('colBrowserSelectAll')),
                h('span', { className: 'pa-col-browser-selected' },
                  t('colBrowserSelected', bookmarkSelected.size, bookmarkGroups.length)),
              ),
              (bookmarkPreview.skippedCount ?? 0) > 0 ? h('span', { className: 'pa-col-browser-preview-note' },
                t('colBrowserPreviewSkipped', bookmarkPreview.skippedCount)) : null,
              h('div', { className: 'pa-col-browser-groups' },
                bookmarkGroups.map(group => h('label', { className: 'pa-col-browser-group', key: group.name },
                  h('input', {
                    type: 'checkbox',
                    checked: bookmarkSelected.has(group.name),
                    onChange: () => toggleBookmarkGroup(group.name),
                    disabled: !bookmarkReady || busy || bookmarkBusy,
                  }),
                  h('span', { className: 'pa-col-browser-group-name', 'data-pa-tip': group.samples?.length ? `${group.name}：${group.samples.join('、')}`.slice(0, 180) : group.name }, group.name),
                  h('span', { className: 'pa-col-browser-group-count' }, t('colBrowserGroupCount', group.count)),
                )),
              ),
              h('div', { className: 'pa-col-browser-actions' },
                h('button', {
                  className: 'pa-fav-act pa-fav-act--analyze',
                  onClick: () => { void importSelectedBookmarks() },
                  disabled: !bookmarkReady || busy || bookmarkBusy || bookmarkSelected.size === 0,
                }, bookmarkBusy ? t('colBrowserImporting') : t('colBrowserImport')),
              ),
            ) : null,
          ),
        ),
        extractBusy ? h('p', { className: 'pa-col-import-hint' }, t('colZhihuImporting')) : null,
        showPaste ? h('div', { className: 'pa-col-paste pa-col-paste--shared' },
          h('textarea', {
            className: 'pa-col-textarea',
            value: pasteText,
            placeholder: t('colExtractPastePlaceholder'),
            onChange: event => setPasteText(event.target.value),
            spellCheck: false,
          }),
          h('button', {
            className: 'pa-fav-act pa-fav-act--analyze',
            onClick: () => { void importPasted() },
            disabled: busy || extractBusy || pasteText.trim() === '',
          }, t('colZhihuImportPaste')),
        ) : null,
        cardNotice ? h('p', { className: cardNotice.kind === 'error' ? 'pa-settings-error' : 'pa-settings-ok' }, cardNotice.text) : null,
        h('div', { className: 'pa-col-imported-head' },
          h('span', { className: 'pa-subtitle' }, t('colImportedTitle')),
          h('span', { className: 'pa-pref-meta' }, t('colImportedHint')),
        ),
        h('div', { className: 'pa-settings-card pa-fav-scroll' },
          rows.length === 0 ? h('div', { className: 'pa-pref-row' }, h('span', { className: 'pa-pref-meta' }, t('colEmpty'))) : null,
          rows.map(folder => {
            const open = expanded.has(folder.id)
            const items = Array.isArray(folder.items) ? folder.items : []
            const covers = [...new Set(items.map(item => item.cover).filter(source => typeof source === 'string' && source !== ''))].slice(0, 3)
            const zhihu = folder.platform === 'zhihu'
            const xiaohongshu = folder.platform === 'xiaohongshu'
            const qqmusic = folder.platform === 'qqmusic'
            const browser = folder.platform === 'browser'
            const bodyLike = zhihu || xiaohongshu
            const metaParts = [
              folder.createdAt ? `${t('colImportedAt')} ${formatTime(folder.createdAt)}` : null,
              folder.analyzedAt ? `${t('colParsedAt')} ${formatTime(folder.analyzedAt)}` : null,
            ].filter(Boolean)
            const metaChildren = [
              metaParts.length > 0 ? metaParts.join(' · ') : null,
              browser && folder.upper ? h('span', { className: 'pa-field-badge pa-col-source-badge', 'data-pa-tip': folder.upper }, `${t('colBrowserSource')} ${folder.upper}`) : null,
              folder.sourceUrl ? h('a', {
                className: 'pa-col-source',
                href: folder.sourceUrl,
                target: '_blank',
                rel: 'noopener noreferrer',
                'data-pa-tip': folder.sourceUrl,
              }, collectionSourceLabel(folder)) : browser ? h('span', { className: 'pa-col-source' }, collectionSourceLabel(folder)) : null,
            ].filter(Boolean)
            return h('div', { className: `pa-pref-row pa-fav-row pa-col-folder pa-col-platform--${folder.platform ?? 'other'}${open ? ' pa-fav-row--open' : ''}`, key: folder.id },
              h('div', { className: 'pa-pref-head pa-fav-row-head' },
                h('button', {
                  className: 'pa-fav-fold',
                  type: 'button',
                  onClick: () => toggleRow(folder.id),
                  'aria-expanded': open ? 'true' : 'false',
                  'aria-label': open ? t('colCollapse') : t('colExpand'),
                },
                h('span', { className: `pa-fav-caret${open ? ' pa-fav-caret--open' : ''}`, 'aria-hidden': 'true' }, '▾'),
                h('span', null, open ? t('colCollapse') : t('colExpand')),
                ),
                h(CollectionPlatformIcon, { platform: folder.platform, source: folder.upper, size: 18 }),
                h('span', { className: 'pa-pref-key pa-col-title', 'data-pa-tip': folder.folder, 'data-pa-tip-truncate': '' }, folder.folder),
                covers.length > 0 ? h('span', { className: 'pa-col-cover-strip' },
                  covers.map((source, index) => h('img', {
                    key: `${folder.id}-cover-${index}`,
                    src: source,
                    alt: '',
                    loading: 'lazy',
                    referrerPolicy: 'no-referrer',
                    onError: hideBrokenImage,
                  })),
                ) : null,
                h('span', { className: 'pa-field-badge' }, t('colValidN', folder.itemCount ?? items.length)),
                folder.dropped > 0 ? h('span', { className: 'pa-field-badge' }, t('colDroppedN', folder.dropped)) : null,
                h('span', { className: 'pa-field-badge' }, collectionStatusLabel(folder.status)),
                folder.status === 'analyzed' && folder.knowledgeIds?.length ? h('span', { className: 'pa-field-badge' }, t('colKnowledgeN', folder.knowledgeIds.length)) : null,
                folder.status === 'analyzed' && preferenceCountOf(folder) ? h('span', { className: 'pa-field-badge' }, t('colPreferenceN', preferenceCountOf(folder))) : null,
                folder.status === 'analyzed' ? h('button', {
                  className: 'pa-fav-act pa-fav-act--analyzed',
                  onClick: () => { void analyze(folder.id) },
                  disabled: busy,
                  'data-pa-tip': t('colReanalyzeReplaceHint'),
                }, t('colReanalyze')) : h('button', {
                  className: `pa-fav-act pa-fav-act--${folder.status === 'analyzing' ? 'analyzing' : folder.status === 'failed' ? 'retry' : 'analyze'}`,
                  onClick: () => { void analyze(folder.id) },
                  disabled: busy || folder.status === 'analyzing',
                }, folder.status === 'analyzing' ? t('colAnalyzing') : folder.status === 'failed' ? t('colRetry') : t('colParseFolder')),
                h('button', {
                  className: `pa-fav-act pa-fav-act--delete${confirmId === folder.id ? ' pa-fav-act--delete-armed' : ''}`,
                  onClick: () => { void (confirmId === folder.id ? remove(folder.id) : setConfirmId(folder.id)) },
                  disabled: busy,
                }, confirmId === folder.id ? t('confirmDelete') : t('delete')),
              ),
              open ? h('div', { className: 'pa-fav-body' },
                items.length === 0 ? h('div', { className: 'pa-pref-meta' }, t('colEmptyItems')) : null,
                items.map((item, index) => {
                  const descKey = `${folder.id}-${index}`
                  const descOpen = expandedDescs.has(descKey)
                  const canExpandDesc = bodyLike && typeof item.description === 'string' && item.description.length > 80
                  return h('div', { className: 'pa-col-item', key: `${folder.id}-${index}` },
                  h('div', { className: 'pa-col-item-main' },
                    h('span', { className: 'pa-col-item-idx' }, `${index + 1}`),
                    item.cover ? h('img', {
                      className: 'pa-col-item-thumb',
                      src: item.cover,
                      alt: '',
                      loading: 'lazy',
                      referrerPolicy: 'no-referrer',
                      onError: hideBrokenImage,
                    }) : null,
                    h('div', { className: 'pa-col-item-content' },
                      h('div', { className: 'pa-col-item-head' },
                        h('span', { className: 'pa-col-item-title', 'data-pa-tip': item.title, 'data-pa-tip-truncate': '' }, item.title),
                        COLLECTION_ITEM_KIND_KEYS[item.kind]
                          ? h('span', { className: 'pa-field-badge pa-col-kind' }, t(COLLECTION_ITEM_KIND_KEYS[item.kind]))
                          : null,
                        item.author ? h('span', { className: 'pa-col-item-author' }, item.author) : null,
                      ),
                  qqmusic && (item.album || item.releasedAt) ? h('div', { className: 'pa-col-extra' },
                    item.album ? h('span', null, h('span', { className: 'pa-col-extra-label' }, `${t('colAlbum')} `), item.album) : null,
                    item.album && item.releasedAt ? ' · ' : '',
                    item.releasedAt ? h('span', null, h('span', { className: 'pa-col-extra-label' }, `${t('colReleased')} `), item.releasedAt) : null,
                  ) : null,
                  item.description ? h('div', { className: `pa-col-desc${bodyLike && !descOpen ? ' pa-col-desc--clamp' : ''}` },
                    h('span', { className: 'pa-col-desc-label' }, t(bodyLike ? 'colBodyLabel' : 'colDescLabel')),
                    h('span', { className: 'pa-col-desc-text' }, item.description),
                  ) : null,
                  canExpandDesc ? h('button', {
                    className: 'pa-col-desc-toggle',
                    type: 'button',
                    onClick: () => toggleDesc(descKey),
                  }, descOpen ? t('colCollapseBody') : t('colExpandBody')) : null,
                  item.tags?.length || ((xiaohongshu || browser) && item.releasedAt) ? h('div', { className: 'pa-col-meta-row' },
                    item.tags?.length ? h('div', { className: 'pa-col-tags' }, item.tags.map(tag => h('span', { className: 'pa-field-badge', key: tag }, tag))) : null,
                    (xiaohongshu || browser) && item.releasedAt ? h('span', { className: 'pa-col-published' },
                      h('span', { className: 'pa-col-extra-label' }, `${t(browser ? 'colSavedAt' : 'colPublished')} `), item.releasedAt,
                    ) : null,
                  ) : null,
                  h('div', { className: 'pa-col-item-foot' },
                    item.url ? h('a', {
                      className: 'pa-col-link',
                      href: collectionWebUrl(item.url),
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      'data-pa-tip': collectionWebUrl(item.url),
                    }, displayLink(collectionWebUrl(item.url))) : h('span', { className: 'pa-col-link pa-col-link--empty' }),
                    h('div', { className: 'pa-col-item-stats' },
                      ...(zhihu ? [
                        Number.isFinite(item.read) ? h('span', null, `${t('colReads')} ${formatCount(item.read)}`) : null,
                        Number.isFinite(item.voteup) ? h('span', null, `${t('colVoteups')} ${formatCount(item.voteup)}`) : null,
                        Number.isFinite(item.comment) ? h('span', null, `${t('colComments')} ${formatCount(item.comment)}`) : null,
                        Number.isFinite(item.favorite) ? h('span', null, `${t('colFavorites')} ${formatCount(item.favorite)}`) : null,
                      ] : qqmusic ? [
                        Number.isFinite(item.duration) ? h('span', { className: 'pa-col-duration' }, formatDuration(item.duration)) : null,
                      ] : xiaohongshu ? [
                        Number.isFinite(item.like) ? h('span', null, `${t('colLikes')} ${formatCount(item.like)}`) : null,
                        Number.isFinite(item.favorite) ? h('span', null, `${t('colFavorites')} ${formatCount(item.favorite)}`) : null,
                        Number.isFinite(item.comment) ? h('span', null, `${t('colComments')} ${formatCount(item.comment)}`) : null,
                      ] : [
                        Number.isFinite(item.duration) ? h('span', { className: 'pa-col-duration' }, formatDuration(item.duration)) : null,
                        Number.isFinite(item.play) ? h('span', null, `${t('colPlays')} ${formatCount(item.play)}`) : null,
                        Number.isFinite(item.like) ? h('span', null, `${t('colLikes')} ${formatCount(item.like)}`) : null,
                        Number.isFinite(item.favorite) ? h('span', null, `${t('colFavorites')} ${formatCount(item.favorite)}`) : null,
                        Number.isFinite(item.danmaku) ? h('span', null, `${t('colDanmaku')} ${formatCount(item.danmaku)}`) : null,
                      ]),
                    ),
                  ),
                ),
              ),
            )}),
                folder.analyzeError ? h('div', { className: 'pa-fav-error', 'data-pa-tip': folder.analyzeError }, `${t('colError')}${folder.analyzeError}`) : null,
              ) : null,
              h('div', { className: 'pa-pref-meta pa-fav-meta' },
                metaChildren.flatMap((node, index) => index === 0 ? [node] : [' · ', node]),
              ),
            )
          }),
        ),
      )
    }

    function wakeStatusLabel(entry) {
      if (entry.taskStatus === 'completed') return t('wakeTaskCompleted')
      if (entry.taskStatus === 'cancelled') return t('wakeTaskCancelled')
      if (entry.scheduleStatus === 'active') return t('wakeStatusArmed')
      if (entry.scheduleStatus === 'off') return t('wakeStatusOff')
      if (entry.scheduleStatus === 'gone') return t('wakeStatusGone')
      return t('wakeStatusInactive')
    }

    const wakeOpen = entry => !['completed', 'cancelled', 'disabling'].includes(entry.taskStatus)

    function WakeListCard({ snapshot, onRefresh, busy }) {
      const wakes = snapshot.wakes ?? {}
      const entries = Array.isArray(wakes.entries) ? wakes.entries : []
      const [filter, setFilter] = useState('active')
      const shown = filter === 'active'
        ? entries.filter(entry => wakeOpen(entry) && entry.scheduleStatus === 'active')
        : entries
      return h('div', null,
        h('div', { className: 'pa-field-head' },
          h('span', { className: 'pa-subtitle' }, t('wakeListTitle')),
          h('button', { className: 'pa-field-reset', onClick: onRefresh, disabled: busy }, t('wakeRefresh')),
        ),
        h('p', { className: 'pa-settings-desc' }, t('wakeListDesc')),
        wakes.available === true ? h('div', { className: 'pa-settings-card' },
          h('div', { className: 'pa-wake-filters' },
            h('button', {
              className: `pa-wake-filter${filter === 'active' ? ' pa-wake-filter--on' : ''}`,
              onClick: () => setFilter('active'),
            }, t('wakeFilterActive')),
            h('button', {
              className: `pa-wake-filter${filter === 'all' ? ' pa-wake-filter--on' : ''}`,
              onClick: () => setFilter('all'),
            }, t('wakeFilterAll')),
          ),
          shown.length === 0 ? h('div', { className: 'pa-pref-row' }, h('span', { className: 'pa-pref-meta' }, t('wakeEmpty'))) : null,
          shown.map(entry => h('div', { className: 'pa-pref-row', key: entry.id },
            h('div', { className: 'pa-pref-head' },
              h('span', { className: 'pa-field-badge' }, entry.kind === 'routine' ? t('wakeKindRoutine') : t('wakeKindTask')),
              h('span', { className: 'pa-pref-key' }, entry.title),
              h('span', { className: 'pa-field-badge' }, wakeStatusLabel(entry)),
            ),
            h('div', { className: 'pa-pref-meta' },
              [
                entry.scheduledAt ? `${t('wakeNext')}: ${formatTime(entry.scheduledAt)}` : null,
                entry.dueAt ? `${t('wakeDue')}: ${formatTime(entry.dueAt)}` : null,
                entry.lastDeliveryAt ? `${t('wakeLast')}: ${formatTime(entry.lastDeliveryAt)}` : null,
                entry.sessionId ? `${t('wakeSession')}: ${String(entry.sessionId).slice(-8)}` : null,
              ].filter(Boolean).join(' · '),
            ),
          )),
        ) : h('p', { className: 'pa-settings-desc' }, t('wakeUnavailable')),
      )
    }

    // 偏好分类的视觉元数据：中文单字/英文缩写做字形，固定色调做分组识别。
    const PREF_CATEGORY_TONES = {
      travel: '#3b82f6', food: '#f59e0b', schedule: '#8b5cf6', communication: '#06b6d4',
      work: '#64748b', health: '#10b981', finance: '#eab308', clothing: '#ec4899',
      sports: '#22c55e', media: '#f43f5e', learning: '#6366f1', shopping: '#f97316',
      other: '#94a3b8',
    }

    function PreferencesCard({ snapshot, onAction, notice, busy }) {
      const rows = Array.isArray(snapshot.preferences?.preferences) ? snapshot.preferences.preferences : []
      const total = typeof snapshot.preferences?.preferenceCount === 'number' ? snapshot.preferences.preferenceCount : rows.length
      const [confirmId, setConfirmId] = useState(null)
      const [form, setForm] = useState({ key: '', situation: '', value: '', category: 'other' })
      const [editingId, setEditingId] = useState(null)
      const [adding, setAdding] = useState(false)
      const [mode, setMode] = useState('all')
      const [collapsedRows, setCollapsedRows] = useState(() => new Set())
      const [collapsedGroups, setCollapsedGroups] = useState(() => new Set())

      const categoryMeta = t('prefCategoryMeta') || {}
      const metaOf = category => categoryMeta[category] ?? { label: category }
      const toneOf = category => PREF_CATEGORY_TONES[category] ?? PREF_CATEGORY_TONES.other

      // 就地编辑：把该行内容填进下方表单，保存后退出编辑态。
      const startEdit = row => {
        setEditingId(row.id)
        setForm({ key: row.key, situation: row.situation ?? '', value: row.value, category: row.category ?? 'other' })
      }
      const cancelEdit = () => {
        setEditingId(null)
        setForm({ key: '', situation: '', value: '', category: 'other' })
      }

      useEffect(() => {
        if (confirmId === null) return undefined
        const timer = setTimeout(() => setConfirmId(null), 3000)
        return () => clearTimeout(timer)
      }, [confirmId])

      const remove = async id => {
        if (confirmId !== id) { setConfirmId(id); return }
        setConfirmId(null)
        try {
          await onAction({ type: 'preference.delete', id })
        } catch { /* runAction already reported the failure. */ }
      }

      const add = async () => {
        const key = form.key.trim()
        const value = form.value.trim()
        if (key === '') return notice({ kind: 'error', text: t('badPrefKey') })
        if (value === '') return notice({ kind: 'error', text: t('badPrefValue') })
        setAdding(true)
        try {
          await onAction({
            type: 'preference.set',
            key,
            value,
            ...(form.situation.trim() === '' ? {} : { situation: form.situation.trim() }),
            category: form.category,
          })
          setForm({ key: '', situation: '', value: '', category: 'other' })
          setEditingId(null)
          notice({ kind: 'ok', text: t('saved') })
        } catch { /* runAction already reported the failure. */ }
        setAdding(false)
      }

      const categories = t('categories')
      const categoryOptions = Array.isArray(categories) ? categories : ['other']
      // 分类选择器按「核心 8 类 → 次要 4 类 → 其他」分组；分组顺序同时决定卡片分组顺序。
      const categoriesByTier = tier => categoryOptions.filter(category => (metaOf(category).tier ?? 'other') === tier)
      const categoryGroups = [
        { key: 'core', label: t('prefCategoryCore'), categories: categoriesByTier('core') },
        { key: 'secondary', label: t('prefCategorySecondary'), categories: categoriesByTier('secondary') },
      ].filter(group => group.categories.length > 0)
      const categoryFallbacks = categoriesByTier('other')
      const categoryRank = new Map(categoryOptions.map((category, index) => [category, index]))
      const rankOf = category => categoryRank.get(category) ?? categoryOptions.length
      const stableCount = rows.filter(row => !row.situation).length
      const situationalCount = rows.length - stableCount
      const domainCount = new Set(rows.map(row => row.category || 'other')).size
      const confidenceValues = rows.map(row => row.confidence).filter(value => typeof value === 'number' && Number.isFinite(value))
      const averageConfidence = confidenceValues.length > 0
        ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
        : null
      const visible = rows.filter(row => mode === 'all' || (mode === 'stable' ? !row.situation : Boolean(row.situation)))

      const grouped = new Map()
      for (const row of visible) {
        const category = row.category || 'other'
        if (!grouped.has(category)) grouped.set(category, [])
        grouped.get(category).push(row)
      }
      const groups = [...grouped.entries()]
        .map(([category, items]) => ({ category, items, meta: metaOf(category), tone: toneOf(category) }))
        .sort((a, b) => rankOf(a.category) - rankOf(b.category) || b.items.length - a.items.length || a.meta.label.localeCompare(b.meta.label))
      for (const group of groups) {
        group.items.sort((a, b) => (Number(b.confidence) || 0) - (Number(a.confidence) || 0) || String(b.updatedAt).localeCompare(String(a.updatedAt)))
      }

      const toggleGroup = category => {
        const opening = collapsedGroups.has(category)
        setCollapsedGroups(previous => {
          const next = new Set(previous)
          if (next.has(category)) next.delete(category)
          else next.add(category)
          return next
        })
        // 与知识库一致：展开分组时同时展开组内各行；收起分组保留行状态。
        if (!opening) return
        const target = groups.find(group => group.category === category)
        if (!target) return
        setCollapsedRows(previous => {
          const next = new Set(previous)
          for (const item of target.items) next.delete(item.id)
          return next
        })
      }
      const sourceLabel = source => {
        const value = String(source ?? '')
        if (value.startsWith('collection:')) return t('prefSourceCollection')
        if (value.toLowerCase().includes('panel')) return t('prefSourcePanel')
        if (value.toLowerCase().includes('owner') || value.toLowerCase().includes('explicit')) return t('prefSourceOwner')
        return value
      }
      const filters = [
        { key: 'all', label: t('prefFilterAll'), count: rows.length },
        { key: 'stable', label: t('prefFilterStable'), count: stableCount },
        { key: 'situational', label: t('prefFilterSituational'), count: situationalCount },
      ]
      const allOpen = visible.length > 0
        && visible.every(row => !collapsedRows.has(row.id))
        && groups.every(group => !collapsedGroups.has(group.category))
      const toggleRow = id => setCollapsedRows(previous => {
        const next = new Set(previous)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
      const toggleAll = () => {
        if (allOpen) {
          setCollapsedRows(new Set(visible.map(row => row.id)))
          setCollapsedGroups(new Set(groups.map(group => group.category)))
        } else {
          setCollapsedRows(new Set())
          setCollapsedGroups(new Set())
        }
      }

      return h('div', null,
        h('div', { className: 'pa-field-head' },
          h('span', { className: 'pa-subtitle' }, t('prefTitle')),
          h('span', { className: 'pa-field-badge' }, t('prefCount', total, rows.length)),
        ),
        h('p', { className: 'pa-settings-desc' }, t('prefDesc')),
        h('div', { className: 'pa-settings-card' },
          statStrip([
            { key: 'total', label: t('prefStatTotal'), value: rows.length },
            { key: 'domains', label: t('prefStatDomains'), value: domainCount },
            { key: 'situational', label: t('prefStatSituational'), value: situationalCount },
            { key: 'confidence', label: t('prefStatConfidence'), value: averageConfidence === null ? '—' : averageConfidence.toFixed(2) },
          ]),
          h('div', { className: 'pa-list-toolbar' },
            filterPills(filters, mode, setMode),
            visible.length > 0 ? h('button', {
              className: 'pa-fav-act pa-fav-act--toggle',
              type: 'button',
              onClick: toggleAll,
              'aria-expanded': allOpen ? 'true' : 'false',
            }, `${allOpen ? t('favCollapseAll') : t('favExpandAll')} (${visible.length})`) : null,
          ),
          rows.length === 0 ? h('div', { className: 'pa-pref-empty' }, h('span', { className: 'pa-pref-meta' }, t('prefEmpty'))) : null,
          visible.length === 0 && rows.length > 0 ? h('div', { className: 'pa-pref-empty' }, h('span', { className: 'pa-pref-meta' }, t('prefFilterEmpty'))) : null,
          groups.map(group => {
            const groupOpen = !collapsedGroups.has(group.category)
            return h('section', { className: 'pa-pref-group', key: group.category },
              h('button', {
                className: 'pa-pref-group-head',
                type: 'button',
                onClick: () => toggleGroup(group.category),
                'aria-expanded': groupOpen ? 'true' : 'false',
                style: { '--pref-tone': group.tone },
              },
              h('span', { className: 'pa-pref-group-glyph' }, prefCategoryIcon(group.category, 18)),
              h('span', { className: 'pa-pref-group-name' }, group.meta.label),
              group.meta.scope
                ? h('span', {
                  className: 'pa-pref-group-desc pa-pref-group-scope',
                  'data-pa-tip': group.meta.boundary ? `${group.meta.scope}。易混边界：${group.meta.boundary}` : group.meta.scope,
                  'data-pa-tip-truncate': '',
                }, group.meta.scope)
                : null,
              h('span', { className: 'pa-pref-group-count' }, group.items.length),
              h('span', { className: `pa-pref-group-caret${groupOpen ? ' pa-pref-group-caret--open' : ''}`, 'aria-hidden': 'true' }, '▾'),
              ),
              groupOpen ? group.items.map(row => {
                const open = !collapsedRows.has(row.id)
                const crumbs = String(row.key ?? '').split('.').filter(Boolean)
                return h('div', { className: `pa-pref-row pa-fav-row${open ? ' pa-fav-row--open' : ''}`, key: row.id, style: { '--pref-tone': group.tone } },
                  h('div', { className: 'pa-pref-head pa-fav-row-head' },
                    h('button', {
                      className: 'pa-fav-fold',
                      type: 'button',
                      onClick: () => toggleRow(row.id),
                      'aria-expanded': open ? 'true' : 'false',
                      'aria-label': open ? t('prefCollapse') : t('prefExpand'),
                    },
                    h('span', { className: `pa-fav-caret${open ? ' pa-fav-caret--open' : ''}`, 'aria-hidden': 'true' }, '▾'),
                    h('span', null, open ? t('prefCollapse') : t('prefExpand')),
                    ),
                    h('div', { className: 'pa-pref-crumbs' },
                      crumbs.flatMap((crumb, index) => [
                        index > 0 ? h('span', { key: `${row.id}-sep-${index}`, className: 'pa-pref-crumb-sep', 'aria-hidden': 'true' }, '›') : null,
                        h('span', { key: `${row.id}-crumb-${index}`, className: 'pa-pref-crumb' }, crumb),
                      ]).filter(Boolean),
                    ),
                    confidenceMeter(row.confidence, null, t('prefConfidence')),
                    h('span', { className: `pa-field-badge${row.situation ? ' pa-fav-cat' : ''}` }, row.situation ? `${t('prefSituational')} · ${row.situation}` : t('prefStable')),
                    h('span', { className: 'pa-knowledge-actions' },
                      h('button', {
                        className: 'pa-fav-act pa-fav-act--edit',
                        type: 'button',
                        onClick: () => startEdit(row),
                        disabled: adding,
                      }, t('favEdit')),
                      h('button', {
                        className: `pa-fav-act pa-fav-act--delete${confirmId === row.id ? ' pa-fav-act--delete-armed' : ''}`,
                        type: 'button',
                        onClick: () => { void remove(row.id) },
                        disabled: adding || busy === true,
                      }, confirmId === row.id ? t('confirmDelete') : t('delete')),
                    ),
                  ),
                  h('div', { className: 'pa-pref-item-foot' },
                    h('span', { className: 'pa-pref-chip pa-pref-chip--source', 'data-pa-tip': String(row.source ?? '') }, sourceLabel(row.source)),
                    row.updatedAt ? h('span', { className: 'pa-pref-chip pa-pref-chip--time' }, `${t('knowledgeUpdated')} ${formatTime(row.updatedAt)}`) : null,
                  ),
                  open ? h('div', { className: 'pa-fav-body' },
                    h('div', { className: 'pa-pref-value' }, row.value),
                  ) : null,
                )
              }) : null,
            )
          }),
          h('div', { className: 'pa-pref-form' },
            h('div', { className: 'pa-pref-form-title' }, editingId ? t('prefFormEdit') : t('prefFormAdd')),
            h('div', { className: 'pa-pref-form-grid' },
              h('label', { className: 'pa-pref-field pa-pref-field--key' },
                h('span', { className: 'pa-pref-field-label' }, t('prefKeyLabel')),
                h('input', {
                  className: 'pa-pref-input', type: 'text', placeholder: t('prefKey'),
                  value: form.key, onChange: event => setForm(previous => ({ ...previous, key: event.target.value })), disabled: adding,
                }),
              ),
              h('label', { className: 'pa-pref-field pa-pref-field--situation' },
                h('span', { className: 'pa-pref-field-label' }, t('prefSituationLabel')),
                h('input', {
                  className: 'pa-pref-input', type: 'text', placeholder: t('prefSituation'),
                  value: form.situation, onChange: event => setForm(previous => ({ ...previous, situation: event.target.value })), disabled: adding,
                }),
              ),
              h('label', { className: 'pa-pref-field pa-pref-field--category' },
                h('span', { className: 'pa-pref-field-label' }, t('prefCategory')),
                h(PaSelect, {
                  value: form.category,
                  onChange: category => setForm(previous => ({ ...previous, category })),
                  disabled: adding,
                  ariaLabel: t('prefCategory'),
                  icon: prefCategoryIcon(form.category, 16),
                  tone: toneOf(form.category),
                  groups: [
                    ...categoryGroups.map(group => ({
                      label: group.label,
                      options: group.categories.map(category => ({ value: category, label: metaOf(category).label, icon: prefCategoryIcon(category, 14) })),
                    })),
                    ...(categoryFallbacks.length > 0 ? [{ label: t('prefCategoryOtherGroup'), options: categoryFallbacks.map(category => ({ value: category, label: metaOf(category).label, icon: prefCategoryIcon(category, 14) })) }] : []),
                  ],
                }),
              ),
            ),
            h('label', { className: 'pa-pref-field pa-pref-field--wide' },
              h('span', { className: 'pa-pref-field-label' }, t('prefValueLabel')),
              h('textarea', {
                className: 'pa-pref-input pa-pref-input--value', placeholder: t('prefValue'),
                value: form.value, onChange: event => setForm(previous => ({ ...previous, value: event.target.value })), disabled: adding,
              }),
            ),
            h('div', { className: 'pa-pref-form-actions' },
              h('button', { className: 'pa-pref-add', onClick: () => { void add() }, disabled: adding }, adding ? t('prefAdding') : editingId ? t('saveEdit') : t('prefAddBtn')),
              editingId ? h('button', { className: 'pa-pref-act pa-pref-act--cancel', onClick: cancelEdit, disabled: adding }, t('favCancel')) : null,
            ),
          ),
        ),
      )
    }

    function KnowledgeCard({ snapshot, onAction, notice, busy }) {
      const allRows = Array.isArray(snapshot.knowledge?.knowledge) ? snapshot.knowledge.knowledge : []
      const total = typeof snapshot.knowledge?.knowledgeCount === 'number' ? snapshot.knowledge.knowledgeCount : allRows.length
      const [query, setQuery] = useState('')
      const [kindFilter, setKindFilter] = useState('all')
      const [genreFilter, setGenreFilter] = useState('all')
      const [confirmId, setConfirmId] = useState(null)
      const [adding, setAdding] = useState(false)
      const [form, setForm] = useState({ kind: 'event', basis: 'stated', title: '', content: '', tags: '' })
      const [expanded, setExpanded] = useState(() => new Set())
      const [sortMode, setSortMode] = useState('kind')
      const [collapsedGroups, setCollapsedGroups] = useState(() => new Set())
      const normalized = query.trim().toLocaleLowerCase()
      // 先按 kind/关键词得到基础集合，再按 genre 做分面筛选；分类计数随基础集合变化。
      const baseRows = allRows.filter(row => {
        if (kindFilter !== 'all' && row.kind !== kindFilter) return false
        if (normalized === '') return true
        return [row.title, row.content, ...(row.tags || [])].some(value => String(value || '').toLocaleLowerCase().includes(normalized))
      })
      const genreCounts = new Map()
      for (const row of baseRows) {
        const genre = row.genre || '__none__'
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1)
      }
      const genreOptions = [
        { key: 'all', label: t('wakeFilterAll'), count: baseRows.length },
        ...KNOWLEDGE_GENRE_ORDER.filter(genre => genreCounts.has(genre)).map(genre => ({ key: genre, label: genre, count: genreCounts.get(genre) })),
        ...(genreCounts.has('__none__') ? [{ key: '__none__', label: t('knowledgeUncategorized'), count: genreCounts.get('__none__') }] : []),
      ]
      const rows = baseRows.filter(row => genreFilter === 'all'
        || (genreFilter === '__none__' ? !row.genre : row.genre === genreFilter))
      const toggleRow = id => setExpanded(previous => {
        const next = new Set(previous)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })

      useEffect(() => {
        if (confirmId === null) return undefined
        const timer = setTimeout(() => setConfirmId(null), 3000)
        return () => clearTimeout(timer)
      }, [confirmId])

      const add = async () => {
        const title = form.title.trim()
        const content = form.content.trim()
        if (title === '') return notice({ kind: 'error', text: t('knowledgeBadTitle') })
        if (content === '') return notice({ kind: 'error', text: t('knowledgeBadContent') })
        setAdding(true)
        try {
          await onAction({
            type: 'knowledge.create',
            kind: form.kind,
            basis: form.basis,
            title,
            content,
            tags: form.tags.split(/[,，]/).map(value => value.trim()).filter(Boolean),
          })
          setForm({ kind: 'event', basis: 'stated', title: '', content: '', tags: '' })
          notice({ kind: 'ok', text: t('saved') })
        } catch { /* runAction already reported the failure. */ }
        setAdding(false)
      }

      const archive = async row => {
        try {
          await onAction({ type: 'knowledge.archive', id: row.id, expected_updated_at: row.updatedAt })
          notice({ kind: 'ok', text: t('knowledgeArchived') })
        } catch { /* runAction already reported the failure. */ }
      }

      const remove = async row => {
        if (confirmId !== row.id) { setConfirmId(row.id); return }
        setConfirmId(null)
        try {
          await onAction({ type: 'knowledge.delete', id: row.id, expected_updated_at: row.updatedAt })
          notice({ kind: 'ok', text: t('deleted') })
        } catch { /* runAction already reported the failure. */ }
      }

      const kindCount = new Set(allRows.map(row => row.kind)).size
      const genreCount = new Set(allRows.map(row => row.genre).filter(Boolean)).size
      const confidenceValues = allRows.map(row => row.confidence).filter(value => typeof value === 'number' && Number.isFinite(value))
      const averageConfidence = confidenceValues.length > 0 ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length : null
      const kinds = Array.isArray(t('knowledgeKinds')) ? t('knowledgeKinds') : []
      const bases = Array.isArray(t('knowledgeBases')) ? t('knowledgeBases') : []
      const knowledgeSourceLabel = source => {
        if (typeof source !== 'string' || source === '') return ''
        if (source === 'owner') return t('knowledgeSourceOwner')
        if (source.startsWith('collection:')) {
          const id = source.slice('collection:'.length)
          const folder = snapshot.collections?.collections?.find(item => item.id === id)?.folder
          return folder ? t('knowledgeSourceCollectionNamed', folder) : t('knowledgeSourceCollection')
        }
        if (source.startsWith('favorite:')) return t('knowledgeSourceFavorite')
        return source
      }

      const kindHelp = kind => {
        const key = KIND_HELP_KEYS[kind]
        return key ? t(key) : ''
      }
      // 默认按属性（kind）分组；也可切到按分类（genre）或最近更新。
      // 组按数量降序，组内按置信度再按更新时间。
      const groupKeyOf = row => sortMode === 'kind' ? (row.kind || '__none__') : (row.genre || '__none__')
      const groupMetaOf = key => {
        if (sortMode === 'kind') {
          const kind = key === '__none__' ? '' : key
          const label = kind ? kindLabel(kind) : t('knowledgeUncategorized')
          const scopes = t('kindScopes')
          return {
            label,
            desc: kind ? kindHelp(kind) : '',
            scope: kind && scopes && typeof scopes === 'object' ? (scopes[kind] ?? '') : '',
            icon: kindIcon(kind || 'unknown', 18),
            tone: KIND_TONES[kind] ?? KNOWLEDGE_FALLBACK_TONE,
          }
        }
        const genre = key === '__none__' ? '' : key
        return { label: genre || t('knowledgeUncategorized'), icon: tagIcon(18), tone: KNOWLEDGE_GENRE_TONES[genre] ?? KNOWLEDGE_FALLBACK_TONE }
      }
      const grouped = new Map()
      for (const row of rows) {
        const key = groupKeyOf(row)
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key).push(row)
      }
      const groups = [...grouped.entries()]
        .map(([key, items]) => ({
          key,
          ...groupMetaOf(key),
          items: [...items].sort((a, b) => (Number(b.confidence) || 0) - (Number(a.confidence) || 0) || String(b.updatedAt).localeCompare(String(a.updatedAt))),
        }))
        .sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label))
      // 全局按钮同时管理“分组是否展开”和“行是否展开”，两者不再各自为政。
      const groupTokens = sortMode === 'recent' ? [] : groups.map(group => `${sortMode}:${group.key}`)
      const allExpanded = knowledgeAllExpanded(rows.map(row => row.id), groupTokens, expanded, collapsedGroups)
      const toggleAll = () => {
        if (allExpanded) {
          setExpanded(new Set())
          setCollapsedGroups(new Set(groupTokens))
        } else {
          setExpanded(new Set(rows.map(row => row.id)))
          setCollapsedGroups(new Set())
        }
      }
      const toggleGroup = key => {
        const token = `${sortMode}:${key}`
        const opening = collapsedGroups.has(token)
        setCollapsedGroups(previous => {
          const next = new Set(previous)
          if (next.has(token)) next.delete(token)
          else next.add(token)
          return next
        })
        // 展开分组时顺带展开组内所有行：分组展开一次就能看到内容，不用再逐条点开。
        // 收起分组不重置行的展开状态，再次展开时恢复原样。
        if (!opening) return
        const target = groups.find(group => group.key === key)
        if (!target) return
        setExpanded(previous => {
          const next = new Set(previous)
          for (const item of target.items) next.add(item.id)
          return next
        })
      }

      const renderRow = row => {
        const open = expanded.has(row.id)
        const sourceLabel = knowledgeSourceLabel(row.source)
        const parsedSource = typeof row.source === 'string' && /^(collection|favorite):/.test(row.source)
        const genreTone = KNOWLEDGE_GENRE_TONES[row.genre] ?? KNOWLEDGE_FALLBACK_TONE
        const kindTone = KIND_TONES[row.kind] ?? KNOWLEDGE_FALLBACK_TONE
        const meta = [
          row.domain ? `${t('knowledgeDomain')} ${row.domain}` : null,
          row.scene ? `${t('knowledgeScene')} ${row.scene}` : null,
          row.occurredAt ? `${t('knowledgeOccurred')} ${formatTime(row.occurredAt)}` : null,
          sourceLabel ? `${t('knowledgeSource')} ${sourceLabel}` : null,
          row.updatedAt ? `${parsedSource ? t('knowledgeParsedUpdated') : t('knowledgeUpdated')} ${formatTime(row.updatedAt)}` : null,
          // 列表行不再常驻来源类型与状态；展开后仍可核对这两个字段。
          open ? `${t('knowledgeBasis')} ${row.basis}` : null,
          open ? `${row.status}` : null,
        ].filter(Boolean).join(' · ')
        return h('div', { className: `pa-pref-row pa-fav-row${open ? ' pa-fav-row--open' : ''}`, key: row.id },
          h('div', { className: 'pa-pref-head pa-fav-row-head pa-fav-row-head--nowrap' },
            h('button', {
              className: 'pa-fav-fold',
              type: 'button',
              onClick: () => toggleRow(row.id),
              'aria-expanded': open ? 'true' : 'false',
              'aria-label': open ? t('knowledgeCollapse') : t('knowledgeExpand'),
            },
            h('span', { className: `pa-fav-caret${open ? ' pa-fav-caret--open' : ''}`, 'aria-hidden': 'true' }, '▾'),
            h('span', null, open ? t('knowledgeCollapse') : t('knowledgeExpand')),
            ),
            h('span', { className: 'pa-pref-key pa-col-title', 'data-pa-tip': row.title, 'data-pa-tip-truncate': '' }, row.title),
            // 置信度和操作留在标题同一行右侧；来源类型与状态属于低频信息，收进展开后再说。
            confidenceMeter(row.confidence, kindTone, t('prefConfidence')),
            h('span', { className: 'pa-knowledge-actions' },
              h('button', { className: 'pa-pref-act pa-pref-act--archive', onClick: () => { void archive(row) }, disabled: busy || adding }, t('knowledgeArchive')),
              h('button', { className: 'pa-pref-act pa-pref-act--delete', onClick: () => { void remove(row) }, disabled: busy || adding }, confirmId === row.id ? t('confirmDelete') : t('delete')),
            ),
          ),
          h('div', { className: 'pa-col-tags pa-knowledge-tags', style: { '--genre-tone': genreTone, '--kind-tone': kindTone } },
            h('span', {
              className: 'pa-attribute-tag pa-kind-badge',
              tabIndex: 0,
              'aria-label': `${t('knowledgeAttributePrefix')} · ${kindLabel(row.kind)}: ${kindHelp(row.kind)}`,
              'data-pa-tip': `${kindLabel(row.kind)}：${kindHelp(row.kind)}`,
            },
            kindIcon(row.kind, 12),
            `${t('knowledgeAttributePrefix')} · ${kindLabel(row.kind)}`,
            ),
            row.genre ? h('button', {
              className: `pa-genre-tag${genreFilter === row.genre ? ' pa-genre-tag--active' : ''}`,
              type: 'button',
              onClick: () => setGenreFilter(genreFilter === row.genre ? 'all' : row.genre),
            },
            h('span', { className: 'pa-genre-dot', 'aria-hidden': 'true' }),
            `${t('knowledgeTypePrefix')} · ${row.genre}`,
            ) : null,
            ...(row.tags ?? []).map(tag => h('span', { className: 'pa-knowledge-tag', key: tag }, tag)),
          ),
          open ? h('div', { className: 'pa-fav-body' },
            (() => {
              const segments = knowledgeContentLines(row.content)
              if (!segments) return h('div', { className: 'pa-pref-value' }, row.content)
              return h('div', { className: 'pa-pref-value' }, segments.map((item, index) => (item.segment
                ? h('div', { className: 'pa-kn-line pa-kn-line--seg', key: index },
                  h('span', { className: 'pa-kn-seg' }, item.segment),
                  h('span', { className: 'pa-kn-seg-text' }, item.text))
                : h('div', { className: 'pa-kn-line', key: index }, item.text))))
            })(),
          ) : null,
          h('div', { className: 'pa-pref-meta pa-fav-meta' }, meta),
        )
      }

      return h('div', null,
        h('div', { className: 'pa-field-head' },
          h('span', { className: 'pa-subtitle' }, t('knowledgeTitle')),
          h('span', { className: 'pa-field-badge' }, t('knowledgeCount', total, allRows.length)),
        ),
        h('div', { className: 'pa-knowledge-desc' },
          h('p', null, t('knowledgeDescIntro')),
          h('p', null, richText(t('knowledgeDescAttribute'))),
          h('p', null, richText(t('knowledgeDescType'))),
          h('p', null, t('knowledgeDescView')),
          h('p', { className: 'pa-knowledge-desc-note' }, t('knowledgeDescNote')),
        ),
        h('div', { className: 'pa-settings-card' },
          statStrip([
            { key: 'total', label: t('knowledgeStatTotal'), value: allRows.length },
            { key: 'kinds', label: t('knowledgeStatKinds'), value: kindCount },
            { key: 'genres', label: t('knowledgeStatGenres'), value: genreCount },
            { key: 'confidence', label: t('knowledgeStatConfidence'), value: averageConfidence === null ? '—' : averageConfidence.toFixed(2) },
          ]),
          h('div', { className: 'pa-knowledge-tools' },
            h('input', { className: 'pa-pref-input pa-knowledge-search', type: 'search', placeholder: t('knowledgeSearch'), value: query, onChange: event => setQuery(event.target.value) }),
            h(PaSelect, {
              className: 'pa-knowledge-kind-filter',
              value: kindFilter,
              onChange: setKindFilter,
              ariaLabel: t('knowledgeStatKinds'),
              groups: [
                { label: t('wakeFilterAll'), options: [{ value: 'all', label: t('wakeFilterAll') }] },
                ...KIND_FAMILIES.map(family => ({
                  label: t(family.labelKey),
                  options: family.kinds.map(kind => ({ value: kind, label: kindLabel(kind), icon: kindIcon(kind, 14) })),
                })),
              ],
            }),
            h('div', { className: 'pa-sort-toggle' },
              h('span', { className: 'pa-sort-label' }, t('knowledgeSortBy')),
              filterPills([
                { key: 'kind', label: t('knowledgeSortKind') },
                { key: 'genre', label: t('knowledgeSortGenre') },
                { key: 'recent', label: t('knowledgeSortRecent') },
              ], sortMode, setSortMode),
            ),
            rows.length > 0 ? h('button', {
              className: 'pa-fav-act pa-fav-act--toggle',
              type: 'button',
              onClick: toggleAll,
              disabled: busy,
              'aria-expanded': allExpanded ? 'true' : 'false',
            }, `${allExpanded ? t('knowledgeCollapseAll') : t('knowledgeExpandAll')} (${rows.length})`) : null,
          ),
          genreOptions.length > 1 ? h('div', { className: 'pa-genre-filter' },
            h('span', { className: 'pa-filter-label' }, t('knowledgeGenreFilter')),
            filterPills(genreOptions, genreFilter, setGenreFilter),
          ) : null,
          h('div', { className: 'pa-fav-scroll pa-knowledge-list' },
            rows.length === 0 ? h('div', { className: 'pa-pref-row' }, h('span', { className: 'pa-pref-meta' }, t('knowledgeEmpty'))) : null,
            allRows.length > 0 && rows.length === 0 ? h('div', { className: 'pa-pref-row' }, h('span', { className: 'pa-pref-meta' }, t('listFilterEmpty'))) : null,
            sortMode !== 'recent'
              ? groups.map(group => {
                const open = !collapsedGroups.has(`${sortMode}:${group.key}`)
                return h('section', { className: 'pa-pref-group', key: group.key },
                  h('button', {
                    className: 'pa-pref-group-head',
                    type: 'button',
                    onClick: () => toggleGroup(group.key),
                    'aria-expanded': open ? 'true' : 'false',
                    style: { '--pref-tone': group.tone },
                  },
                  h('span', { className: 'pa-pref-group-glyph' }, group.icon),
                  h('span', { className: 'pa-pref-group-name' }, group.label),
                  group.scope
                    ? h('span', { className: 'pa-pref-group-desc pa-pref-group-scope', 'data-pa-tip': group.desc, 'data-pa-tip-truncate': '' }, group.scope)
                    : null,
                  h('span', { className: 'pa-pref-group-count' }, group.items.length),
                  h('span', { className: `pa-pref-group-caret${open ? ' pa-pref-group-caret--open' : ''}`, 'aria-hidden': 'true' }, '▾'),
                  ),
                  open ? group.items.map(renderRow) : null,
                )
              })
              : rows.map(renderRow),
          ),
          h('div', { className: 'pa-pref-form' },
            h('div', { className: 'pa-pref-form-row' },
              h(PaSelect, {
                className: 'pa-knowledge-kind-select',
                value: form.kind,
                onChange: kind => setForm(previous => ({ ...previous, kind })),
                disabled: adding || busy,
                ariaLabel: t('knowledgeKind'),
                icon: kindIcon(form.kind, 16),
                tone: KIND_TONES[form.kind] ?? KNOWLEDGE_FALLBACK_TONE,
                options: kinds.map(kind => ({ value: kind, label: kindLabel(kind), icon: kindIcon(kind, 14) })),
              }),
              h(PaSelect, {
                className: 'pa-knowledge-basis-select',
                value: form.basis,
                onChange: basis => setForm(previous => ({ ...previous, basis })),
                disabled: adding || busy,
                ariaLabel: t('knowledgeBasis'),
                icon: tagIcon(14),
                options: bases.map(basis => ({ value: basis, label: basis })),
              }),
              h('input', { className: 'pa-pref-input pa-pref-input--key', type: 'text', placeholder: t('knowledgeTitleInput'), value: form.title, onChange: event => setForm(previous => ({ ...previous, title: event.target.value })), disabled: adding || busy }),
            ),
            h('textarea', { className: 'pa-pref-input pa-pref-input--value', placeholder: t('knowledgeContent'), value: form.content, onChange: event => setForm(previous => ({ ...previous, content: event.target.value })), disabled: adding || busy }),
            h('div', { className: 'pa-pref-form-row' },
              h('input', { className: 'pa-pref-input pa-pref-input--key', type: 'text', placeholder: t('knowledgeTags'), value: form.tags, onChange: event => setForm(previous => ({ ...previous, tags: event.target.value })), disabled: adding || busy }),
              h('button', { className: 'pa-pref-add', onClick: () => { void add() }, disabled: adding || busy }, adding ? t('prefAdding') : t('knowledgeAdd')),
            ),
          ),
        ),
      )
    }

    function SettingsSection() {
      const [state, setState] = useState(null)
      const [failed, setFailed] = useState(false)
      const [drafts, setDrafts] = useState({})
      const [busy, setBusy] = useState(false)
      const [notice, setNotice] = useState(null)
      const requestGeneration = useRef(0)

      const refresh = () => {
        const generation = ++requestGeneration.current
        fetchPanelState().then(
          snapshot => {
            if (generation !== requestGeneration.current) return
            setState(snapshot)
            setFailed(false)
          },
          () => {
            if (generation !== requestGeneration.current) return
            // Only the initial load may fall to the dead-end screen; a later
            // refresh failure keeps the last snapshot and surfaces an error.
            if (state === null) setFailed(true)
            else setNotice({ kind: 'error', text: t('refreshFailed') })
          },
        )
      }

      useEffect(refresh, [])

      if (failed) {
        return h('div', { className: 'pa-settings' },
          h('div', { className: 'pa-settings-note' },
            t('loadFailed'), ' ',
            h('button', { className: 'pa-field-reset', onClick: () => { setFailed(false); refresh() } }, t('retry')),
          ),
        )
      }
      if (state === null) {
        return h('div', { className: 'pa-settings' }, h('div', { className: 'pa-settings-note' }, t('loading')))
      }

      const value = state.config && typeof state.config === 'object' ? state.config : {}
      const overridden = new Set(Array.isArray(state.overridden) ? state.overridden : [])
      const onDraft = (key, next) => setDrafts(previous => ({ ...previous, [key]: next }))

      const save = async () => {
        setBusy(true)
        setNotice(null)
        let generation = null
        try {
          const patch = {}
          for (const field of FIELDS) {
            if (drafts[field.key] === undefined) continue
            let next = drafts[field.key]
            if (field.kind === 'number') {
              const parsed = Number(next)
              if (next === '' || !Number.isFinite(parsed) || parsed < 0 || parsed > MAX_LEAD_MINUTES) {
                setNotice({ kind: 'error', text: t('badLead') })
                return
              }
              next = Math.floor(parsed)
            }
            if (field.key === 'cron' && String(next).trim().split(/\s+/).length !== 5) {
              setNotice({ kind: 'error', text: t('badCron') })
              return
            }
            patch[field.key] = field.kind === 'boolean' ? next === true : next
          }
          generation = ++requestGeneration.current
          const snapshot = await postPanelAction({ type: 'set', patch })
          if (generation !== requestGeneration.current) return
          setState(snapshot)
          setDrafts({})
          setNotice({ kind: 'ok', text: t('saved') })
        } catch (error) {
          if (generation === null || generation === requestGeneration.current) setNotice({ kind: 'error', text: `${t('saveFailed')}: ${error instanceof Error ? error.message : String(error)}` })
        } finally {
          setBusy(false)
        }
      }

      const resetField = async key => {
        setBusy(true)
        setNotice(null)
        const generation = ++requestGeneration.current
        try {
          const snapshot = await postPanelAction({ type: 'unset', keys: [key] })
          if (generation !== requestGeneration.current) return
          setState(snapshot)
          setDrafts(previous => { const next = { ...previous }; delete next[key]; return next })
        } catch (error) {
          if (generation === requestGeneration.current) setNotice({ kind: 'error', text: `${t('saveFailed')}: ${error instanceof Error ? error.message : String(error)}` })
        } finally {
          setBusy(false)
        }
      }

      const hasDrafts = Object.keys(drafts).length > 0
      const runAction = async action => {
        setBusy(true)
        setNotice(null)
        const generation = ++requestGeneration.current
        try {
          const snapshot = await postPanelAction(action)
          if (generation === requestGeneration.current) setState(snapshot)
          return snapshot
        } catch (error) {
          if (generation === requestGeneration.current) setNotice({ kind: 'error', text: `${t('saveFailed')}: ${error instanceof Error ? error.message : String(error)}` })
          throw error
        } finally {
          setBusy(false)
        }
      }
      // 轮询用：不置 busy、不打扰 notice，只静默刷新快照（解析后台运行时跟踪进度）。
      const silentAction = async action => {
        const generation = ++requestGeneration.current
        try {
          const snapshot = await postPanelAction(action)
          if (generation !== requestGeneration.current) return null
          setState(snapshot)
          return snapshot
        } catch {
          if (generation === requestGeneration.current) setNotice({ kind: 'error', text: t('refreshFailed') })
          return null
        }
      }
      return h('div', { className: 'pa-settings' },
        h('div', { className: 'pa-field-head' }, h('span', { className: 'pa-subtitle' }, t('wakeTitle'))),
        h('p', { className: 'pa-settings-desc' }, t('sectionDesc')),
        h('div', { className: 'pa-settings-card' },
          FIELDS.map(field => {
            const current = drafts[field.key] !== undefined ? drafts[field.key] : value[field.key]
            return h('div', { className: 'pa-field', key: field.key },
              h('div', { className: 'pa-field-head' },
                h('span', { className: 'pa-field-label' }, t(field.labelKey)),
                overridden.has(field.key) ? h('span', { className: 'pa-field-badge' }, t('overridden')) : null,
                h('button', {
                  className: 'pa-field-reset',
                  onClick: () => { void resetField(field.key) },
                  disabled: busy || !overridden.has(field.key),
                }, t('reset')),
              ),
              fieldControl(field, current, onDraft, busy),
              h('div', { className: 'pa-field-hint' }, t(field.hintKey)),
            )
          }),
        ),
        h('div', { className: 'pa-settings-actions' },
          h('button', {
            className: 'pa-settings-save',
            onClick: () => { void save() },
            disabled: busy || !hasDrafts,
          }, busy ? t('saving') : t('save')),
          notice ? h('span', { className: notice.kind === 'error' ? 'pa-settings-error' : 'pa-settings-ok' }, notice.text) : null,
        ),
        h(ProactiveSourcesCard, { snapshot: state, onAction: runAction, busy }),
        h(WakeListCard, { snapshot: state, onRefresh: refresh, busy }),
        h(PreferencesCard, { snapshot: state, onAction: runAction, notice: next => setNotice(next), busy }),
        h(KnowledgeCard, { snapshot: state, onAction: runAction, notice: next => setNotice(next), busy }),
        h(FavoritesCard, { snapshot: state, onAction: runAction, onPoll: silentAction, notice: next => setNotice(next), busy }),
        h(CollectionsCard, { snapshot: state, onAction: runAction, onPoll: silentAction, notice: next => setNotice(next), busy }),
      )
    }

    var inject = ['slots']

    /** 自身或任一后代被省略号截断（横向省略或纵向裁剪）时返回 true。 */
    function isTruncated(element) {
      if (!element) return false
      if (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1) return true
      for (const child of element.querySelectorAll('*')) {
        if (child.scrollWidth > child.clientWidth + 1 || child.scrollHeight > child.clientHeight + 1) return true
      }
      return false
    }

    /**
     * 说明卡是否值得弹出：空文案、与元素可见文字完全相同、或「仅为展示被截断的全文」但并未截断时都不弹。
     * @param input - { text, visibleText, truncateOnly, truncated }
     * @returns 是否应该展示。
     */
    function hoverTipWorthShowing(input) {
      const value = String(input?.text ?? '').trim()
      if (value === '') return false
      if (input?.truncateOnly === true) return input?.truncated === true
      const visible = String(input?.visibleText ?? '').replace(/\s+/g, '')
      if (visible !== '' && visible === value.replace(/\s+/g, '')) return false
      return true
    }

    // 统一悬停说明：任何元素带 data-pa-tip 就用同一张毛玻璃圆角卡展示，
    // 取代浏览器原生 title 的灰底方框与各组件自写的一套套样式。
    function installHoverTips() {
      const usable = typeof document !== 'undefined' && document.body && typeof document.addEventListener === 'function'
        && typeof window !== 'undefined' && typeof window.addEventListener === 'function'
      if (!usable) return () => {}
      // 只允许一个宿主：热更新或重复挂载时先清掉旧节点，避免同一元素弹出两张卡片。
      for (const stale of document.querySelectorAll('.pa-hover-tip')) {
        try { stale.remove() } catch { /* already detached */ }
      }
      const tip = document.createElement('div')
      tip.className = 'pa-tip-card pa-hover-tip'
      tip.setAttribute('role', 'tooltip')
      tip.style.display = 'none'
      document.body.appendChild(tip)
      let anchor = null
      const hide = () => {
        anchor = null
        tip.style.display = 'none'
      }
      const show = target => {
        const text = target.getAttribute('data-pa-tip')
        // 没有额外信息就不弹：空文案、与被悬停元素可见文字重复、或被截断元素其实没截断时都跳过。
        if (!hoverTipWorthShowing({
          text,
          visibleText: target.textContent,
          truncateOnly: target.hasAttribute('data-pa-tip-truncate'),
          truncated: isTruncated(target),
        })) { hide(); return }
        hide()
        anchor = target
        tip.textContent = String(text).trim()
        tip.style.display = 'block'
        tip.style.opacity = '0'
        const rect = target.getBoundingClientRect()
        const tipRect = tip.getBoundingClientRect()
        const vw = typeof globalThis.innerWidth === 'number' ? globalThis.innerWidth : 1024
        const vh = typeof globalThis.innerHeight === 'number' ? globalThis.innerHeight : 768
        // 默认出现在元素下方并与元素左边缘对齐；只有底部放不下时才翻到上方。
        const fitsBelow = rect.bottom + 8 + tipRect.height <= vh - 8
        tip.style.left = `${Math.max(8, Math.min(rect.left, vw - tipRect.width - 8))}px`
        tip.style.transform = 'none'
        tip.style.top = fitsBelow
          ? `${rect.bottom + 8}px`
          : `${Math.max(8, Math.min(rect.top - tipRect.height - 8, vh - tipRect.height - 8))}px`
        tip.style.opacity = '1'
      }
      const targetOf = event => (event.target && typeof event.target.closest === 'function' ? event.target.closest('[data-pa-tip]') : null)
      const onOver = event => { const target = targetOf(event); if (target && target !== anchor) show(target) }
      const onOut = event => { const target = targetOf(event); if (target && target === anchor) hide() }
      const onFocus = event => { const target = targetOf(event); if (target) show(target) }
      const onScroll = () => { if (anchor) hide() }
      document.addEventListener('pointerover', onOver, true)
      document.addEventListener('pointerout', onOut, true)
      document.addEventListener('focusin', onFocus, true)
      document.addEventListener('focusout', onScroll, true)
      window.addEventListener('scroll', onScroll, true)
      return () => {
        document.removeEventListener('pointerover', onOver, true)
        document.removeEventListener('pointerout', onOut, true)
        document.removeEventListener('focusin', onFocus, true)
        document.removeEventListener('focusout', onScroll, true)
        window.removeEventListener('scroll', onScroll, true)
        try { tip.remove() } catch { /* already detached */ }
      }
    }

    function apply(ctx) {
      // 测试面：把纯函数暴露给 node 测试（client.js 的采集逻辑只能在浏览器里跑，
      // tests/client-capture.test.js 通过它直接验证截断与整轮聚合行为）。不参与运行时渲染。
      captureInternals = { FAVORITE_LIMITS, estimateTokens, clampTokens, normalizeCaptured, basenameOf, capturedFileNames, captureTurn, favoriteTextBlock, FAV_CLIP_CHARS, FavoritePop, knowledgeContentLines, hoverTipWorthShowing, knowledgeAllExpanded, parseFavoriteProcess, favoriteProcessChain, FavoriteProcessBlock, parseMarkdownBlocks, renderMarkdown, CollectionsCard, collectionPlatformLabel, collectionStatusLabel, collectionParseVisible, zhihuExtractScript, ZHIHU_EXTRACT_CODE, ZHIHU_BOOKMARKLET, xiaohongshuExtractScript, XHS_EXTRACT_CODE, XHS_BOOKMARKLET }
      localeService = softService(ctx, 'locale')
      injectCss()
      const slots = ctx?.slots
      if (!slots || typeof slots.inject !== 'function' || typeof slots.register !== 'function') {
        console.warn('[personal-assistant] 设置页注册失败（slots 服务不可用；不影响其余功能）')
        return undefined
      }
      const disposeHoverTips = installHoverTips()
      let disposeEntry = null
      const registerSection = () => {
        try { disposeEntry?.() } catch { /* The previous registration is already gone. */ }
        disposeEntry = slots.register(
          {
            name: 'settings.section',
            id: 'dsh-personal-assistant',
            order: 40,
            label: () => t('sectionTitle'),
          },
          SettingsSection,
        )
      }
      const disposeInject = slots.inject('settings.section', registerSection)
      let disposeFavoriteEntry = null
      const registerFavoriteEntry = () => {
        try { disposeFavoriteEntry?.() } catch { /* The previous registration is already gone. */ }
        disposeFavoriteEntry = slots.register(
          {
            name: 'conversation.chat.assistant-actions',
            id: 'favorite',
            order: 20,
            inject: sessionId => ({ sessionId }),
          },
          StarEntry,
        )
      }
      const disposeFavoriteInject = slots.inject('conversation.chat.assistant-actions', registerFavoriteEntry)
      return () => {
        try { disposeHoverTips?.() } catch { /* Tooltip host already gone. */ }
        try { disposeInject?.() } catch { /* Telemetry of an already-gone contribution. */ }
        try { disposeEntry?.() } catch { /* Telemetry of an already-gone contribution. */ }
        try { disposeFavoriteInject?.() } catch { /* Telemetry of an already-gone contribution. */ }
        try { disposeFavoriteEntry?.() } catch { /* Telemetry of an already-gone contribution. */ }
      }
    }

    module.exports = { inject, apply, captureInternals: () => captureInternals }
    return module.exports
  },
})

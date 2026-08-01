## CHANGELOG - 2026-08-02 01:38 - 兼容数值形式的 Tool 查询参数

### 撰写时间

- 2026-08-02 01:38

### Base Commit

- 066fe28569618054366c39a2f28c7625db8a8123

### Compare Scope

- working_tree_only

### 背景与改动目标

- MCP Tool 的 JSON Schema 原先要求若干查询标识必须是字符串。但实际调用中，年份、学期编号、课程代码和进出方向经常以 JSON number 产生；这些值虽然语义正确，却会在 Zod 校验阶段被拒绝，无法进入既有的上游适配链路。
- 这次没有扩大 Tool 的业务参数范围，而是在字符串型标识的输入边界兼容整数，并继续把上游请求统一为字符串，避免适配器和返回契约出现类型漂移。

### 改动概览

- `tongji.student.annual-bill` 的 `year`、`tongji.course.catalog` 的 `q`、学生课表和本科成绩 Tool 的 `calendarId`，现在接受字符串或 number，并在校验后规范化为字符串。
- 图书馆通行 Tool 的 `direction` 同样兼容 number；归一后仍使用既有 `"1" | "2"` 枚举校验，其他数字不会被放行。
- `test/server.test.ts` 为五个入口分别增加 Fake Axios 请求断言，验证数值输入、规范化后的上游参数和结构化 Tool Result。

### 关键链路解析（含上下游）

- 上游依赖：MCP SDK 将客户端 arguments 交给各 Tool 的 `inputSchema`；年度账单、课表、成绩和图书馆通行随后调用 Tongji Open Platform 适配器，课程目录调用 YourTJ 的 `getCourses`。
- 当前改动：`z.preprocess` 仅把 number 转为字符串，然后继续经过原有 `trim`、非空或枚举规则。Handler 接收到的 `year`、`q`、`calendarId` 和 `direction` 均为字符串，并按原参数位置传入 `getStatisticsInfoByYear`、`getCourses`、`getStudentTimetable`、`getUndergraduateScores` 和 `getLibraryAccess`。
- 下游影响：上游 HTTP 查询参数与 Tool Result 中回显的查询字段保持字符串契约；`page`、`limit`、课程详情 ID、年级等本来就是 number Schema 的参数未被改写。

### 改动结果与业务影响

- Agent 或 MCP 客户端即使将 `2024`、`120`、`54011212` 或 `1` 作为 JSON number 传入，也能完成原有查询，不需要调用方做额外的字符串转换。
- 数字方向值在转换后仍受枚举限制，避免兼容逻辑意外接受未知方向；空值、非数值/非字符串值和空字符串仍由原有 Schema 拒绝。
- 已执行 `pnpm test`（175/175 通过）、`pnpm test:typecheck`、`pnpm typecheck`、`pnpm build` 与 `git diff --check`，均通过。

### 风险与待办

- 本次沿用已有“非空字符串”规则，未额外限制年份或学期编号的业务范围；若开放平台后续要求固定年份、正整数或特定日历编号格式，应在 Tool Schema 中显式增加约束并补充拒绝用例。
- `q` 是检索关键词，number 会被作为文本关键词发送给 YourTJ；这是兼容课程代码检索的取舍，不应将该转换复用到日期、自由文本或身份字段。

### 建议 Commit Message（git-cz）

- `fix(tools): accept numeric query identifiers`

## CHANGELOG - 2026-08-02 00:49 - 完善 Tool 返回字段、空数据与错误归一

### 撰写时间

- 2026-08-02 00:49

### Base Commit

- 3e0691d55bca778c1530d95d9aca9ba06207939d

### Compare Scope

- working_tree_only

### 背景与改动目标

- 课程目录结果此前未提供可用于衔接课程详情等后续查询的课程 ID；当前学期日历也缺少日历编号、起止时间和教学/考试周边界等已由上游返回的摘要字段。
- 竞赛奖励与奖学金接口在无记录时可能返回 `list: null`。原有实现将其视为上游异常，调用方无法把该合法空值识别为可展示的空结果。

### 改动概览

- `tongji.course.catalog` 的单条课程结果新增 nullable `id`，并同步 MCP 输出 Schema、类型定义和测试期望。
- `tongji.student.current-term-calendar` 新增 `calendarId`、学期起止时间、教学周及考试周边界字段；空日历的完整性判断同步覆盖这些字段，避免仅有新增字段时被错误标为空结果。
- 竞赛奖励和奖学金 Tool 将合法的 `list: null` 归一为 `{ list: [] }` 或 `{ count: 0, list: [] }`，并返回既有的 `empty` 状态。
- 统一上游 401/403 的默认提示为授权失效；成绩与荣誉称号 Tool 仅将合法空数据归一为空结果，无效业务对象改为返回 `upstream_unavailable`。
- 工具注册表按 Tongji Open Platform 与 YourTJ 来源分组，不改变已注册 Tool 的名称或调用入口；`test/server.test.ts` 同步新增字段、空值用例并完成格式整理。

### 关键链路解析（含上下游）

- 上游依赖：课程目录继续通过 YourTJ `getCourses` 获取课程记录；当前学期日历、竞赛奖励和奖学金继续使用 Tongji Open Platform 适配器。认证与请求构造均未改动。
- 当前改动：各 Tool 仍先经 `unwrapResponseData` 提取业务数据，再以 allowlist 方式读取新增字段或归一空列表。未识别的对象结构返回统一上游异常；Axios 401/403 会返回可操作的重新授权提示，不透传原始响应。
- 下游影响：MCP 调用方可以直接使用课程 `id` 衔接课程详情查询，并获得当前学期的日历范围信息；依赖既有字段的调用方保持兼容。Tool 目录的展示顺序会按数据来源调整，但 Tool 名称、输入 Schema 和注册数量不变。

### 改动结果与业务影响

- 课程和日历查询可以提供更完整的筛选、跳转和时间范围信息，同时继续只返回显式允许的字段。
- 上游以 `null` 表示“无奖励/无奖学金记录”时，调用方可稳定收到空列表而非错误，减少前端或 Agent 层的特殊分支。
- 相关离线用例已覆盖课程 ID、当前学期新增字段、两种 `list: null` 场景及上游错误归一；全量 170 个离线测试均通过。

### 风险与待办

- 新增日历字段属于对外 MCP 输出契约扩展；后续若修改字段命名或时间戳单位，需要保留兼容策略并同步更新 Schema 与测试。
- `pnpm test:typecheck`、`pnpm typecheck` 与 `pnpm build` 在本机验证中未正常结束，尚未标记为通过；需要在可完成 TypeScript 校验的环境中补跑。

### 建议 Commit Message（git-cz）

- `feat(tools): enrich responses and normalize upstream errors`

## CHANGELOG - 2026-08-01 18:50 - 接入 YourTJ 学期列表查询 Tool

### 撰写时间

- 2026-08-01 18:50

### Base Commit

- 1f67190e6b5c3c6ff49c1f1608fe87dea629ba0f

### Compare Scope

- working_tree_only

### 背景与改动目标

- 课程目录和年级界别 Tool 已经依赖 YourTJ 的学期编号作为筛选入口，但 MCP 侧此前缺少一个独立的学期列表查询能力。调用方如果要构造课程筛选菜单，只能依赖外部约定或历史编号，链路不够闭合。
- 本次目标是在不改变既有课程目录、年级界别、学生课表和成绩查询行为的前提下，新增 `tongji.course.calendar_list`。它面向公开 YourTJ 学期数据，不读取 `ToolInvocationContext.accessToken`，也不把 YourTJ 原始 `code`、`msg` 等业务包装字段透传给 MCP 调用方。

### 改动概览

- 新增 `src/tools/calendar-list/`，拆分为 `index.ts` 和 `types.ts`，定义 Tool 名称、输出 Schema、YourTJ 调用、字段裁剪、空结果状态和错误归一逻辑。
- 更新 `src/tools/registry.ts`，把 `registerCalendarListTool` 接入 `registerTools`，使 MCP 客户端可以通过 `listTools` 发现学期列表查询能力。
- 更新 `test/integration/yourtj.test.ts`，补充 `getAllCalendars` 的 adapter 契约测试，覆盖 GET 地址、无 query 参数、无 Authorization header 和 timeout。
- 更新 `test/server.test.ts`，补充 Tool 可见性、输出 Schema 关键描述、正常返回、空列表、业务错误和上游不可用路径的回归用例。

### 关键链路解析（含上下游）

- 上游依赖：`src/integration/yourtj.ts` 已提供 `getAllCalendars`，它封装 CAM 生成客户端的 `GetAllCalendarGET`，最终请求 YourTJ 的 `/api/getAllCalendar`，并复用 YourTJ base URL、timeout 和 Axios adapter 注入方式。
- 当前改动：`registerCalendarListTool` 不声明输入参数，调用 `getAllCalendars({})` 后通过 `unwrapResponseData` 提取业务数据，再用 `normalizeCalendarListData` 和 `normalizeCalendarListItem` 只保留 `calendarId` 与 `calendarName`。无法识别的业务结构会返回工具错误，空数组会返回 `status: "empty"`。
- 下游影响：`createMcpServer -> registerTools` 的入口保持不变，只新增一个公开课程筛选辅助 Tool。既有课程目录、年级界别、课表、成绩、奖项、人员信息等 Tool 的输入输出契约没有被改写。

### 改动结果与业务影响

- MCP 调用方现在可以先查询 YourTJ 可用学期列表，再把返回的 `calendarId` 传给年级界别、课程目录或其他依赖学期编号的能力。Tool Result 只包含 `{ status, data: { list }, source }`，不会暴露上游原始包装字段。
- 本次新增链路不依赖校园 access token。相关测试已经断言 adapter 不设置 Authorization header，避免把个人授权链路混入公开 YourTJ 查询。
- 学期列表相关定向验证已在全量 `pnpm test` 中通过；`pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build` 均通过。

### 风险与待办

- 全量 `pnpm test` 当前仍有 1 个失败用例：`test/server.test.ts` 中“应将荣誉称号业务错误响应归一为工具错误”返回了非 `isError` 结果。该失败点不在本次 `calendar-list` diff 的实现链路中，但提交前仍建议单独修复或拆分提交边界，避免带着已知红灯合入新的 Tool 变更。
- 当前学期列表只裁剪 `calendarId` 和 `calendarName`。如果 YourTJ 后续扩展可见字段，需要先明确 MCP 输出 allowlist，再补充 fake 响应和反向断言，避免无意透传上游字段。

### 建议 Commit Message（git-cz）

- `feat(calendar-list): add YourTJ calendar list MCP tool`


## CHANGELOG - 2026-08-01 15:17 - 接入 YourTJ 年级界别列表查询 Tool

### 撰写时间

- 2026-08-01 15:17

### Base Commit

- 87a159154320efc2a61bf69edeaddb03d1d1feb5

### Compare Scope

- working_tree_only

### 背景与改动目标

- 课程目录 Tool 已经接入 YourTJ 公开课程查询链路，但课程筛选还缺少“年级/界别”维度的结构化入口。前端或 Agent 如果要构造课程筛选菜单，需要先知道指定学期下可用的年级列表，而不是把上游接口原始响应直接暴露给 MCP 调用方。
- 本次目标是在不改变既有课程目录、课表、成绩等 Tool 行为的前提下，新增 `tongji.course.grade_list`。它只接收 `calendarId`，不读取同济账号 access token，也不把 YourTJ 的 `code`、`msg` 等业务包装字段透传到 `structuredContent`。

### 改动概览

- 新增 `src/tools/grade-list/`，拆分为 `index.ts` 与 `types.ts`，定义 `GRADE_LIST_TOOL_NAME`、输入参数、输出 Schema、YourTJ 调用、字段裁剪、空结果状态和错误归一逻辑。
- 更新 `src/tools/registry.ts`，把 `registerGradeListTool` 接入 `registerTools`，使 MCP 客户端可通过 `listTools` 发现年级界别列表查询能力。
- 更新 `test/integration/yourtj.test.ts`，补充 `getGradesByCalendarId` 的 adapter 契约测试，覆盖 POST 地址、请求体、timeout 和不注入 Authorization header 的约束。
- 更新 `test/server.test.ts`，补充 Tool 可见性以及年级界别列表的正常返回、空列表、业务错误和上游不可用路径。

### 关键链路解析（含上下游）

- 上游依赖：`src/integration/yourtj.ts` 的 `getGradesByCalendarId` 封装 CAM 生成客户端 `FindGradeByCalendarIdPOST`，最终请求 `/api/findGradeByCalendarId`，请求体为 `{ calendarId }`。这条链路复用 YourTJ base URL、timeout 和 Axios adapter 注入方式。
- 当前改动：`registerGradeListTool` 使用 `z.number().int().positive()` 约束必填学期编号，调用 `getGradesByCalendarId({}, calendarId)` 后通过 `unwrapResponseData` 提取业务数据，再由 `normalizeGradeListData` 只保留数值型 `gradeList`。无法识别的业务结构会归一为工具错误，空数组会返回 `status: "empty"`。
- 下游影响：`createMcpServer -> registerTools` 的入口保持不变，只新增一个公开课程筛选辅助 Tool。既有课程目录、学生课表、成绩、荣誉称号、奖学金、通行记录等 Tool 的注册和输入输出契约没有被改写。

### 改动结果与业务影响

- MCP 客户端现在可以按学期编号查询 YourTJ 可用的年级/界别列表，并得到 `{ status, data: { gradeList }, source, calendarId }` 形式的结构化结果。上游原始业务包装字段不会进入 Tool Result。
- 本次新增链路不依赖校园 access token。相关测试已经断言 adapter 不设置 Authorization header，避免把个人授权链路混入公开 YourTJ 查询。
- 年级界别相关定向验证已通过：`node --import tsx --test --test-name-pattern="年级界别|getGradesByCalendarId" test/integration/yourtj.test.ts test/server.test.ts` 共 5 个用例通过。`pnpm test:typecheck`、`pnpm typecheck` 与 `pnpm build` 均通过。

### 风险与待办

- 全量 `pnpm test` 当前仍有 1 个失败用例：`test/server.test.ts` 中“应将荣誉称号业务错误响应归一为工具错误”返回了非 `isError` 结果。该失败点不在本次年级界别 diff 的实现链路中，但提交前仍建议修复或明确拆分提交边界，避免把已知红灯混入新的 Tool 变更。
- 当前 `calendarId` 只校验为正整数。真实 YourTJ 学期编号的可用范围和历史学期兼容性仍需要在受控联调环境确认；如果上游对不存在的学期返回特殊业务结构，应同步补充 fake 响应和断言。

### 建议 Commit Message（git-cz）

- `feat(grade-list): add YourTJ grade list MCP tool`


## CHANGELOG - 2026-08-01 15:00 - 工具目录重构与公共模块提取

### 撰写时间

- 2026-08-01 15:00

### Base Commit

- ba12a7398a0a46eb8c3b3e0f512cc907b8ca5560

### Compare Scope

- working_tree_only

### 背景与改动目标

- 经过 11 个 Tool 的迭代，每个工具文件中 `readString`/`readNumber`/`isRecord`/`unwrapResponseData`/`createErrorResult`/`toErrorResult` 六个函数各自重复了约 90 行，合计 ~800 行冗余代码。同时所有工具散布在扁平的 `src/tools/` 目录下，没有统一的目录结构。
- 这次重构的目标是把"连续 11 轮审查标记但反复推迟"的技术债一次性解决：提取公共模块、统一目录结构、拆分类型定义。同时在 migration 过程中把 `term-calendar` 从 4 字段扩展到 14 字段以对齐更新后的 spec。

### 改动概览

**公共模块提取：**
- 新增 `src/tools/utils.ts`（87 行），集中了所有工具共用的函数：`unwrapResponseData`、`isRecord`、`readArray`、`readStringArray`、`readString`、`readNumber`、`readBoolean`、`isUnauthorizedUpstreamError`、`createErrorResult`、`toErrorResult`、`ErrorMessageConfig`。
- 新增 `src/tools/types.ts`，定义 `ToolStatus`（`"ok" | "empty" | "unauthorized" | "upstream_unavailable"`）和 `ToolErrorStatus`（`Exclude<ToolStatus, "ok" | "empty">`），供 `utils.ts` 的 `createErrorResult` 做编译期类型保护。

**目录结构统一：**
- 11 个工具全部从扁平 `.ts` 文件迁移为 `{tool-name}/index.ts` + `{tool-name}/types.ts` 子目录结构，与 `undergraduate-score/` 的先行范例一致。
- `index.ts`：保留 schema 定义、register 函数、normalize 逻辑、isEmptyData。
- `types.ts`：抽离 Status 类型、数据接口、Result 接口。
- `registry.ts` 的 import 路径无需改动——TypeScript 自动解析 `'./term-calendar'` → `'./term-calendar/index.ts'`。

**Tool 实现适配：**
- 11 个 `index.ts` 的 import 路径全部修正为 `"../utils"`、`"../registry"`、`"../../integration/..."`。
- 8 个 Tongji OpenAPI 工具的 `toErrorResult` 调用统一为 `toErrorResult(error, { unauthorized, upstreamUnavailable })`，错误消息由各工具自行提供。
- `course-detail` 和 `course-related` 保留了本地的 `toErrorResultLocal`（含 404→empty 处理），但内部调用共享的 `createErrorResult`；`axios` 保留在这两个文件中仅供 404 状态判断。
- `find-major-by-grade` 等无认证工具直接使用共享函数，仅传 `upstreamUnavailable` 配置。

**term-calendar 字段扩展：**
- `TermCalendar` 从 4 字段（`year`/`term`/`weekNum`/`fullName`）扩展到 14 字段：新增 `id`、`beginDay`、`endDay`、`weekBenginDay`、`gradePartOne`、`gradePartTwo`、`currentTermFlag`、`nextTermFlag`、`perTerm`、`perYear`。
- 新增 `readBoolean` 函数（已提取到 `utils.ts`）处理 `currentTermFlag`/`nextTermFlag` 的布尔字段。

**审查修正：**
- `createErrorResult` 的 `status` 参数从 `string` 收紧为 `ToolErrorStatus`（`"unauthorized" | "upstream_unavailable"`），在保持跨工具共享的同时提供编译期保护。
- `readBoolean` 加入 `utils.ts` 而非留在 `term-calendar` 本地。

### 改动结果与业务影响

- 净减少 ~650 行代码（374 行新增，1030 行删除）。11 个工具不再有任何重复的公共函数。
- 已执行 `pnpm check`：82/82 单测通过，类型检查和构建均通过。
- 后续新工具只需创建子目录、写 `index.ts`（仅业务逻辑）和 `types.ts`（仅类型），`import { ... } from "../utils"` 即可复用全部公共函数。

### 风险与待办

- `readStringArray` 目前仅 `course-detail` 使用，`readBoolean` 仅 `term-calendar` 使用，两个函数虽在 `utils.ts` 中但使用频率较低。后续如有类似边缘类型需求，保持"先放在 `utils.ts`"的原则即可。

### 建议 Commit Message（git-cz）

- `refactor(tools): extract shared utils and reorganize tool directories`


## CHANGELOG - 2026-08-01 14:30 - 接入 YourTJ 课程目录查询 Tool

### 撰写时间

- 2026-08-01 14:30

### Base Commit

- 7f37cd7a8e1827ed9c1583e189f112c1d4bc63fe

### Compare Scope

- working_tree_only

### 背景与改动目标

- 现有校园 Tool 已经形成 MCP 注册、上游适配器、字段裁剪和错误归一的固定链路。本次目标是在不要求同济账号 access token 的前提下，把 YourTJ 课程目录检索能力接入 MCP Tool Catalog，供调用方按页码、条数和关键词查询课程基础信息。
- 课程目录属于公开课程检索数据，边界不同于成绩、课表、荣誉称号等个人授权数据；因此 Tool 不读取 `ToolInvocationContext.accessToken`，也不会向 YourTJ 请求注入 Authorization header。

### 改动概览

- 新增 `src/tools/course-catalog/`，拆分为 `index.ts` 与 `types.ts`，定义 `tongji.course.catalog` 的输入参数、输出 Schema、YourTJ 调用、响应裁剪、空结果状态和错误归一逻辑。
- 更新 `src/tools/registry.ts`，将 `registerCourseCatalogTool` 接入 `registerTools`，使 MCP 客户端可通过 `listTools` 发现课程目录查询能力。
- 更新 `src/integration/yourtj.ts`，通过 `getCourses` 封装生成客户端的 `CoursesGET`，统一复用 YourTJ base URL、请求超时和 Axios adapter 注入方式。
- 更新 `test/server.test.ts` 与新增 `test/integration/yourtj.test.ts`，覆盖 Tool 可见性、参数透传、字段裁剪、空列表、业务异常、上游不可用，以及 YourTJ adapter 的 URL、method、params、timeout 和无 Authorization 约束。
- `src/tools/honorary-title/index.ts` 同时调整了荣誉称号业务响应格式异常时的归一行为；该调整改变了既有错误语义，当前已触发回归测试失败。

### 关键链路解析（含上下游）

- 上游依赖：`src/integration/openapi/yourtj/index.ts` 的 `CoursesGET` 负责构造 `/api/courses` GET 请求，参数包含 `page`、`limit`、`q` 和 `includeTotal`；`src/integration/yourtj.ts` 的 `getCourses` 是当前 Tool 层直接依赖的手写适配器。
- 当前改动：`registerCourseCatalogTool` 定义可选 `page`、`limit`、`q` 输入，调用 `getCourses({}, page, limit, q, undefined)` 后用 `unwrapResponseData` 提取业务数据，并仅保留 `code`、`name`、`rating`、`review_count`、`teacher_name`、`department`、`credit` 和 `semesters`。
- 下游影响：`createMcpServer -> registerTools` 的入口保持不变，只新增一个可发现 Tool；既有学生课表、成绩、竞赛奖励、荣誉称号、奖学金、通行记录和人员信息 Tool 的注册入口没有被移除。课程目录 Tool 成功时返回 `status/data/source` 以及本次查询参数，失败时沿用 `createErrorResult` 和 `toErrorResult` 的工具错误格式。

### 改动结果与业务影响

- MCP 客户端现在可以查询 YourTJ 课程目录，并获得经过 allowlist 裁剪后的结构化课程列表；上游原始 `id`、`is_legacy`、`semester_names` 等字段不会进入 `structuredContent`。
- 课程目录查询不会携带校园 access token，测试已反向断言 adapter 不设置 Authorization header，避免把个人授权链路混入公开 YourTJ 查询。
- 当前 `pnpm test:typecheck`、`pnpm typecheck`、`pnpm build` 均通过；`pnpm test` 运行 95 个用例，其中 94 个通过、1 个失败，失败点属于荣誉称号 Tool 的既有业务错误归一语义回归。

### 风险与待办

- 需要修复 `src/tools/honorary-title/index.ts` 中 `normalizeHonoraryTitleData` 对异常业务格式的处理。当前代码在 `data` 不是 `{ list: [...] }` 时返回 `{ list: [] }`，会把上游业务错误响应误报为 `empty`，导致 `test/server.test.ts` 中“荣誉称号业务错误响应归一为工具错误”用例失败。
- `src/integration/tongji_openapi.ts` 在工作区显示为已修改但没有内容 diff，提交前应确认是否仅为换行符变化，避免无意义文件状态进入提交。
- `.codex/rules/unit-testing.md` 在当前仓库不存在，本次审查按 `docs/UTSpec.md` 和现有测试结构执行；若后续恢复该规则文件，应同步复核测试要求是否有新增约束。

### 建议 Commit Message（git-cz）

- `feat(course-catalog): add YourTJ course catalog MCP tool`


## CHANGELOG - 2026-07-31 20:27 - 接入人员基础信息与学生详细学籍信息 Tool

### 撰写时间

- 2026-07-31 20:27

### Base Commit

- 92992c3575060a8ec0379eef2894d122aa296845

### Compare Scope

- working_tree_only

### 背景与改动目标

- 现有校园 Tool 已形成固定边界：MCP Tool 只从 `ToolInvocationContext` 读取短期 token，`src/integration/tongji_openapi.ts` 负责封装 Tongji OpenAPI 调用，Tool 层再按 allowlist 裁剪字段并返回 `structuredContent`。本次目标是在不改变既有 Tool 输入、输出和错误语义的前提下，补齐人员基础信息与学生详细学籍信息查询能力。
- `tongji.user.basic_info` 面向当前授权用户可见的人员基础信息，不能把上游 `userId`、部门编码、更新时间等包装字段暴露给 Agent。`tongji.student.detailed_info` 需要先通过人员基础信息读取当前授权用户的 `userId`，再作为服务端内部参数调用学生详细学籍信息接口；调用方仍不能通过 Tool 参数指定学号、用户 ID 或其他身份字段。

### 改动概览

- 新增 `src/tools/user-basic-info/`，拆分为 `index.ts` 与 `types.ts`。`registerUserBasicInfoTool` 定义 Tool 名称、输出 Schema、缺 token 拒绝、上游调用、业务响应校验、字段裁剪、空结果状态和错误归一。
- 新增 `src/tools/student-detailed-info/`，拆分为 `index.ts` 与 `types.ts`。`registerStudentDetailedInfoTool` 先读取当前授权用户的 `userId`，再调用学生详细学籍信息接口，并只返回经过 allowlist 裁剪后的学籍字段。
- 更新 `src/tools/registry.ts`，把 `registerStudentDetailedInfoTool` 与 `registerUserBasicInfoTool` 接入 `registerTools`。下游 `createMcpServer -> registerTools` 入口保持不变，MCP 客户端现在可通过 `listTools` 发现新增 Tool。
- 更新 `test/integration/tongji-openapi.test.ts`，补充 `getUserBasicInfo` 与 `getAllStudentDetailedInfo` 的 adapter 契约测试，校验 URL、HTTP method、请求体、Bearer Authorization 和 timeout。
- 更新 `test/server.test.ts`，补充两个 Tool 的 MCP 可见性和行为回归，覆盖缺 token、token 注入、字段裁剪、空结果、业务错误、上游未授权和普通上游不可用。

### 关键链路解析（含上下游）

- 上游依赖：两个新 Tool 依赖既有 `src/integration/tongji_openapi.ts` 中的 `getUserBasicInfo` 与 `getAllStudentDetailedInfo`。前者调用 `/v2/rt/user/all_info`，后者调用 `/v1/rt/user/all_student`，均复用 `createTongjiOpenapiAdapter` 的 base URL、timeout 和 Bearer token 注入策略。
- 当前改动：`registerUserBasicInfoTool` 只保留 `deptName`、`name`、`statusName`、`userTypeName`。`registerStudentDetailedInfoTool` 先从基础信息响应 `data.list[].userId` 中读取内部 userId；读取失败时返回工具错误，读取成功后再请求详细学籍信息，并裁剪掉上游编码、包装字段和内部 userId。
- 下游影响：既有年度统计账单、一卡通消费流水、学生课表、成绩、竞赛奖励、荣誉称号、奖学金、校门通行和图书馆通行 Tool 的注册顺序只追加新项，不改变其输入参数、输出结构或错误文案。新增 Tool 成功时统一返回 `status/data/source`；失败时沿用 `createErrorResult` 与 `toErrorResult` 的错误归一策略。

### 改动结果与业务影响

- 人员基础信息与学生详细学籍信息现在进入受控 MCP 边界：调用方不传身份字段，token 不进入 Tool Schema 或 Tool Result，上游响应经过结构校验和字段 allowlist 后才返回。空列表会标记为 `empty`，业务格式异常会归一为工具错误，避免把异常响应误解释为真实空数据。
- 学生详细学籍信息链路明确把 `userId` 限定为服务端内部上游调用参数。测试已反向断言 `userId`、编码字段、上游包装字段和示例内部 ID 不出现在 `structuredContent` 中。
- 本次本地验证已执行 `pnpm test`、`pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build`，四项均通过。其中 `pnpm test` 当前为 90 个用例通过。

### 风险与待办

- `tongji.student.detailed_info` 当前依赖 `getUserBasicInfo` 返回可用 `userId`，因此一次 Tool 调用会访问两个上游接口。若基础信息接口短时不可用，详细学籍信息也会返回工具错误；当前测试已覆盖无法读取 `userId` 的降级路径。
- 详细学籍信息输出保留了 `name`、`birthday`、`householdRegister`、`mailingAddress`、`politicalStatus` 等字段。当前实现遵循本次业务 allowlist，但这些字段敏感度较高；后续如隐私策略收紧，应同步调整 `StudentDetailedInfo`、输出 Schema、裁剪逻辑和 Fake 响应断言。
- 工作区仍存在未跟踪的 `.pnpm-store/`。它不是本次 Tool 的源码或测试资产，提交时应排除；如后续持续产生本地 pnpm store，建议把 `.pnpm-store/` 加入 `.gitignore`。

### 建议 Commit Message（git-cz）

- `feat(student-info): add user and student info MCP tools`


## CHANGELOG - 2026-07-31 20:09 - 接入学生荣誉称号查询 Tool 并收敛荣誉记录输出边界
### 撰写时间

- 2026-07-31 20:09

### Base Commit

- 70681a08acaaf3ab33217076dd294d81866247f9

### Compare Scope

- working_tree_only

### 背景与改动目标
- 前几个校园 Tool 已经形成了一条相对稳定的边界：MCP Tool 只从 `ToolInvocationContext` 读取短期 token，`src/integration/tongji_openapi.ts` 负责封装 Tongji OpenAPI 调用，Tool 层再按 allowlist 裁剪字段并返回 `structuredContent`。荣誉称号和竞赛奖励、奖学金一样，属于当前授权学生的个人校园荣誉数据；它不应该把 CAM 生成客户端的原始响应直接暴露给 Agent。
- 这次目标是新增 `tongji.student.honorary_title`。调用方不需要传入任何业务参数，也不能通过 Tool 参数指定学号、用户 ID 或其他身份字段；输出只保留学院或部门名称、荣誉称号或奖项名称、获奖人姓名和评定年份，避免把上游的 `deptCode`、`userId`、`wid`、`sinceWid`、更新时间或业务包装字段带到 Tool Result。

### 改动概览

- 新增 `src/tools/honorary-title/`，拆分为 `index.ts` 和 `types.ts`。`registerHonoraryTitleTool` 定义 Tool 名称、输出 Schema、缺 token 拒绝、上游调用、业务响应校验、字段裁剪、空结果状态和错误归一。
- `src/tools/registry.ts` 引入并注册 `registerHonoraryTitleTool`。下游 `createMcpServer -> registerTools` 的入口不变，MCP 客户端现在可以通过 `listTools` 发现 `tongji.student.honorary_title`。
- `test/integration/tongji-openapi.test.ts` 补充 `getStudentHonoraryTitles` 的 adapter 契约测试，校验 `/v2/dc/student_work_info/honorary_title`、GET method、无 query params、Bearer Authorization 和 timeout。
- `test/server.test.ts` 补充荣誉称号 Tool 的 MCP 可见性与行为覆盖，包括缺 token、token 注入、字段 allowlist、空结果、上游业务异常、401 未授权和普通上游不可用。

### 关键链路解析（含上下游）

- 上游依赖：荣誉称号数据来自 Tongji OpenAPI 生成客户端的 `Student_honorary_titleGET`，路径是 `/v2/dc/student_work_info/honorary_title`。手写 adapter `getStudentHonoraryTitles` 继续复用 `createTongjiOpenapiAdapter`，由可信调用上下文里的 token 生成 `Bearer <token>`，并沿用默认 base URL 与 timeout 策略。
- 当前改动：`registerHonoraryTitleTool` 只从 `context.invocation.accessToken` 取 token；缺失时直接返回 `unauthorized`。成功响应先经过 `unwrapResponseData` 提取业务 `data`，再由 `normalizeHonoraryTitleData` 要求存在 `list` 数组。单条记录只保留 `deptName`、`honorTitle`、`name` 和 `ratingYear`。
- 下游影响：MCP 客户端能看到新增 Tool 及其输出 Schema；调用成功时得到 `status/data/source`，不会拿到上游原始的 `count`、`sinceWid`、`deptCode`、`ratingTerm`、`rewardLevel`、`updateTime`、`userId`、`wid`、`code` 或 `msg`。既有年度统计账单、一卡通消费流水、学生课表、成绩、竞赛奖励、奖学金、校门通行和图书馆通行 Tool 仍走原注册路径，本次没有改变它们的输入、输出或错误文案。

### 改动结果与业务影响
- 学生荣誉称号现在进入了和其他校园能力一致的受控 MCP 边界：调用方不传身份字段，token 不进入 Tool Schema 或 Tool Result，上游响应经过结构校验和字段 allowlist 后才返回。空列表会被标记为 `empty`，业务格式异常会被归一为工具错误，避免把异常响应误解释成“没有荣誉称号记录”。
- 测试继续使用 `InMemoryTransport` 和 Fake Axios adapter。换句话说，本地回归验证的是 MCP 契约、请求构造、错误归一和隐私裁剪，不访问真实校园平台，也没有写入真实 token、学号或学生数据。
- 当前工作区审查时已执行 `pnpm test`、`pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build`，四项均通过。其中 `pnpm test` 当前为 75 个用例通过。

### 风险与待办
- 荣誉称号 Tool 当前没有输入参数，因此身份边界主要依赖 `ToolInvocationContext` 中的短期 token。这个模式和现有校园 Tool 一致；如果后续新增按年份、学院或人员筛选的能力，仍应避免把 `userId`、学号或其他身份字段开放为 Tool 参数。
- 输出保留了上游返回的 `name`。当前测试使用脱敏样例 `吕**`，并通过反向断言排除了 `userId`、`wid` 等字段；真实上游是否始终返回脱敏姓名仍需要在受控联调环境确认。如果上游可能返回完整姓名，后续应在 Tool 层增加姓名脱敏策略并补充对应测试。
- 工作区仍存在未跟踪的 `.pnpm-store/`，它不是本次荣誉称号 Tool 的源码或测试资产。提交时应排除该目录；如果后续持续产生本地 pnpm store，建议把 `.pnpm-store/` 加入 `.gitignore`。

### 建议 Commit Message（git-cz）
- `feat(honorary-title): add honorary title MCP tool`


## CHANGELOG - 2026-07-31 19:56 - 接入学生课表查询 Tool 并补齐课表链路回归验证

### 撰写时间

- 2026-07-31 19:56

### Base Commit

- 55088b50efd906ae4b70c7740e047795efd7e974

### Compare Scope

- working_tree_only

### 背景与改动目标

- 前几个校园 Tool 已经形成了一条稳定模式：MCP Tool 只从 `ToolInvocationContext` 读取短期 token，`src/integration/tongji_openapi.ts` 负责封装 Tongji OpenAPI 调用，Tool 层再按 allowlist 裁剪字段并返回 `structuredContent`。学生课表和成绩、一卡通、门禁一样，都是当前授权学生的个人校园数据；它不应该作为 CAM 生成客户端的原始接口直接暴露给 Agent。
- 这次目标是新增 `tongji.student.timetable`。调用方只能传入可选 `calendarId`，不允许通过 Tool 参数指定学号、用户 ID 或其他身份字段；输出只保留课程、班级、学分、教师、上课时间、教室、校区、考核方式和结构化排课细则等当前业务需要展示的字段。

### 改动概览

- 新增 `src/tools/student-timetable/`，拆分为 `index.ts` 和 `types.ts`。`registerStudentTimetableTool` 定义 Tool 名称、输入 Schema、输出 Schema、缺 token 拒绝、上游调用、业务响应校验、字段裁剪、空结果状态和错误归一。
- `src/integration/tongji_openapi.ts` 已新增 `getStudentTimetable`，复用 `createTongjiOpenapiAdapter`，最终调用 CAM 生成客户端的 `Student_timetableGET`。该接口走 `/v1/rt/onetongji/student_timetable`，使用 `calendarId` 作为可选查询参数。
- `src/tools/registry.ts` 引入并注册 `registerStudentTimetableTool`。下游 `createMcpServer -> registerTools` 的入口不变，但 MCP 客户端现在可以通过 `listTools` 发现 `tongji.student.timetable`。
- `test/integration/tongji-openapi.test.ts` 补充学生课表 adapter 契约测试，校验 URL、GET method、`calendarId` 参数、Bearer Authorization 和 timeout。`test/server.test.ts` 补充课表 Tool 的 MCP 可见性与行为覆盖，包括缺 token、token 注入、学期编号透传、字段裁剪、空结果、上游业务异常、401 未授权和普通上游不可用。

### 关键链路解析（含上下游）

- 上游依赖：课表数据来自 Tongji OpenAPI 生成客户端的 `Student_timetableGET`，路径是 `/v1/rt/onetongji/student_timetable`，查询参数为可选 `calendarId`。手写 adapter 继续负责把可信调用上下文里的 token 包装成 `Bearer <token>`，并复用默认 base URL 与 timeout 策略。
- 当前改动：`registerStudentTimetableTool` 只从 `context.invocation.accessToken` 取 token；缺失时直接返回 `unauthorized`。成功响应先经过 `unwrapResponseData` 提取业务 `data`，再由 `normalizeStudentTimetableData` 要求业务数据本身是数组。单门课程只保留 `classCode`、`className`、`courseCode`、`courseName`、`credits`、`teacherName`、`classTime`、`classRoom`、`classRoomPractice`、`remark`、`timeTableList`、`campusI18n`、`assessmentModeI18n`、`classRoomI18n` 和 `teachingWayI18n`；单次排课细则只保留星期、节次、周次、弹窗文本、教室和校区。
- 下游影响：MCP 客户端能看到新增 Tool 及其输出 Schema；调用成功时得到 `status/data/source` 和本次查询指定的 `calendarId`。既有年度统计账单、一卡通消费流水、成绩、竞赛奖励、奖学金、校门通行和图书馆通行 Tool 仍走原注册路径，本次没有改变它们的输入、输出或错误文案。

### 改动结果与业务影响

- 学生课表现在进入了和其他校园能力一致的受控 MCP 边界：调用方不传身份字段，token 不进入 Tool Schema 或 Tool Result，上游响应经过结构校验和字段 allowlist 后才返回。空数组会被标记为 `empty`，业务格式异常会被归一为工具错误，避免把异常响应误解释成“没有课表”。
- 测试继续使用 `InMemoryTransport` 和 Fake Axios adapter。换句话说，本地回归验证的是 MCP 契约、请求构造、错误归一和隐私裁剪，不访问真实校园平台，也没有写入真实 token、学号或学生数据。
- 当前工作区审查时已执行 `pnpm test`、`pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build`，四项均通过。其中 `pnpm test` 当前为 68 个用例通过。

### 风险与待办

- `calendarId` 目前只在 Schema 中使用 `z.string().trim().min(1)`，还没有限制为明确的学期编号格式。当前看起来不会破坏已有调用链，但非法编号会被直接转发给上游；后续可以补充格式校验和非法 `calendarId` 输入的拒绝用例。
- 课表输出当前保留了 `teacherName` 和 `popover`。其中 `popover` 是上游组合展示文本，可能重新携带已经裁剪掉的教师编号或其他原始字段；如果要严格执行输出 allowlist，后续应移除该字段，或用已允许字段重新生成脱敏展示文本，并补充对被排除字段值的反向断言。
- 工作区存在未跟踪的 `.pnpm-store/`，它不是学生课表 Tool 的源码或测试资产。提交时应排除该目录；如本仓后续持续产生本地 pnpm store，建议把 `.pnpm-store/` 加入 `.gitignore`。
- 真实 Tongji OpenAPI 的课表字段类型、业务错误码、历史学期编号规则和 token scope 仍需要在受控联调环境确认。如上游响应结构演进，应同步更新 `StudentTimetableCourse`、`TimetableSchedule`、输出 Schema、字段 allowlist 和 Fake 响应。

### 建议 Commit Message（git-cz）

- `feat(student-timetable): add student timetable MCP tool`


## CHANGELOG - 2026-07-31 19:45 - 接入一卡通消费流水查询 Tool 并限制流水明细输出边界

### 撰写时间

- 2026-07-31 19:45

### Base Commit

- 43944079f67142fc775eb671886b146fb72f1c57

### Compare Scope

- working_tree_only

### 背景与改动目标

- 前几个校园 Tool 已经形成了一条固定边界：MCP Tool 只从 `ToolInvocationContext` 读取短期 token，`src/integration/tongji_openapi.ts` 负责封装 Tongji OpenAPI 调用，Tool 层再按 allowlist 裁剪字段并返回 `structuredContent`。一卡通消费流水属于更细粒度的校园行为数据，既包含消费时间、地点和金额，也可能带出上游的账号、交易编码或人员标识。因此这次目标不是把 `Get_card_spending_flowGET` 原样暴露给 Agent，而是把它收敛成一个只面向当前授权用户的 MCP Tool。
- 这次新增的是 `tongji.student.card_spending_flow`。调用方只能传入可选的 `tradeStartTime` 和 `tradeEndTime`，不能通过 Tool 参数指定学号、用户 ID 或其他身份字段；输出只保留校区、余额、商户、消费类型、姓名、人员类型、餐厅、消费金额和完整交易时间戳，不返回上游的账户号、POS 编码、性别编码、交易日期拆分字段、交易码或用户 ID。

### 改动概览

- 新增 `src/tools/card-spending-flow/`，拆分为 `index.ts` 和 `types.ts`。`registerCardSpendingFlowTool` 定义 Tool 名称、输入 Schema、输出 Schema、缺 token 拒绝、上游调用、业务响应校验、字段裁剪、空结果状态和错误归一。
- `src/tools/registry.ts` 引入并注册 `registerCardSpendingFlowTool`。下游 `createMcpServer -> registerTools` 的入口不变，但 MCP 客户端现在可以通过 `listTools` 发现 `tongji.student.card_spending_flow`。
- `test/integration/tongji-openapi.test.ts` 补充 `getCardSpendingFlow` 的 adapter 契约测试，校验 `/v1/dc/card/card_history_flow`、GET method、`tradeStartTime/tradeEndTime` 参数、Bearer Authorization 和 timeout。
- `test/server.test.ts` 补充一卡通消费流水 Tool 的 MCP 可见性与行为覆盖，包括缺 token、token 注入、时间参数透传、字段 allowlist、空结果、上游业务异常、401 未授权和普通上游不可用。

### 关键链路解析（含上下游）

- 上游依赖：一卡通流水数据来自 Tongji OpenAPI 生成客户端的 `Get_card_spending_flowGET`，路径是 `/v1/dc/card/card_history_flow`，查询参数为 `tradeStartTime` 和 `tradeEndTime`。手写 adapter `getCardSpendingFlow` 继续复用 `createTongjiOpenapiAdapter`，由可信调用上下文里的 token 生成 `Bearer <token>`，并沿用默认 base URL 与 timeout 策略。
- 当前改动：`registerCardSpendingFlowTool` 只从 `context.invocation.accessToken` 取 token；缺失时直接返回 `unauthorized`。成功响应先经过 `unwrapResponseData` 提取业务 `data`，再由 `normalizeCardSpendingFlowData` 要求存在 `userInfos` 数组。单条记录只保留 `campusAreaName`、`cardBalance`、`mercName`、`mercTypeName`、`name`、`personTypeCode`、`restaurantName`、`tradeAmount` 和 `tradeDateTime`。
- 下游影响：MCP 客户端能看到新增 Tool 及其输出 Schema；调用成功时得到 `status/data/source` 和本次查询条件，不会拿到上游原始的 `count`、`fromAccount`、`posCode`、`sexCode`、`tradeDate`、`tradeMonth`、`tradeTime`、`tranCode` 或 `userId`。既有年度统计账单、成绩、竞赛奖励、奖学金、校门通行和图书馆通行 Tool 仍走原注册路径，本次没有改变它们的输入、输出或错误文案。

### 改动结果与业务影响

- 一卡通消费流水现在进入了和其他校园能力一致的受控 MCP 边界：调用方不传身份字段，token 不进入 Tool Schema 或 Tool Result，上游响应经过结构校验和字段 allowlist 后才返回。空列表会被标记为 `empty`，业务格式异常会被归一为工具错误，避免把异常响应误解释成“没有消费流水”。
- 测试继续使用 `InMemoryTransport` 和 Fake Axios adapter。换句话说，本地回归验证的是 MCP 契约、请求构造、错误归一和隐私裁剪，不访问真实校园平台，也没有写入真实 token、学号或学生数据。
- 当前工作区审查时已执行 `pnpm test`、`pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build`，四项均通过。其中 `pnpm test` 当前为 61 个用例通过。

### 风险与待办

- `tradeStartTime` 和 `tradeEndTime` 目前只在 Schema 中使用 `z.string().trim().min(1)`，描述里要求 `yyyy-MM-dd HH:mm:ss`，但还没有做格式校验。当前看起来不会破坏已有调用链，但非法时间会被直接转发给上游；后续可以补充格式校验和非法时间输入的拒绝用例。
- 一卡通消费流水输出当前保留了 `name`、`cardBalance`、`mercName` 和 `tradeAmount`。这和当前校园 Tool 的 allowlist 策略一致，但流水明细本身敏感度更高；如果后续隐私策略要求进一步脱敏姓名、余额或商户名称，需要同步调整 `CardSpendingFlowRecord`、输出 Schema、裁剪逻辑和 Fake 响应断言。
- 工作区存在未跟踪的 `.pnpm-store/`，它不是一卡通消费流水 Tool 的源码或测试资产。提交时应排除该目录；如本仓后续持续产生本地 pnpm store，建议把 `.pnpm-store/` 加入 `.gitignore`。
- 真实 Tongji OpenAPI 的一卡通流水字段类型、业务错误码、数据延迟和 token scope 仍需要在受控联调环境确认。如上游响应结构演进，应同步更新 `CardSpendingFlowRecord`、输出 Schema、字段 allowlist 和 Fake 响应。

### 建议 Commit Message（git-cz）

- `feat(card-spending-flow): add card spending flow MCP tool`


## CHANGELOG - 2026-07-31 19:29 - 接入学生年度统计账单 Tool 并收敛年度画像数据边界

### 撰写时间

- 2026-07-31 19:29

### Base Commit

- 071336afd0d01e187e24cac1074b7ecf06977d9f

### Compare Scope

- working_tree_only

### 背景与改动目标

- 前面几个校园 Tool 已经把成绩、竞赛奖励、奖学金、校门通行和图书馆通行收敛到同一条链路里：MCP Tool 只从 `ToolInvocationContext` 读取短期 token，`src/integration/tongji_openapi.ts` 负责封装 Tongji OpenAPI 调用，Tool 层再按 allowlist 裁剪字段并返回 `structuredContent`。年度统计账单同样是授权学生个人数据，而且会聚合图书馆、食堂、进出校等多个维度，因此这次目标不是直接暴露上游年度账单接口，而是延续这条受控边界。
- 这次新增的是 `tongji.student.annual_bill`。调用方只需要传入统计年份 `year`，不能通过参数指定学号、用户 ID 或其他身份字段；输出只保留年度借阅、消费、图书馆学习、进出校和班车等经过选择的统计字段，不返回上游的 `deptCode`、`userId`、`userTypeCode`、当天进出次数或百分位细节等未批准字段。

### 改动概览

- 新增 `src/tools/annual-bill/`，拆分为 `index.ts` 和 `types.ts`。`registerAnnualBillTool` 定义 Tool 名称、输入 Schema、输出 Schema、缺 token 拒绝、上游调用、业务响应校验、字段裁剪、空结果状态和错误归一。
- `src/tools/registry.ts` 引入并注册 `registerAnnualBillTool`。下游 `createMcpServer -> registerTools` 的入口不变，但 MCP 客户端现在可以通过 `listTools` 发现 `tongji.student.annual_bill`。
- `test/integration/tongji-openapi.test.ts` 补充 `getStatisticsInfoByYear` 的 adapter 契约测试，校验 `/v2/dc/user/user_annual_bill`、GET method、`year` 参数、Bearer Authorization 和 timeout。
- `test/server.test.ts` 补充年度统计账单 Tool 的 MCP 可见性与行为覆盖，包括缺 token、token 注入、年份参数透传、字段 allowlist、空结果、上游业务异常、401 未授权和普通上游不可用。

### 关键链路解析（含上下游）

- 上游依赖：年度账单数据来自 Tongji OpenAPI 生成客户端的 `Get_statistics_info_by_yearGET`，路径是 `/v2/dc/user/user_annual_bill`，查询参数为必填 `year`。手写 adapter `getStatisticsInfoByYear` 继续复用 `createTongjiOpenapiAdapter`，由可信调用上下文里的 token 生成 `Bearer <token>`，并沿用默认 base URL 与 timeout 策略。
- 当前改动：`registerAnnualBillTool` 只从 `context.invocation.accessToken` 取 token；缺失时直接返回 `unauthorized`。成功响应先经过 `unwrapResponseData` 提取业务 `data`，再由 `normalizeAnnualBillData` 要求业务数据本身是数组。单条记录只保留 `annualBorrowedTopPct`、`avgDailySpending`、`booksCount`、`deptName`、`earliestEntryTime`、`latestExitTime`、`libraryAccessCount`、`libraryStudyTime`、`libraryStudyTopPct`、`maxCumulativeLoc`、`maxTransactionAmt`、`maxTransactionLoc`、`maxTransactionTime`、`name`、`shuttleRidesCount`、`totalEntries`、`totalSpendingCanteen` 和 `year`。
- 下游影响：MCP 客户端能看到新增 Tool 及其输出 Schema；调用成功时得到 `status/data/source/year`，不会拿到上游原始的 `canteenSpendingPct`、`deptCode`、`earliestExitTime`、`lastDepartureCount`、`lateExitPct`、`latestDepartureTime`、`libraryAttendancePct`、`libraryExitPct`、`maxCumulativeAmt`、`todayEntryCount`、`todayLateExitPct`、`userId`、`userTypeCode` 或 `weeklyExitAvg`。既有成绩、竞赛奖励、奖学金、校门通行和图书馆通行 Tool 仍走原注册路径，本次没有改变它们的输入、输出或错误文案。

### 改动结果与业务影响

- 年度统计账单现在进入了和其他校园能力一致的受控 MCP 边界：调用方不传身份字段，token 不进入 Tool Schema 或 Tool Result，上游响应经过结构校验和字段 allowlist 后才返回。空列表会被标记为 `empty`，业务格式异常会被归一为工具错误，避免把异常响应误解释成“没有年度账单”。
- 测试继续使用 `InMemoryTransport` 和 Fake Axios adapter。换句话说，本地回归验证的是 MCP 契约、请求构造、错误归一和隐私裁剪，不访问真实校园平台，也没有写入真实 token、学号或学生数据。
- 当前工作区审查时已执行 `pnpm test`、`pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build`，四项均通过。其中 `pnpm test` 当前为 54 个用例通过。

### 风险与待办

- `year` 目前只在 Schema 中使用 `z.string().trim().min(1)`，描述里给了 `2024` 这样的示例，但还没有限制为四位年份或合理年份范围。当前看起来不会破坏已有调用链，但非法年份会被直接转发给上游；后续可以补充格式校验和非法年份输入的拒绝用例。
- 年度账单输出当前保留了 `name` 和 `deptName`。这延续了既有 Tool 的策略，但年度画像数据聚合程度更高；如果后续隐私策略要求进一步脱敏姓名或学院，需要同步调整 `AnnualBill`、输出 Schema、裁剪逻辑和 Fake 响应断言。
- 工作区存在未跟踪的 `.pnpm-store/`，它不是年度统计账单 Tool 的源码或测试资产。提交时应排除该目录；如本仓后续持续产生本地 pnpm store，建议把 `.pnpm-store/` 加入 `.gitignore`。
- 真实 Tongji OpenAPI 的年度账单字段类型、业务错误码、数据生成周期和 token scope 仍需要在受控联调环境确认。如上游响应结构演进，应同步更新 `AnnualBill`、输出 Schema、字段 allowlist 和 Fake 响应。

### 建议 Commit Message（git-cz）

- `feat(annual-bill): add student annual bill MCP tool`


## CHANGELOG - 2026-07-31 19:09 - 接入图书馆通行记录查询 Tool 并延续校园通行数据边界

### 撰写时间

- 2026-07-31 19:09

### Base Commit

- 4b29699a208ba19e38b4a7b9e5296f4d3281ae6b

### Compare Scope

- working_tree_only

### 背景与改动目标

- 校门通行 Tool 已经把“授权学生个人通行数据”接入到现有 MCP 边界里：Tool 只从 `ToolInvocationContext` 读取短期 token，手写 adapter 负责调用 Tongji OpenAPI，返回前再按 allowlist 裁剪字段。图书馆闸机记录属于同一类高敏校园轨迹数据，因此这次改动的重点不是简单多注册一个接口，而是继续沿用这条受控链路，避免把上游原始字段或身份参数直接暴露给 MCP 客户端。
- 这次目标是新增 `tongji.student.library_access`，让 Agent 可以查询当前授权学生在指定时间范围内的图书馆进出记录。输入只允许 `direction`、`visitStartTime` 和 `visitEndTime`；输出只保留学院、进出方向、门点、馆区、姓名、身份类型和刷卡时间，不返回上游的 `gateNo`、`userId`、`visitno` 或 `count` 等内部字段。

### 改动概览

- 新增 `src/tools/library-access/`，拆分为 `index.ts` 和 `types.ts`。`registerLibraryAccessTool` 定义 Tool 名称、输入 Schema、输出 Schema、缺 token 拒绝、上游调用、业务响应校验、字段裁剪、空结果状态和错误归一。
- `src/tools/registry.ts` 引入并注册 `registerLibraryAccessTool`。下游 `createMcpServer -> registerTools` 的入口不变，但 MCP 客户端现在可以通过 `listTools` 发现 `tongji.student.library_access`。
- `src/integration/tongji_openapi.ts` 已提供 `getLibraryAccess`，它复用 `createTongjiOpenapiAdapter`，最终调用 CAM 生成客户端的 `Get_library_accessGET`。本次测试补齐了该 adapter 对 `/v1/dc/lib/lib_access_control`、GET method、`direction/visitStartTime/visitEndTime` 参数、Bearer Authorization 和 timeout 的契约验证。
- `test/server.test.ts` 补充图书馆通行 Tool 的 MCP 可见性与行为覆盖，包括缺 token、token 注入、查询参数透传、字段 allowlist、空结果、上游业务异常、401 未授权和普通上游不可用。

### 关键链路解析（含上下游）

- 上游依赖：图书馆通行数据来自 Tongji OpenAPI 生成客户端的 `Get_library_accessGET`，路径是 `/v1/dc/lib/lib_access_control`，查询参数为 `direction`、`visitStartTime` 和 `visitEndTime`。手写 adapter 继续负责把可信调用上下文里的 token 包装成 `Bearer <token>`，并复用默认 base URL 与 timeout 策略。
- 当前改动：`registerLibraryAccessTool` 只从 `context.invocation.accessToken` 取 token；缺失时直接返回 `unauthorized`。成功响应先经过 `unwrapResponseData` 提取业务 `data`，再由 `normalizeLibraryAccessData` 要求存在 `userInfos` 数组。单条记录只保留 `deptName`、`direction`、`door`、`libPlace`、`name`、`type` 和 `visitTime`。
- 下游影响：MCP 客户端能看到新增 Tool 及其输出 Schema；调用成功时得到 `status/data/source` 和本次查询条件，不会拿到上游原始的 `gateNo`、`userId`、`visitno`、`count` 或其他未知字段。成绩、竞赛奖励、奖学金和校门通行 Tool 仍走原注册路径，本次没有改变它们的输入、输出或错误文案。

### 改动结果与业务影响

- 图书馆通行查询现在进入了和其他校园能力一致的受控 MCP 边界：调用方不传身份字段，token 不进入 Tool Schema 或 Tool Result，上游响应经过结构校验和字段 allowlist 后才返回。空列表会被标记为 `empty`，业务格式异常会被归一为工具错误，避免把异常响应误解释为“没有通行记录”。
- 测试继续使用 `InMemoryTransport` 和 Fake Axios adapter。换句话说，本地回归验证的是 MCP 契约、请求构造、错误归一和隐私裁剪，不访问真实校园平台，也没有写入真实 token、学号或学生数据。
- 当前工作区审查时已执行 `pnpm test`、`pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build`，四项均通过。其中 `pnpm test` 当前为 47 个用例通过。

### 风险与待办

- `visitStartTime` 和 `visitEndTime` 目前只在 Schema 中使用 `z.string().trim().min(1)`，描述里要求 `yyyy-MM-dd HH:mm:ss`，但还没有做格式校验。当前看起来不会破坏已有调用链，但非法时间会被直接转发给上游；建议后续补充格式校验和非法时间输入的拒绝用例。
- 图书馆通行输出当前保留了上游返回的 `name`。这和校门通行 Tool 的策略一致，但仍属于个人信息字段；如果后续隐私策略要求进一步脱敏姓名，需要同步调整 `LibraryAccessRecord`、输出 Schema、裁剪逻辑和 Fake 响应断言。
- 工作区存在未跟踪的 `.pnpm-store/`，它不是图书馆通行 Tool 的源码或测试资产。提交前建议删除该目录，或把 `.pnpm-store/` 加入 `.gitignore`，避免本地 pnpm 缓存被误加入提交。
- 真实 Tongji OpenAPI 的图书馆通行字段类型、业务错误码、数据延迟和 token scope 仍需要在受控联调环境确认。如上游响应结构演进，应同步更新 `LibraryAccessRecord`、输出 Schema、字段 allowlist 和 Fake 响应。

### 建议 Commit Message（git-cz）

- `feat(library-access): add library gate access MCP tool`


## CHANGELOG - 2026-07-31 16:41 - 接入校门通行记录查询 Tool 并收敛进出校门数据边界

### 撰写时间

- 2026-07-31 16:41

### Base Commit

- d5adcaddb2ffec1838fd956f2f8c56893ab602a8

### Compare Scope

- working_tree_only

### 背景与改动目标

- 现有校园 Tool 已经形成了一条相对稳定的边界：`createMcpServer` 创建无状态 MCP 服务，`registerTools` 暴露领域能力，具体 Tool 只从 `ToolInvocationContext` 读取短期 token，再经 `src/integration/tongji_openapi.ts` 的手写 adapter 调用 Tongji OpenAPI，最后用字段 allowlist 返回 `structuredContent`。校门进出记录属于同一类授权学生个人数据，因此这次改动继续沿用这条链路，而不是把 CAM 生成客户端或上游原始字段直接暴露给 MCP 客户端。
- 这次目标是新增 `tongji.student.school_access`，让 Agent 可以查询当前授权学生在指定时间范围内的校门通行记录。输入只允许查询方向和时间范围，不接收学号、用户 ID 或其他身份字段；输出只保留通行时间、学院、通行点、位置、姓名、进出状态和性别等经过明确选择的字段。

### 改动概览

- 新增 `src/tools/school-access/`，拆分为 `index.ts` 和 `types.ts`。`registerSchoolAccessTool` 定义 Tool 名称、输入 Schema、输出 Schema、缺 token 拒绝、上游调用、业务响应校验、字段裁剪、空结果状态和错误归一。
- `src/tools/registry.ts` 引入并注册 `registerSchoolAccessTool`。下游 `createMcpServer -> registerTools` 的入口没有改变，但 MCP 客户端现在可以通过 `listTools` 发现 `tongji.student.school_access`。
- `src/integration/tongji_openapi.ts` 已提供 `getSchoolAccess`，它复用 `createTongjiOpenapiAdapter`，最终调用 CAM 生成客户端的 `Get_school_accessGET`。本次测试补齐了该 adapter 对 `/v1/dc/door/school_access_control`、GET method、`portNum/dataStartTime/dataEndTime` 参数、Bearer Authorization 和 timeout 的契约验证。
- `test/server.test.ts` 补充校门通行 Tool 的 MCP 可见性与行为覆盖，包括缺 token、token 注入、查询参数透传、字段 allowlist、空结果、上游业务异常、401 未授权和普通上游不可用。

### 关键链路解析（含上下游）

- 上游依赖：校门通行数据来自 Tongji OpenAPI 的 `Get_school_accessGET`，生成客户端注释说明该接口对应 `/v1/dc/door/school_access_control`，查询参数为 `portNum`、`dataStartTime` 和 `dataEndTime`。手写 adapter 负责把可信调用上下文里的 token 包装成 `Bearer <token>`，并继续使用默认 base URL 与 timeout 策略。
- 当前改动：`registerSchoolAccessTool` 只从 `context.invocation.accessToken` 取 token；缺失时直接返回 `unauthorized`。成功响应先经 `unwrapResponseData` 取业务 `data`，再由 `normalizeSchoolAccessData` 要求存在 `userInfos` 数组，并把 `count` 规范为数字或 `null`。单条记录只保留 `dataTime`、`deptName`、`equptName`、`lctnName`、`name`、`portNum` 和 `sex`。
- 下游影响：MCP 客户端能看到新增 Tool 及其输出 Schema；调用成功时得到 `status/data/source` 和本次查询条件，不会拿到上游的 `cardData`、`codeIndex`、`equptId`、`job`、`multiEvent`、`personnelId`、`userId` 等原始字段。成绩、竞赛奖励和奖学金 Tool 仍走原注册路径，输入、输出和错误文案没有被本次改动改变。

### 改动结果与业务影响

- 校门通行查询现在进入了和其他校园能力一致的受控 MCP 边界：调用方不传身份字段，token 不进入 Tool Schema 或 Tool Result，上游响应经过结构校验和字段裁剪后才返回。空列表会被标记为 `empty`，业务格式异常会被归一为工具错误，避免把异常响应误解为“没有记录”。
- 测试继续使用 `InMemoryTransport` 和 Fake Axios adapter。也就是说，本地回归验证的是 MCP 契约、请求构造、错误归一和隐私裁剪，不访问真实校园平台，也没有写入真实 token、学号或学生数据。
- 已在当前工作区执行 `pnpm test`、`pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build`，四项均通过。其中 `pnpm test` 当前为 40 个用例通过。

### 风险与待办

- `dataStartTime` 和 `dataEndTime` 目前只在 Schema 中使用 `z.string().trim().min(1)`，描述里要求 `yyyy-MM-dd HH:mm:ss`，但还没有做格式校验。当前看起来不会破坏已有调用链，但非法时间会被直接转发给上游；建议后续补充格式校验和非法时间输入的拒绝用例。
- 工作区存在未跟踪的 `.pnpm-store/`，它不是校门通行 Tool 的源码或测试资产。提交前建议删除该目录，或把 `.pnpm-store/` 加入 `.gitignore`，避免本地 pnpm 缓存被误加入提交。
- 真实 Tongji OpenAPI 的校门通行字段类型、业务错误码、数据延迟和 token scope 仍需要在受控联调环境确认。如果上游响应结构演进，应同步更新 `SchoolAccessRecord`、输出 Schema、字段 allowlist 和 Fake 响应。

### 建议 Commit Message（git-cz）

- `feat(school-access): add campus gate access MCP tool`


## CHANGELOG - 2026-07-31 16:14 - 接入学生奖学金查询 Tool 并延续字段裁剪边界

### 撰写时间

- 2026-07-31 16:14

### Base Commit

- fcf7421f3d53bf5208998b9cb738f09a6a093da6

### Compare Scope

- working_tree_only

### 背景与改动目标

- 成绩查询和竞赛奖励查询已经把校园数据能力收敛到同一条边界里：调用方通过 MCP Tool 发现能力，Tool 只从 `ToolInvocationContext` 读取短期 token，手写 adapter 负责调用 Tongji OpenAPI，最后由 Tool 自己做字段 allowlist。奖学金记录属于同一类学生个人数据，因此这次不是直接暴露生成客户端，而是沿用这条链路新增一个独立的 `tongji.student.scholarship_info` Tool。
- 这次的目标比较明确：Agent 侧可以查询当前授权学生的奖学金记录，但不能通过 Tool 参数传入他人身份字段，也不能拿到上游原始响应里的 `amount`、`deptCode`、`userId`、`wid`、`sinceWid` 等内部或敏感字段。

### 改动概览

- 新增 `src/tools/scholarship-info/`，拆分 `index.ts` 与 `types.ts`。`registerScholarshipInfoTool` 声明空输入 Schema、结构化输出 Schema、缺 token 拒绝、上游调用、响应结构校验、字段裁剪、空结果状态和错误归一。
- `src/tools/registry.ts` 将 `registerScholarshipInfoTool` 接入现有 Tool Catalog。`createMcpServer -> registerTools` 的入口没有变化，但 MCP 客户端现在能额外发现 `tongji.student.scholarship_info`。
- `test/integration/tongji-openapi.test.ts` 补充 `getStudentScholarshipInfo` 的 adapter 契约测试，校验 `/v2/dc/student_work_info/scholarship`、GET method、无 query 参数、Bearer Authorization 和 timeout。
- `test/server.test.ts` 补充奖学金 Tool 的 MCP 可见性与行为测试，覆盖缺 token、token 注入、字段 allowlist、空结果、业务异常、401 未授权和普通上游不可用。

### 关键链路解析（含上下游）

- 上游依赖：奖学金数据来自 `src/integration/tongji_openapi.ts` 的 `getStudentScholarshipInfo`，该 adapter 复用 `createTongjiOpenapiAdapter`，最终调用 CAM 生成客户端的 `Get_scholarship_infoGET`。生成方法对应路径是 `/v2/dc/student_work_info/scholarship`，请求只需要 Authorization header。
- 当前改动：`registerScholarshipInfoTool` 从 `context.invocation.accessToken` 取 token；缺失时直接返回 `unauthorized`。上游响应经 `unwrapResponseData` 提取业务 `data`，再由 `normalizeScholarshipInfoData` 要求存在 `list` 数组，并把 `count` 规范成数字或 `null`。单条记录只保留 `deptName`、`name`、`rating`、`ratingYear`、`scholarshipLevel`、`scholarshipName` 和 `updateTime`。
- 下游影响：MCP 客户端通过 `listTools` 能看到新增 Tool 及其输出 Schema；调用成功时得到 `status/data/source`，不会直接消费 Tongji OpenAPI 的原始字段。成绩 Tool 和竞赛奖励 Tool 仍走原有注册路径，本次没有改变它们的输入、输出或错误文案。

### 改动结果与业务影响

- 奖学金查询现在形成了和已有校园 Tool 一致的受控链路：Tool 输入不包含身份字段，token 不进入 Schema 或 Tool Result，上游数据先经过结构校验和字段白名单再返回。空列表会被标记为 `empty`，上游业务格式异常会被归一为工具错误，避免被误解释成“没有奖学金记录”。
- 测试继续使用 `InMemoryTransport` 与 Fake Axios adapter。也就是说，本地回归验证的是 MCP 契约、请求构造、错误归一和隐私裁剪，不访问真实校园平台，也没有写入真实 token、学号或学生数据。
- 已执行 `pnpm test`、`pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build`，四项均通过。其中 `pnpm test` 当前为 33 个用例通过。

### 风险与待办

- 工作区存在未跟踪的 `.pnpm-store/v11/index.db`，这不是本次奖学金 Tool 的源码或测试资产。提交前建议删除 `.pnpm-store/`，或把 `.pnpm-store/` 加入 `.gitignore`，避免本地 pnpm 缓存元数据误入提交。
- 当前奖学金字段 allowlist 保留了 `name`，语义上沿用了竞赛奖励 Tool 的“以上游返回内容为准”策略。如果后续隐私策略要求进一步脱敏姓名，需要同步调整输出 Schema、`ScholarshipInfo` 类型、裁剪逻辑和测试断言。
- 真实 Tongji OpenAPI 的奖学金字段类型、业务错误码和 token scope 仍需要在受控联调环境确认。如果上游响应结构演进，应同步更新 `ScholarshipInfo` 类型、输出 Schema、字段 allowlist 和 Fake 响应。

### 建议 Commit Message（git-cz）

- `feat(scholarship): add student scholarship MCP tool`


## CHANGELOG - 2026-07-31 13:08 - 接入本科生竞赛奖励查询 Tool 并注册 MCP 目录

### 撰写时间

- 2026-07-31 13:08

### Base Commit

- b1c088d21dd458bca00ee3b502f9ca237d8d950e

### Compare Scope

- working_tree_only

### 背景与改动目标

- 成绩查询 Tool 已经验证了 `Agent -> MCP invocation -> 手写 adapter -> Tongji OpenAPI -> 字段 allowlist -> Tool Result` 这条链路。接下来接入竞赛奖励记录时，重点仍然是控制暴露面：Tool 参数不接收身份字段，token 只来自 `ToolInvocationContext`，上游响应必须先裁剪再返回给 MCP 客户端。
- 这次主目标是把本科生竞赛奖励记录封装成独立的 `tongji.student.competition_prize` Tool，并挂到现有 `registerTools` 目录里。这样 Agent 侧可以通过 MCP 发现和调用竞赛奖励能力，而不需要直接接触 CAM 生成客户端的方法名、上游原始字段或 Authorization header。

### 改动概览

- 新增 `src/tools/competition-prize/`，拆分 `index.ts` 与 `types.ts`。`registerCompetitionPrizeTool` 声明空输入 Schema、结构化输出 Schema、缺 token 拒绝、上游调用、字段裁剪、空结果判断和错误归一。
- `src/integration/tongji_openapi.ts` 新增 `getCompetitionPrizes`，通过既有 `createTongjiOpenapiAdapter` 调用 CAM 生成的 `Get_competition_prizesGET`，继续复用默认 base URL、请求超时和 Bearer Authorization 注入方式。
- `src/tools/registry.ts` 将 `registerCompetitionPrizeTool` 加入 Tool Catalog。`createMcpServer -> registerTools` 的下游入口不变，但 MCP 客户端现在能额外发现 `tongji.student.competition_prize`。
- `src/tools/utils.ts` 给 `toErrorResult` 增加可选的上游不可用提示文案。成绩 Tool 仍使用默认“成绩服务”文案，竞赛奖励 Tool 可以返回更准确的“竞赛奖励服务”文案。
- `test/integration/tongji-openapi.test.ts` 覆盖竞赛奖励 adapter 的 URL、HTTP method、无 query 参数、Authorization header 和 timeout；`test/server.test.ts` 覆盖 Tool 发现、缺 token、token 注入、字段 allowlist、空结果、业务异常、401 未授权和普通上游不可用。
- 当前工作区还包含 `src/integration/tongji_openapi.ts`、`src/integration/yourtj.ts` 中若干尚未注册为 MCP Tool 的 OpenAPI/YourTJ wrapper。它们和竞赛奖励主链路不直接绑定，提交前建议确认是否拆分。

### 关键链路解析（含上下游）

- 上游依赖：竞赛奖励数据来自 Tongji OpenAPI 生成客户端的 `Get_competition_prizesGET`，生成方法路径是 `/v2/dc/student_work_info/competition_winners`，请求只需要 Authorization header。手写 adapter 负责把可信调用上下文里的短期 token 包装成 `Bearer <token>`。
- 当前改动：`registerCompetitionPrizeTool` 从 `context.invocation.accessToken` 取 token；缺失时直接返回 `unauthorized`。上游响应经 `unwrapResponseData` 取业务 `data`，再由 `normalizeCompetitionPrizeData` 要求存在 `list` 数组，最后只保留 `awardCategory`、`awardDate`、`awardLevel`、`competitionLevel`、`competitionName`、`deptName`、`name` 和 `schoolYear`。
- 下游影响：MCP 客户端通过 `listTools` 能看到新增 Tool 及其输出 Schema；调用成功时得到 `status/data/source`，不会拿到上游的 `userId`、`id`、`deptCode`、`credit`、`count` 或其他未知字段。成绩 Tool 仍走原注册路径，`toErrorResult` 的默认参数保持原有错误文案。

### 改动结果与业务影响

- 竞赛奖励查询已经形成和成绩 Tool 一致的安全边界：调用方不传身份字段，MCP 服务不持久化 token，Tool Result 只返回白名单字段。空列表会被显式标记为 `empty`，上游业务格式异常会被归一为工具错误，避免把异常响应误解释成“没有竞赛奖励”。
- 这次测试使用 `InMemoryTransport` 与 Fake Axios adapter，覆盖的是 MCP 契约和上游请求构造，不访问真实校园平台，也没有写入真实 token、学号或学生数据。
- 已执行 `pnpm test`、`pnpm test:typecheck`、`pnpm typecheck`、`pnpm build`，四项均通过；`git diff --check` 也通过，仅提示工作区文件下次被 Git 触碰时可能发生 LF/CRLF 替换。

### 风险与待办

- 当前 diff 中混入了竞赛奖励之外的多个 wrapper，尤其是 `getAllStudentDetailedInfo(config, userId)` 这类带显式身份参数的 helper。它们尚未进入 MCP Tool，也没有字段裁剪和 ownership 约束；如果本次提交只面向竞赛奖励能力，建议拆到后续独立改动。
- 工作区存在未跟踪的 `.pnpm-store/`，且当前 `.gitignore` 没有忽略它。提交前应删除该本地缓存目录，或将 `.pnpm-store/` 加入忽略规则，避免把依赖缓存带入仓库。
- 真实 Tongji OpenAPI 的竞赛奖励字段类型、业务错误码和 token scope 仍需要在受控联调环境确认。如果上游响应结构演进，应同步更新 `CompetitionPrize` 类型、输出 Schema、字段 allowlist 和 Fake 响应。

### 建议 Commit Message（git-cz）

- `feat(competition-prize): add undergraduate prize MCP tool`


## CHANGELOG - 2026-07-30 18:00 - 接入按学期年级查询专业 MCP Tool

### 撰写时间

- 2026-07-30 18:00

### Base Commit

- 0f2537c0b0a2eec02f5b32a65bb82a42c2a3008c

### Compare Scope

- working_tree_only

### 背景与改动目标

- `FindMajorByGradePOST` 是 YourTJ 的第三个接口。给定学期编号和年级，返回该学期/年级下的全部专业列表（专业编码 + 名称）。与前两个 YourTJ 工具不同，这是 POST 方法（body 传参）且有两个必填输入参数。

### 改动概览

- 新增 `src/tools/find-major-by-grade.ts`，注册 `tongji.student.find-major-by-grade` 工具。输入 `calendarId` 和 `grade` 两个必填参数的 YourTJ 公开接口；输出 `code` 和 `name` 两个字段的专业列表。
- 在 `src/integration/yourtj.ts` 新增 `getMajorsByGrade` 适配器，封装 CAM 的 `FindMajorByGradePOST`（URL: `/api/findMajorByGrade`，POST body `{ calendarId, grade }`）。
- 这是目前最精简的工具实现：仅 2 个字段、无 `readNumber`（两个字段均为 string）、无 404 特殊处理（集合端点不适用）、无隐私字段。
- 测试新增 5 个用例（适配器验证 POST body 序列化 + 4 个 Tool 路径），总计 82/82 通过。

### 关键链路解析（含上下游）

- 上游依赖：YourTJ API `/api/findMajorByGrade`，POST 方法，body 传 `{ calendarId, grade }`。
- 当前改动：`registerFindMajorByGradeTool` → `getMajorsByGrade(calendarId, grade)` → `normalizeFindMajorByGradeData`（`Array.isArray` 直接数组模式）。
- 下游影响：Agent 可按学期+年级筛选专业列表，配合 `term-calendar` 获取学年信息后可做完整的"某年级有哪些专业"查询。

### 改动结果与业务影响

- 第十一个校园 Tool，第三个 YourTJ 服务落地。与前两个 YourTJ 工具形成互补：course-detail（课程详情+评价）、course-related（关联课程/教师）、find-major-by-grade（专业列表）。
- 已执行 `pnpm check`：82/82 单测通过。审查零新发现，一次通过。

### 风险与待办

- 该工具接收的 `calendarId` 来自其他工具（如 `term-calendar`），Agent 需要正确传递。`calendarId` 的格式和有效范围由 YourTJ 决定，当前没有参数校验——传递非法值会得到正常业务响应而非错误提示。
- 公共函数在十一份文件中持续重复。`readString`/`isRecord` 是最常被重复的两个函数。

### 建议 Commit Message（git-cz）

- `feat(find-major-by-grade): add major list query MCP tool via YourTJ`


## CHANGELOG - 2026-07-30 17:00 - 接入课程关联查询 MCP Tool

### 撰写时间

- 2026-07-30 17:00

### Base Commit

- 8ecef607d736dafd28af942f6c5b464901edb898

### Compare Scope

- working_tree_only

### 背景与改动目标

- `CourseidRelatedGET` 与 `CourseDetailGET` 同属 YourTJ 公开服务。给定一个课程 ID，它返回两组关联数据：该教师还教了哪些课（`teacher_other_courses`），以及同一门课有哪些其他教师在教（`same_course_other_teachers`）。每条关联记录包含 6 个字段：课程 ID、编码、名称、教师姓名、综合评分和评价数。
- 这是第二个 YourTJ 工具，和 course-detail 共享同一个适配器文件（`yourtj.ts`）和同一套公开 API 模式。

### 改动概览

- 新增 `src/tools/course-related.ts`，注册 `tongji.student.course-related` 工具。输入必填 `id: number`；输出两组并列数组 `teacherOtherCourses` 和 `sameCourseOtherTeachers`，均使用 `RelatedCourseSummary` 类型（6 个字段）。`data` 为单对象且 nullable，在两组数组均为空时标记 `empty`。
- 在 `src/integration/yourtj.ts` 新增 `getCourseRelated` 适配器，封装 CAM 的 `CourseidRelatedGET`（URL: `/api/course/{id}/related`）。与 `getCourseDetail` 共用同一个 `createYourtjAdapter`。
- `normalizeCourseRelatedData` 同时处理两个蛇形命名的上游字段（`teacher_other_courses` / `same_course_other_teachers`），通过 `readArray` 安全回退非数组值，再逐条裁剪 6 个字段映射到驼峰命名的 JS 接口。
- `createErrorResult` 的 `status` 类型使用 `Exclude<CourseRelatedToolStatus, "ok" | "empty">`，与 course-detail 审查修正后保持一致。
- 测试新增 4 个用例（适配器 + Tool），总计 77/77 通过。

### 关键链路解析（含上下游）

- 上游依赖：YourTJ API `/api/course/{id}/related`，公开服务无认证。与 course-detail 共用 `yourtj.ts` 适配器。
- 当前改动：`registerCourseRelatedTool` → `getCourseRelated(id)` → `normalizeCourseRelatedData`（双数组裁剪）。
- 下游影响：Agent 可通过课程关联数据回答"这个老师还有什么课"和"这门课还有谁在教"两类推荐型问题。

### 改动结果与业务影响

- 第十个校园 Tool，第二个 YourTJ 服务落地。YourTJ 的两个工具（course-detail + course-related）形成了互补：一个查课程详情和评价，一个查关联课程和教师。
- 已执行 `pnpm check`：77/77 单测通过。
- 审查仅发现一个 LOW 项（`createErrorResult` 类型），已在提交前修正。

### 风险与待办

- 与 course-detail 相同的风险：YourTJ 作为外部公开服务，API 稳定性不受同济控制。
- 公共函数重复在十份文件中持续存在。`readArray` 函数在 `undergraduate-score.ts` 和 `course-detail.ts` 中已有相同实现，`course-related.ts` 再次内联了一份。

### 建议 Commit Message（git-cz）

- `feat(course-related): add course related info query MCP tool`


## CHANGELOG - 2026-07-30 16:00 - 接入课程详情查询 MCP Tool（首个 YourTJ 服务）

### 撰写时间

- 2026-07-30 16:00

### Base Commit

- 1096b5eb7238b4a1504e3834484d6f74f59fcc81

### Compare Scope

- working_tree_only

### 背景与改动目标

- 此前八个工具全部基于同济开放平台的 `/v1/rt/onetongji/` 和 `/v2/dc/` 接口，均需要 `X-Tongji-Access-Token` 认证。`CourseDetailGET` 是第一个接入 YourTJ（`jcourse.yourtj.de`）服务的工具——这是一个公开的课程评价平台，无需校园 token，按课程 ID 返回课程基本信息、开设学期列表和学生评价。
- 这次改动的核心不是重复已有的三层模式，而是验证"不同上游服务可以用同一套 MCP Tool 架构承载"的假设。结果证明：只要 adapter 接口对 Tool 层屏蔽了认证和请求细节，Tongji OpenAPI 和 YourTJ 可以无缝共存于同一个 `registerTools` 目录。

### 改动概览

- 新增 `src/tools/course-detail.ts`，注册 `tongji.student.course-detail` 工具。这是首个有输入参数的工具——必填 `id: number`（课程 ID）；输出课程基本信息（`name`/`code`/`credit`/`department`/`teacher_name`）、统计信息（`review_count`/`review_avg`）和嵌套的 `reviews` 数组（含评分、评价正文、成绩、点赞/反对数、评价人姓名）。
- 新增 `src/integration/yourtj.ts`，使用 CAM 生成的 `YourtjService` 构建适配器。与 Tongji 适配器不同：无 `accessToken` 配置、无 `withAuthorization` 方法——YourTJ 是公开 API，base URL 为 `https://jcourse.yourtj.de`。
- 关键设计决策点：
  - **无 `unauthorized` 状态**：YourTJ 为公开服务，状态枚举只有 `ok`/`empty`/`upstream_unavailable`。Tool 仍接收 `ToolInvocationContext`（由 `registerTools` 传入）但直接忽略，与有认证工具共存于同一注册入口。
  - **404 → `{ status: "empty" }`**：课程不存在时返回 empty 而非 upstream_unavailable，语义更准确——"查无此课"是用户输入错误而非服务故障。
  - **`data` 为单对象且 nullable**：与列表型工具不同，课程详情是唯一实体。`isEmptyData` 仅检查 `id` 和 `name` 是否为 null，不做全字段判断。
- 测试新增 4 个用例（适配器 + Tool），覆盖正常数据、404→empty、上游不可用、工具身份声明。总计 73/73 通过。

### 关键链路解析（含上下游）

- 上游依赖：YourTJ API（`/api/course/{id}`），公开服务，无认证依赖。CAM 生成的 `CourseDetailGET` 仅需 `id` 参数。
- 当前改动：`registerCourseDetailTool` → `getCourseDetail(id)` → `normalizeCourseDetailData`（单对象裁剪）。404 被 `toErrorResult` 转换为 `{ status: "empty" }`，不同于其他工具的 `isError: true` 错误返回。
- 下游影响：Agent 可通过 `tongji.student.course-detail` 查询任意课程的评价信息。这是首个使用 `"YourTJ"` 数据来源标记的工具，Agent 可据此区分数据出处。

### 改动结果与业务影响

- 第九个校园 Tool 落地，首个 YourTJ 服务接入。验证了多上游服务可以共存于同一 MCP 架构，adapter 层有效隔离了认证和请求差异。
- 已执行 `pnpm check`：73/73 单测通过。
- 审查中修正了两个 LOW 项：`reviewer_name` 补充了隐私使用限制标注；`createErrorResult` 的 `status` 参数类型从 `string` 收紧为 `Exclude<CourseDetailToolStatus, "ok" | "empty">`。

### 风险与待办

- YourTJ 是外部公开服务，其 API 稳定性和响应格式不受同济控制。如果上游变更课程详情字段或评价结构，`normalizeCourseDetailData` 中的字段映射需要同步更新。建议关注 YourTJ 的 API 变更通知或定期做 Inspector 回归。
- `reviewer_name` 字段的脱敏状态取决于 YourTJ 的实际返回格式（可能是昵称、匿名标识或真实姓名）。当前标注为通用使用限制，但在 Inspector 验证前无法确认标注措辞是否准确。
- 公共函数重复在九份文件中继续存在。`readStringArray` 是 course-detail 独有的新函数（未被其他工具复用），如果后续新增字符串数组字段，应优先从本文件提取。

### 建议 Commit Message（git-cz）

- `feat(course-detail): add course detail query MCP tool via YourTJ`


## CHANGELOG - 2026-07-30 14:00 - 接入住宿信息查询 MCP Tool

### 撰写时间

- 2026-07-30 14:00

### Base Commit

- 6a0c3ab0e4ea2679c7a1d4c4b42edf1de404fc5a

### Compare Scope

- working_tree_only

### 背景与改动目标

- `Student_accommodation_infoGET` 返回学生的住宿信息，包括宿舍楼、宿舍区、楼层、房间号和所属学院等 12 个字段。它是第四个 `/v2/dc/` 子服务接口，但路径前缀为 `sep_auth/`，区别于之前的 `lib/`、`user/` 和 `student_work_info/`。
- 这是第八个校园业务 Tool，也是目前实现最干净的一个——直接应用了 stipend 联调中验证过的 `data.list` 解析模式，未经历任何方向修正。

### 改动概览

- 新增 `src/tools/accommodation-info.ts`，注册 `tongji.student.accommodation-info` 工具。输出 12 个字段：`accomBuildingCode`/`accomBuildingName`（宿舍楼）、`accomRegionCode`/`accomRegionName`（宿舍区）、`roomNo`/`floor`（房间号/楼层）、`deptCode`/`deptName`（所属学院）、`usertypeCode`/`usertypeName`（人员类型）、`name`/`userId`（学生身份信息）。
- 在 `src/integration/tongji_openapi.ts` 新增 `getAccommodationInfo` 适配器，封装 CAM 的 `Student_accommodation_infoGET`（URL: `/v2/dc/sep_auth/student_accommodation_info`）。
- `normalizeAccommodationInfoData` 直接使用了 stipend 联调验证的三重判断模式：
  1. `!isRecord(data)` → `upstream_unavailable`
  2. `data.list === null` → 空 `{ records: [] }`
  3. `Array.isArray(data.list)` → 逐条裁剪 12 个字段
- `name` 和 `userId` 的 schema 描述统一为 `"已由上游做脱敏处理，不可用于身份验证。"`，与 `statistics-info.ts` 和 `stipend-info.ts` 保持一致。
- `src/tools/registry.ts` 注册新工具。测试新增 7 个用例（69/69 通过）。

### 关键链路解析（含上下游）

- 上游依赖：`Get_stipendGET` 的联调经验直接复用到本工具——`data.list` + `null` 处理，未走任何弯路。
- 当前改动：`registerAccommodationInfoTool` → `getAccommodationInfo` → `normalizeAccommodationInfoData`（三重判断）→ `{ records }`。
- 下游影响：Agent 可查询学生住宿信息。`usertypeName`（人员类型）字段可能包含"本科生""硕士研究生""博士研究生"等值，Agent 可用于身份上下文推断。

### 改动结果与业务影响

- 第八个校园业务 Tool 落地。审查零新发现，审查结论 PASS。这是第一个从初版实现到审查通过没有任何方向修正的工具——stipend 联调的教训（`data.list` 模式 + `null` 处理）在本轮被完整继承。
- 已执行 `pnpm check`：69/69 单测通过。

### 风险与待办

- `sep_auth` 路径前缀暗示该接口可能涉及独立认证（"sep_auth" ≈ separate auth）。虽然当前与其他 dc 接口共用同一 Bearer token，但后续若该子服务升级认证策略，可能需要独立处理。
- 八个 Tool 文件的公共函数重复已达 ~720 行。连续八轮未清理。这是当前项目最大的工程债务。

### 建议 Commit Message（git-cz）

- `feat(accommodation-info): add accommodation info query MCP tool`


## CHANGELOG - 2026-07-30 10:00 - 接入助学金信息查询 MCP Tool 并通过 MCP Inspector 联调修正

### 撰写时间

- 2026-07-30 10:00

### Base Commit

- bd33410e45c4b7e52df1f8e7a5552027b9cf89b8

### Compare Scope

- working_tree_only

### 背景与改动目标

- `Get_stipendGET` 返回学生获得的助学金记录，包括金额、名称、等级、评定学年/学期和所属学院等 12 个字段。它是第三个 `/v2/dc/` 子服务接口（`student_work_info/stipend`），与图书借阅、个人统计同属数据中台。
- 这次改动在开发和审查流程上重复了 book-lend-info 的教训：第一版基于 spec 假设了 `data.list` 嵌套结构，审查建议改为直接数组（`Array.isArray(data)`），但 MCP Inspector 联调发现两个方向都不完全正确——真实 API 使用 `{ count, list }` 对象结构，且无记录时 `list` 为 `null` 而非空数组。

### 改动概览

- 新增 `src/tools/stipend-info.ts`，注册 `tongji.student.stipend-info` 工具。工具无输入参数，从 `ToolInvocationContext` 读取 token；输出 12 个字段：`amount`（金额）、`stipendName`（助学金名称）、`rankName`（等级）、`ratingYear`/`ratingTerm`（评定学年/学期）、`deptCode`/`deptName`/`unitAbbreviation`（所属单位信息）、`name`/`userId`（获奖学生信息）、`wid`（唯一标识）、`updateTime`（更新时间）。
- 在 `src/integration/tongji_openapi.ts` 新增 `getStipendInfo` 适配器，封装 CAM 的 `Get_stipendGET`（URL: `/v2/dc/student_work_info/stipend`）。
- **MCP Inspector 联调修正** —— 经历了两次方向调整：
  1. 初版使用 `isRecord(data) && Array.isArray(data.list)`（假设 `{ list: [...] }` 嵌套）。
  2. 审查后改为 `Array.isArray(data)`（借鉴 book-lend-info 教训，假设直接数组）。
  3. Inspector 调试显示真实 API 返回 `{ count: 0, list: null }`——既不是直接数组，`list` 在无记录时也不是 `[]`。
  4. 最终方案：`isRecord(data)` + `data.list === null` → 空数据 + `Array.isArray(data.list)` → 正常解析。同时覆盖了三种情况：对象包含 `list` 数组、`list` 为 `null`、结构格式异常。
- `name` 和 `userId` 的 schema 描述统一为 `"已由上游做脱敏处理，不可用于身份验证。"`，与 `statistics-info.ts` 保持一致。
- `src/tools/registry.ts` 注册新工具。
- 补齐单元测试：适配器测试验证 `/v2/dc/student_work_info/stipend` 路径；MCP Server 测试新增 7 个用例，fixture 与真实 API 响应对齐（`{ count, list }` 嵌套结构）。

### 关键链路解析（含上下游）

- 上游依赖：`ToolInvocationContext`→`registerStipendInfoTool`。`Get_stipendGET` 是 `/v2/dc/student_work_info/` 路径下的接口，与图书借阅（`lib/`）和用户统计（`user/`）同属 dc 中台但分属不同服务模块。
- 当前改动：`normalizeStipendInfoData` 先判 `data` 是否为 Record（否则 → `upstream_unavailable`），再判 `data.list` 是否为 `null`（是 → 空 `{ records: [] }`），最后判是否为数组（是 → 逐条 `map`；否 → `upstream_unavailable`）。三重判断覆盖了真实 API 的所有已知响应路径。
- 下游影响：Agent 可获取学生获得的助学金历史。字段中包含 `name` 和 `userId`，schema 明确标注了脱敏和使用限制。

### 改动结果与业务影响

- 第七个校园业务 Tool 落地并经过真实 API 联调验证。这次联调再次确认了"spec + 审查判断都无法替代真实 API 响应"的原则——`list: null` 这种边界情况只能在 Inspector 中暴露。
- 已执行 `pnpm check`：62/62 单测通过，测试 fixture 已与真实 API 响应对齐。
- 本次联调还暴露了一个模式：`/v2/dc/` 接口在无记录时可能返回 `null` 而非空数组。cet-score 的 `data.list` 尚未报告此问题（可能是该 API 始终返回 `[]`），但后续新工具应在 `normalize` 函数中统一处理 `null` 分支，避免逐个联调才发现。

### 风险与待办

- `list: null` 的空数据处理目前仅在 stipend 工具中实现。cet-score 和后续可能出现的其他 `data.list` 型接口应该也加入同样的处理——否则一旦对应 API 返回 `null` 而非 `[]`，会触发 `upstream_unavailable` 误报。
- 七个 Tool 文件的公共函数重复已达 ~630 行。连续七轮标记未清理。这个技术债已经积累了足够长的时间，不能再靠"下一轮再说"推迟。

### 建议 Commit Message（git-cz）

- `feat(stipend-info): add stipend info query MCP tool`


## CHANGELOG - 2026-07-29 19:38 - 拆分本科成绩 Tool 的类型与通用响应处理

### 撰写时间

- 2026-07-29 19:38

### Base Commit

- 1c82e15b8762a10d2371abda49d2138188f4412c

### Compare Scope

- working_tree_only

### 背景与改动目标

- `tongji.student.score` 已经形成稳定的 MCP 契约，但最初把输出类型、上游响应解包、字段读取、错误归一与 Tool 注册都放在一个文件中。后续校园 Tool 需要复用这些受控边界时，继续复制会让错误状态和字段转换逐渐漂移。
- 这次不改变成绩查询协议、token 传递方式或上游适配器，而是先把可复用的类型和纯转换函数抽到 `src/tools/` 下，并保持 Tool 注册入口与 MCP 对外名称不变。

### 改动概览

- 将原 `src/tools/undergraduate-score.ts` 迁移为 `src/tools/undergraduate-score/index.ts` 与 `types.ts`。成绩 Tool 的输入 Schema、输出 Schema、token 读取、成绩字段 allowlist 和 `calendarId` 语义保持原有行为。
- 新增 `src/tools/types.ts` 统一 Tool 状态类型；新增 `src/tools/utils.ts` 承载响应解包、记录/数组/字符串/数值读取、Axios 未授权识别以及稳定错误结果构造。成绩 Tool 只保留领域归一与 MCP 注册逻辑。
- `registerTools` 继续从 `./undergraduate-score` 导入注册函数，Node 的目录 `index.ts` 解析保持既有调用链；README 目录树同步为 `undergraduate-score/`，避免继续指向已删除的单文件路径。
- `src/integration/test.ts` 增加受控人工验证示例的注释，不改变该文件不进入自动化单测的约束。

### 关键链路解析（含上下游）

- 上游依赖：HTTP 传输层仍在每次 MCP 请求中创建 `ToolInvocationContext`，其中的短期 token 由可信主 Agent 注入；`getUndergraduateScores` 仍是唯一调用 CAM OpenAPI 客户端的手写适配器。
- 当前改动：`registerUndergraduateScoreTool` 继续只从调用上下文取得 token。上游响应经 `unwrapResponseData` 后校验 `term` 结构，再由本科成绩领域代码裁剪为批准字段；401/403 与其他异常分别经 `toErrorResult` 转为稳定工具错误。
- 下游影响：MCP 客户端仍发现同名 `tongji.student.score`，输入、`structuredContent`、错误消息与字段白名单均不变。后续 Tool 可以复用 `utils.ts`，但仍需自行定义领域数据结构和输出 allowlist，不能直接透传上游响应。

### 改动结果与业务影响

- 成绩 Tool 的注册链路仍是 `createMcpServer -> registerTools -> registerUndergraduateScoreTool`；模块拆分没有把 token 放入 Tool 参数，也没有扩大 Tool Result 的字段范围。
- 既有 `test/server.test.ts` 通过新的目录导入路径覆盖 Tool 发现、缺 token、上游 token 注入、字段裁剪、空数据、上游未授权和不可用结果，验证重构后对外 MCP 契约保持一致。
- 已执行 `pnpm check`（19/19 单测通过）、`pnpm test:typecheck`、`pnpm typecheck`、`pnpm build` 与 `git diff --check`。测试使用内存 MCP transport、Fake Axios adapter 和虚构 token，不访问真实校园平台。

### 风险与待办

- `utils.ts` 当前只被成绩 Tool 使用。后续新 Tool 复用时，应确认其错误状态集合和字段转换规则是否适用，避免为了共享而让不同领域共用不准确的语义。
- `src/integration/test.ts` 仍是人工验证示例，不能被生产入口或自动化测试导入；正式新增上游调用时，应继续通过 Fake adapter 覆盖请求构造、错误归一与脱敏结果。
- 真实开放平台的字段类型和业务错误码仍需在受控联调环境确认。若上游响应演进，应同步调整领域类型、输出 Schema、允许字段与测试 fixture。

### 建议 Commit Message（git-cz）

- `refactor(score): split tool types and response utilities`


## CHANGELOG - 2026-07-29 16:00 - 接入个人校园统计 MCP Tool

### 撰写时间

- 2026-07-29 16:00

### Base Commit

- c6f1987c27af2d7ffec5c1dbf6e44c3ac9972d96

### Compare Scope

- working_tree_only

### 背景与改动目标

- `Get_statistics_infoGET` 是目前信息密度最高的校园数据接口——单条记录覆盖图书馆（借阅主题/数量/在馆时长）、食堂（总消费/最常去/排名百分比）、校车（往返次数）、超市（消费金额）、奖学金（获奖次数）和校园卡（补卡/充值时段/消费场所）等六个维度共 29 个字段。
- 这也是第二个 `/v2/dc/` 子服务接口（与图书借阅同属 `dc` 数据中台）。封装目标与前五个工具一致，但 `normalizeStatisticsInfoData` 直接使用了 `Array.isArray(data)` 而非嵌套对象查找——这是 book-lend-info 联调教训的直接应用。

### 改动概览

- 新增 `src/tools/statistics-info.ts`，注册 `tongji.student.statistics-info` 工具。工具无输入参数，从 `ToolInvocationContext` 读取 token；输出 29 个字段，覆盖图书馆（`bookCategory`/`bookCoun`/`bookFirst`/`entranceCoun`/`stayTime`/`stayTimePercentileRank`/`earlistTime`/`latestTime`）、餐饮消费（`canteenAmount`/`canteenCoun`/`canteenOften`/`canteenAmtPercentileRank`/`canteenOftenPercentileRank`/`consumeTotal`/`consumeTotalPercentileRank`/`consumMostAmount`/`consumMostTime`/`consumePlaceOften`）、生活服务（`rideCoun`/`marketAmount`/`cardPelaceCoun`/`firstCardPlaceTime`/`rechargeTimeSlot`）、学业荣誉（`scholarshipCoun`/`entYear`/`stayYear`/`stuLevel`）、身份信息（`userId`/`sname`/`gender`/`college`/`major`）。
- 在 `src/integration/tongji_openapi.ts` 新增 `getStatisticsInfo` 适配器，封装 CAM 的 `Get_statistics_infoGET`（URL: `/v2/dc/user/user_data_statistics`）。
- `normalizeStatisticsInfoData` 使用 `Array.isArray(data)` 解析——没有重蹈 book-lend-info 初版 `data.userInfos` 嵌套假设的覆辙。这是本项目中第一次在未联调的情况下就使用了正确的数组模式。
- `college`/`major`/`sname`/`userId` 四个字段的 schema 标注为"已由上游做脱敏处理"。审查建议在 MCP Inspector 联调前不做最终确认——book-lend-info 的教训是 spec 示例的掩码状态可能与真实返回值不同。建议联调后根据实际数据修正 `.describe()`。
- `src/tools/registry.ts` 注册新工具。
- 补齐单元测试：适配器测试验证 `/v2/dc/user/user_data_statistics` 路径；MCP Server 测试新增 7 个用例。

### 关键链路解析（含上下游）

- 上游依赖：`ToolInvocationContext`→`registerStatisticsInfoTool`。`Get_statistics_infoGET` 与图书借阅同属 `/v2/dc/` 子服务，使用同一套 base URL 和请求构造方式。
- 当前改动：`registerStatisticsInfoTool` 通过 `getStatisticsInfo` 请求上游，`unwrapResponseData` 提取 `data` 数组后直接 `map` 裁剪 29 个字段。字段类型以 `number` 为主（19 个数值字段，10 个字符串字段），数值覆盖金额、次数、排名百分比、年份和时长等多种语义。
- 下游影响：Agent 可获得全校维度的个人行为画像，用于"我的大学数据"类问答。六个消费/时长维度的排名百分比（`PercentileRank`）字段是离散值（例如"超过 73% 的同济人"），Agent 可直接用于生成相对排名类回答。

### 改动结果与业务影响

- 第六个校园业务 Tool 落地，29 个字段又一次刷新区块记录长度上限。已执行 `pnpm check`：55/55 单测通过，类型检查和构建均通过。
- 经过六个 Tool 的迭代，接入一个新 OpenAPI 的路径已经高度标准化：读 spec → 写 adapter → 写 normalize → 写 outputSchema → 注册 → 写 8 个测试 → `pnpm check`。从书面的 spec 字段列表到可工作的 Tool 代码，转换过程纯粹是机械的模式匹配。这为后续自动化提供了可能性。

### 风险与待办

- `college`/`major`/`sname`/`userId` 的脱敏状态未经验证。其中 `college`（学院名如"土木工程学院"）和 `major`（专业名）本身不是敏感个人信息，标注"已脱敏"可能不准确。建议在 MCP Inspector 中联调一次后修正。
- 六个 Tool 文件的公共函数重复已达 540 行。连续六轮标记未清理。下一个 Tool 如果落地前不解决，将面临七处同步修改的成本。
- `/v2/dc/` 子服务已有两个接口。后续若出现第三个，可能需要评估是否为 dc 子服务创建独立的适配器配置（如独立的 base URL 或超时策略）。

### 建议 Commit Message（git-cz）

- `feat(statistics-info): add personal campus statistics MCP tool`


## CHANGELOG - 2026-07-29 14:00 - 接入图书借阅信息查询 MCP Tool 并通过 MCP Inspector 联调修正

### 撰写时间

- 2026-07-29 14:00

### Base Commit

- 4b22fb6f83f3f1bf2d4cbaa23af5f8c39aa9ab6a

### Compare Scope

- working_tree_only

### 背景与改动目标

- 学生的图书借阅记录是校园数据中信息密度最高的领域之一——每条记录包含书名、作者、ISBN、馆藏地、借出/续借/还书日期和读者信息等 28 个字段。`Get_book_lend_infoGET` 属于 `/v2/dc/` 子服务，不同于之前五个工具的 `/v1/rt/onetongji/`。
- 封装目标与前五个工具一致。但这次经历了一个重要的教训：spec 示例中的响应结构与真实 API 不一致，导致第一版实现上线即报 `upstream_unavailable`。通过 MCP Inspector 联调定位并修正了两个关键偏差。

### 改动概览

- 新增 `src/tools/book-lend-info.ts`，注册 `tongji.student.book-lend-info` 工具。工具无输入参数，从 `ToolInvocationContext` 读取 token；输出 28 个字段，是目前字段最多的 Tool 记录类型。剔除了 `isJournal`、`voltFlag` 等无 spec 注释的内部字段。
- 在 `src/integration/tongji_openapi.ts` 新增 `getBookLendInfo` 适配器，封装 CAM 的 `Get_book_lend_infoGET`（URL: `/v2/dc/lib/lend_info_all`）。
- **MCP Inspector 联调修正** —— 第一版有两个基于 spec 示例的错误假设，联调时被真实响应对齐：
  1. **`data` 结构**：spec 示例为 `{ count: 2, userInfos: [...] }`，真实 API 直接返回数组 `[...]`。`normalizeBookLendInfoData` 从 `isRecord(data) && Array.isArray(data.userInfos)` 改为 `Array.isArray(data)`，与 `term-calendar.ts` 同构。
  2. **`userId` 脱敏状态**：spec 示例为掩码值 `"20**4"`，真实 API 返回完整学工号 `"2350939"`——与 `name` 字段一样未做脱敏。两个字段的 `.describe()` 统一标注为 `"注意该字段未做脱敏处理，不可在公开输出中直接引用。"`。
- `src/tools/registry.ts` 注册新工具。
- 补齐单元测试：适配器测试验证 `/v2/dc/lib/lend_info_all` 路径；MCP Server 测试新增 7 个用例，fixture 已与真实 API 响应对齐（数组结构、字符串型数值字段）。

### 关键链路解析（含上下游）

- 上游依赖：`ToolInvocationContext`→`registerBookLendInfoTool`。CAM 的 `Get_book_lend_infoGET` 使用 `/v2/dc/` 路径前缀，说明图书馆是独立部署子服务。
- 当前改动：`registerBookLendInfoTool` 通过 `getBookLendInfo` 请求上游，`unwrapResponseData` 提取 `data` 数组后直接 `map` 裁剪。`isEmptyData` 在空数组时标记 `empty`。
- MCP Inspector 联调：初始实现直接返回 `upstream_unavailable`，通过临时 `console.error` 打印原始响应发现 `data` 是数组而非对象。修正后 Inspector 正常返回 28 个裁剪字段。调试日志已移除。

### 改动结果与业务影响

- 第五个校园业务 Tool 落地并经过真实 API 联调验证。这次联调验证了"spec 不可盲信"的原则——离线单测只能验证代码逻辑，无法发现 spec 与真实 API 的结构偏差。
- 已执行 `pnpm check`：48/48 单测通过，类型检查和构建均通过。
- 审查过程中还发现 `renewDate` 和 `asbackDate` 在真实响应中为空字符串 `""` 而非 spec 示例的特定日期值——`readString` 直接透传空串，下游消费端需自行处理。

### 风险与待办

- `name` 和 `userId` 均返回完整未脱敏值。当前仅靠 schema 的 `.describe()` 标注约束 Agent 行为，没有服务端阻断。如果隐私策略收紧，需要在 `normalizeBookLendRecord` 中做字段级掩码。
- 五个 Tool 文件的公共函数重复已到 450 行，在连续五轮 changelog 中标记为技术债。计划在第六个 Tool 前完成提取。
- `Get_book_lend_infoGET` 是第一个使用 `/v2/dc/` 前缀的接口。后续若出现更多 v2 子服务，需注意它们可能有不同的超时和错误码约定。

### 建议 Commit Message（git-cz）

- `feat(book-lend-info): add book lending info query MCP tool`


## CHANGELOG - 2026-07-28 13:00 - 接入四六级成绩查询 MCP Tool 并标注脱敏字段

### 撰写时间

- 2026-07-28 13:00

### Base Commit

- 346f7c9bf603a0ae047ed2ba370275cfb0485ce2

### Compare Scope

- working_tree_only

### 背景与改动目标

- Agent 查询学生 CET-4/CET-6 成绩的能力此前是空白的。`Cet_scoreGET` 返回当前已授权学生的全部四六级成绩记录，每条包含考试科目、准考证号、笔试成绩、口语成绩和考试时间。和前三个工具一样，目标是把 CAM 生成的 API 封装为手写边界，做字段裁剪和错误归一，而不是直接暴露上游原始响应。
- 与全部学期日历（列表型）和当前学期日历（单对象嵌套型）不同，四六级成绩的 API 使用分页结构——`data` 是 `{ pageNum_, pageSize_, total_, list: [...] }`。因此结构校验点落在 `data.list` 是否为数组，这与本科成绩的 `data.term` 校验模式一致。
- 审查中额外关注了一个隐私问题：`studentId`、`studentName`、`cardNo` 虽然上游已做掩码处理（如 `205****`），但 `outputSchema` 的 `.describe()` 没有提示 Agent 这些字段不可用于身份验证。这次在三处描述中补充了脱敏标注。

### 改动概览

- 新增 `src/tools/cet-score.ts`，注册 `tongji.student.cet-score` 工具。工具无输入参数，从 `ToolInvocationContext` 读取 token；输出 `studentId`、`studentName`、`competitionType`、`writtenSubjectName`、`cardNo`、`score`、`scoreRank`、`oralScore`、`examTime`、`cetType` 十个字段，丢弃 `calendarId`、`calendarYear`、`title`、`subjectCode`、`competitionId` 等内部字段和分页元数据（`pageNum_`/`pageSize_`/`total_`）。
- 在 `src/integration/tongji_openapi.ts` 新增 `getCetScores` 适配器，封装 CAM 的 `Cet_scoreGET`（URL: `/v1/rt/onetongji/cet_score`）。与其他三个适配器共用同一套 `createTongjiOpenapiAdapter`。
- `normalizeCetScoreData` 的结构校验为 `isRecord(data) && Array.isArray(data.list)`——与 `undergraduate-score.ts` 的 `data.term` 校验保持一致。缺少 `list` 或 `data` 非对象时返回 `undefined` → `upstream_unavailable`；空列表 → `status: "empty"`。
- `studentId`、`studentName`、`cardNo` 三个字段的 `outputSchema` 描述中补充了"已由上游做脱敏处理，不可用于身份验证"的标注，提醒 Agent 不得将这些字段作为认证或鉴权依据。
- `src/tools/registry.ts` 注册新工具，与已有四个工具并列。
- 补齐单元测试：适配器测试新增 `getCetScores` 的请求构造断言；MCP Server 测试新增 7 个四六级成绩用例，覆盖工具发现、token 注入与字段裁剪、空列表标记为空、上游业务错误被结构校验拒绝、401/403 未授权和网络不可用。

### 关键链路解析（含上下游）

- 上游依赖：`ToolInvocationContext` 由 `src/transport/http.ts` 构造并经 `registerTools` 分发。CAM 的 `Cet_scoreGET` 仅接收 `Cet_scoreHeaderRequest`（`Authorization` header），无查询参数——这与全部学期日历、当前学期日历一致。
- 当前改动：`registerCetScoreTool` 通过 `getCetScores` 请求上游，`unwrapResponseData` 提取 `data` 后进入 `normalizeCetScoreData`。该校验函数先确认 `data` 是 Record 且 `data.list` 是数组（不满足 → `upstream_unavailable`），再逐条 `map` 通过 `normalizeCetScoreRecord` 裁剪字段。输出按 `CetScoreData` 包裹为 `{ records: [...] }`，与 `term-calendar.ts` 的 `{ terms: [...] }` 模式同构。
- 下游影响：Agent 可通过 `tongji.student.cet-score` 直接获取四六级成绩列表，同样使用 `Tongji Open Platform` 来源标记和 `ok/empty` 状态语义。

### 改动结果与业务影响

- 第四个校园业务 Tool 落地。当前 `src/tools/` 下共有四个工具文件，公共函数（`readString`/`readNumber`/`isRecord`/`unwrapResponseData`/`toErrorResult`/`createErrorResult`）重复量约 360 行，已在连续四轮 changelog 中记录为待清理的技术债。
- 已执行 `pnpm check`：41/41 单测通过（新增 8 个 cet-score 用例），`pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build` 均通过。测试仅使用 Fake Axios adapter 和虚构脱敏数据，不访问真实校园平台。
- 审查过程中未发现新的功能性或安全性缺陷。本次改动在结构校验、空数据处理和错误归一三个维度都直接复用了已验证的模式，是四个工具中实现最规范的一个。

### 风险与待办

- 四个 Tool 文件的公共函数重复已到临界点。我计划在下一个 Tool 落地前完成抽取：先把 `readString`/`readNumber`/`isRecord` 移入 `src/tools/helpers/`，再把 `createErrorResult` 和 `toErrorResult` 改为接受 Tool 名称参数的工厂函数——或者更彻底地把错误归一逻辑收敛到 `src/domain/` 公共层，让每个 Tool 只定义自己的字段接口和输出 Schema。
- 当前 `Cet_scoreGET` 返回所有已授权学生的 CET 记录，不做分页过滤。如果学生在大学期间参加了多次四六级考试（例如刷分），列表可能较长。Agent 端可以通过 `cetType`（1=四级/2=六级）和 `examTime` 做筛选，但 MCP 工具本身不提供分页或筛选参数。
- `studentId`/`studentName`/`cardNo` 的脱敏依赖上游掩码规则。若上游掩码格式变化（例如不再掩码而暴露完整值），Tool Result 中的 PII 暴露风险会显著上升。当前 schema 的 `.describe()` 标注只能作为 Agent 端的消费提示，不能替代服务端的字段级阻断。

### 建议 Commit Message（git-cz）

- `feat(cet-score): add CET score query MCP tool`


## CHANGELOG - 2026-07-28 11:00 - 接入当前学期日历查询 MCP Tool 并增强数据校验

### 撰写时间

- 2026-07-28 11:00

### Base Commit

- 7226f9a977e51004920c23ecd19c268cc86dcc77

### Compare Scope

- working_tree_only

### 背景与改动目标

- `tongji.student.term-calendar` 返回全部学期的日历列表，但 Agent 通常只需要知道"现在是第几学期、第几周"。`Get_current_term_calendarGET` 就是提供这个信息的入口——它返回当前学期的 `schoolCalendar` 基础信息（年/学期/周数）、当前所在周序号，以及人类可读的学期描述。
- 这次的目标和上一轮一致：严格复用已验证的适配器→Tool→注册三层模式，不引入新架构概念。但当前学期日历的 API 返回结构与列表型接口有本质差异——它是一个单对象，其中 `year`/`term`/`weekNum` 嵌套在 `schoolCalendar` 子对象里，而 `week`/`simpleName`/`now`/`name` 在顶层。因此在裁剪逻辑和空值判断上需要独立实现。
- 上一轮审查还指出了两个具体问题：当上游返回 `data: null` 时不应误判为"服务异常"，以及缺少结构校验会让错误响应（如 `{code:500}`）被静默转为空数据。这次一并修正。

### 改动概览

- 新增 `src/tools/current-term-calendar.ts`，注册 `tongji.student.current-term-calendar` 工具。工具无输入参数，从 `ToolInvocationContext` 读取 token；输出 `year`、`term`、`weekNum`、`week`、`simpleName`、`now`、`name` 七个字段，丢弃 `id`、`beginDay`、`endDay`、`createdAt`、`updatedAt` 等内部字段和 `schoolCalendar` 中的冗余属性。
- 在 `src/integration/tongji_openapi.ts` 新增 `getCurrentTermCalendar` 适配器，封装 CAM 的 `Get_current_term_calendarGET`（URL: `/v1/rt/onetongji/school_calendar_current_term_calendar`）。
- `normalizeCurrentTermCalendarData` 做了两处与列表型工具不同的安全处理：
  - `data === null` 直接返回全字段为 `null` 的 `EMPTY_CURRENT_TERM_CALENDAR` 常量，下游 `isEmptyData` 判定后设置 `status: "empty"`，Agent 收到的 `data` 字段为 `null`。
  - 结构校验要求 `data.schoolCalendar` 必须为 `Record`，否则返回 `undefined` → 触发 `upstream_unavailable`。这防止了上游返回业务错误体（如 `{code:500, message:...}` 中的 `data` 子对象）被误读为"全 null 的空数据"。
- `src/tools/registry.ts` 注册新工具，与已有三个工具并列。
- 补齐单元测试：适配器测试新增 `getCurrentTermCalendar` 的请求构造断言；MCP Server 测试新增 8 个当前学期日历用例，覆盖工具发现、token 注入与 `schoolCalendar` 嵌套裁剪、空对象标记为空、`data:null` 视为空数据、上游业务错误被结构校验拒绝、401/403 未授权和网络不可用。

### 关键链路解析（含上下游）

- 上游依赖：与 `term-calendar` 一致，`ToolInvocationContext` 由 `src/transport/http.ts` 构造并经 `registerTools` 分发。CAM 生成的 `Get_current_term_calendarGET` 仅接收 `Authorization` header，无查询参数。
- 当前改动：`registerCurrentTermCalendarTool` 通过 `getCurrentTermCalendar` 请求上游，`unwrapResponseData` 提取 `data` 后进入 `normalizeCurrentTermCalendarData`。该函数先判 `null`（→空结果），再判 `isRecord` 和 `schoolCalendar` 结构存在性（→错误），最后分别从 `schoolCalendar` 和顶层读取对应字段。`isEmptyData` 检查全部七个字段是否均为 `null`，是则标记 `empty` 并返回 `data: null`。
- 下游影响：Agent 可通过 `tongji.student.current-term-calendar` 直接获取当前学期状态，无需遍历全部学期列表再定位 `currentTermFlag: true` 的记录。工具之间的数据来源都标记为 `Tongji Open Platform`，契约格式一致。

### 改动结果与业务影响

- 第三个校园业务 Tool 落地。当前 `src/tools/` 下共有三个工具文件，均使用相同模式的 `readString`/`readNumber`/`isRecord`/`unwrapResponseData`/`toErrorResult`/`createErrorResult` 内联实现。重复代码约 270 行，已在连续两轮 changelog 中记录为待清理的技术债。
- 已执行 `pnpm check`：34/34 单测通过（新增 8 个当前学期日历用例 + 1 个适配器用例），`pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build` 均通过。
- 这次在测试阶段发现了两个问题：第一版用 `assert.equal` 对比对象引用导致测试失败（应使用 `assert.deepEqual`）；第一版缺少 `schoolCalendar` 结构校验导致业务错误响应被误判为空数据。两者已在提交前修正。

### 风险与待办

- 三个 Tool 文件（`undergraduate-score.ts`、`term-calendar.ts`、`current-term-calendar.ts`）中的公共函数重复量已经值得一次专门的抽取。建议在第四个 Tool 落地前完成提取，否则后续每个新工具都会继续增加约 90 行重复代码。抽取时可以先把 `readString`、`readNumber`、`isRecord` 放入 `src/tools/helpers/`，再将 `createErrorResult` 和 `toErrorResult` 改为接受 Tool 名称作为错误消息参数的工厂函数。
- 当前学期日历的 `empty` 判断使用"全部七个字段为 null"的规则。若上游某一天只返回部分字段（例如只有 `year` 和 `term` 而无 `week`），会被视为"有数据"。这在当前边界下是合理的——部分数据好于无数据——但如果此类上游响应实际上意味着"服务降级"，则应考虑引入更精确的语义判断。
- `src/integration/bkzs/` 仍为未跟踪的无关 CAM 生成目录，需单独处理。

### 建议 Commit Message（git-cz）

- `feat(current-term-calendar): add current term calendar MCP tool`


## CHANGELOG - 2026-07-27 20:00 - 接入学期日历查询 MCP Tool 并补齐测试覆盖

### 撰写时间

- 2026-07-27 20:00

### Base Commit

- 1c82e15b8762a10d2371abda49d2138188f4412c

### Compare Scope

- working_tree_only

### 背景与改动目标

- `tongji.student.score` 落地后，适配器→Tool→注册三层模式已经过验证，但上游 OpenAPI 中 `Get_all_term_calendarGET` 仍没有被封装。Agent 在查询课表或成绩前需要学期编号（`calendarId`），而编号来源就是学期日历列表。
- 这次不引入新的架构概念，而是严格复用成绩查询的实现链路：手写适配器封装 CAM 生成方法、Tool 层做字段白名单裁剪和错误归一、输出 schema 用中文 `.describe()` 让 Agent 感知字段含义。同时补齐上一轮审查指出的测试缺口。

### 改动概览

- 新增 `src/tools/term-calendar.ts`，注册 `tongji.student.term-calendar` 工具。工具无输入参数，仅从 `ToolInvocationContext` 读取 token；未授权、上游 401/403、网络失败及业务格式异常均返回稳定的工具错误。
- 在 `src/integration/tongji_openapi.ts` 新增 `getAllTermCalendars` 适配器，把 CAM 的 `Get_all_term_calendarGET` 封装为带 Bearer Authorization 的手写函数，与 `getUndergraduateScores` 共用同一套 `createTongjiOpenapiAdapter`。
- 工具对上游客器响应实施 allowlist：只输出 `year`、`term`、`weekNum` 和 `fullName` 四个字段，丢弃 `id`、`beginDay`、`endDay`、`deleteFlag`、`ids`、`gradePartOne`、`gradePartTwo`、`currentTermFlag`、`nextTermFlag`、`perTerm`、`perYear` 以及创建/更新时间等内部字段。`outputSchema` 中每条字段均有中文描述。
- `src/tools/registry.ts` 中注册新工具，与已有 `registerUndergraduateScoreTool` 并列。
- `.gitignore` 增加 `.claude` 目录忽略规则，避免 IDE 配置文件进入仓库。
- 补齐单元测试：适配器测试（`test/integration/tongji-openapi.test.ts`）新增 `getAllTermCalendars` 的请求构造断言；MCP Server 测试（`test/server.test.ts`）新增 7 个学期日历工具用例，覆盖工具发现、token 注入与字段裁剪、空数据标记、上游业务错误、401/403 未授权和网络不可用六条路径。

### 关键链路解析（含上下游）

- 上游依赖：`src/transport/http.ts` 为每次 `/mcp` 请求构造 `ToolInvocationContext`；`registerTools` 将该上下文分发给 `registerAllTermCalendarTool`。CAM 生成的 `Get_all_term_calendarGET` 仅接收 `Authorization` header，无查询参数。
- 当前改动：`registerAllTermCalendarTool` 从调用上下文获取 token，通过 `getAllTermCalendars` 构造上游请求。响应先 `unwrapResponseData` 提取 `data` 数组，再经 `normalizeTermCalendarData` 逐条裁剪字段；非数组响应会触发 `upstream_unavailable` 错误。`isEmptyData` 在空数组时标记 `empty` 状态，让 Agent 区分"暂无数据"和"服务异常"。
- 下游影响：Agent 可通过 `tongji.student.term-calendar` 获取全部学期编号列表，用于后续传入 `tongji.student.score` 的 `calendarId` 参数。两个工具共享相同的 token 注入、错误归一和 `Tongji Open Platform` 数据来源标记，调用方无需区分底层适配器差异。

### 改动结果与业务影响

- 第二个校园业务 Tool 已形成与成绩查询一致的闭环，适配器层和 Tool 层的重复逻辑（`readString`、`readNumber`、`isRecord`、`toErrorResult`、`createErrorResult`）当前各自内联。考虑到两个工具的上游字段结构差异较大，暂未抽取公共模块；当第三个工具落地时再评估提取的收益与接口设计。
- 已执行 `pnpm check`：26/26 单测通过（新增 7 个学期日历用例 + 1 个适配器用例），`pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build` 均通过。测试仅使用 Fake Axios adapter、`InMemoryTransport` 和虚构 token，不访问真实校园平台。
- `outputSchema` 中 `status` 枚举仅包含 `ok` 和 `empty`，错误状态通过 `isError: true` 返回，与成绩查询工具保持一致的 MCP 错误契约。

### 风险与待办

- `readString`、`readNumber`、`isRecord`、`unwrapResponseData` 和错误归一函数在两个工具文件中各自重复。当前边界下不影响正确性，但后续新增工具时重复代码会继续膨胀。第三个校园 Tool 落地时应评估是否将公共裁剪/归一函数提取到 `src/tools/helpers/` 或 `src/domain/` 层。
- 学期日历数据在上游可能新增学期状态字段。当前 allowlist 显式排除未批准字段，上游新增字段不会泄漏到 Tool Result，但也不会被 Agent 感知。若后续需要新字段，应同步更新 `TermCalendar` 接口、`normalizeTermCalendar` 和 `TERM_CALENDAR_SCHEMA`。
- `src/integration/bkzs/` 是另一个 CAM 生成的招生服务客户端，与本次改动无关，建议在独立 commit 中处理。

### 建议 Commit Message（git-cz）

- `feat(term-calendar): add term calendar query MCP tool`


## CHANGELOG - 2026-07-26 21:29 - 接入本科成绩查询 MCP Tool 并收敛上游成绩数据

### 撰写时间

- 2026-07-26 21:29

### Base Commit

- fd55ba47862220e68c9952bae4134b24e798fff2

### Compare Scope

- working_tree_only

### 背景与改动目标

- 测试骨架已经固定了 MCP 的 HTTP、调用上下文和本地回归入口，但 Tool Catalog 仍为空，可信的 `X-Tongji-Access-Token` 还没有形成一条真正的校园业务调用链。
- 这次先落地本科生成绩查询，而不是把 CAM 生成的 OpenAPI 方法直接暴露给 Agent。目标是把 token 注入、上游请求、错误归一和成绩字段裁剪收敛在手写边界内，并用 MCP Inspector 提供可操作的本地调试说明。

### 改动概览

- 新增 `tongji.student.score`。工具接受可选 `calendarId`，仅从 `ToolInvocationContext` 读取 token；未授权、上游 401/403、网络失败及业务格式异常都会返回稳定的工具错误。
- 新增 `src/integration/tongji_openapi.ts`，把 CAM 的 `Undergraduate_scoreGET` 封装为带默认 base URL、10 秒超时和 Bearer Authorization 的手写适配器。同步预留 `tongji_poby.ts` 与 `yourtj.ts` 的客户端适配边界，生成目录继续只承担协议代码。
- 工具对上游成绩响应实施 allowlist：只输出学分、绩点、课程与学期等批准字段，丢弃学号、姓名、内部 ID 和未知字段；同时声明 MCP `outputSchema`，让发现与消费端看到稳定契约。
- 更新 `registerTools`、README 和人工请求示例。README 现在说明 `tongji.student.score`、可选 `calendarId` 以及 Inspector 使用的 `X-Tongji-Access-Token` 请求头。
- 扩展离线测试：覆盖工具发现、token 注入、字段裁剪、空成绩、业务错误、401/403 与上游失败；新增 OpenAPI 适配器测试，校验地址、查询参数、认证头和超时。

### 关键链路解析（含上下游）

- 上游依赖：`src/transport/http.ts` 为每次 `/mcp` 请求构造 `ToolInvocationContext`；`registerTools` 接收该上下文。`TongjiStudentAgent` 仍是短期校园 token 的签发与注入方，CAM 生成的 `TongjiOpenapiService` 仍只负责生成请求路径和参数。
- 当前改动：`registerUndergraduateScoreTool` 从调用上下文获取 token，再通过 `getUndergraduateScores` 构造上游请求。响应先校验有效的 `data.term` 结构，再进入 `normalizeScoreData`；未通过结构校验的 200 响应不会再被误判为“空成绩”。
- 下游影响：MCP 客户端可发现并调用 `tongji.student.score`，仅获得声明的成绩字段与结构化状态。未来其他校园工具可以复用适配器边界和错误归一模式，但不能绕过调用上下文或直接返回 CAM 原始响应。

### 改动结果与业务影响

- 首个校园业务 Tool 已形成 `Agent -> MCP invocation -> 手写 adapter -> Tongji OpenAPI -> 字段白名单 Tool Result` 的闭环；工具参数不包含 token，也不允许调用方指定他人身份字段。
- 开发过程中发现“HTTP 200 但业务响应缺少成绩结构”会被旧的空值逻辑误报为空数据，因此新增显式结构校验并返回 `upstream_unavailable`。这避免 Agent 基于错误的“暂无成绩”继续推理。
- 已执行 `pnpm test`（19/19）、`pnpm test:typecheck`、`pnpm typecheck`、`pnpm build` 与 `git diff --check HEAD`，均通过；测试仅使用 Fake Axios adapter 和虚构 token，不访问真实校园平台。

### 风险与待办

- 当前适配器依赖同济开放平台的既有响应结构；真实联调仍需在受控环境确认字段类型、业务错误码和 token scope。若上游结构演进，应同步更新 allowlist、`outputSchema` 与 Fake 响应。
- `tongji_poby.ts`、`yourtj.ts` 目前只是适配边界，尚未被正式 Tool 消费；它们接入业务前仍需按相同规则补充请求构造、错误归一与脱敏测试。
- Inspector 的 token 传递仅适用于可信本地调试或受控部署。不得将有效 token 写入截图、日志、提交记录或 Tool 输入。

### 建议 Commit Message（git-cz）

- `feat(score): add undergraduate score MCP tool`


## CHANGELOG - 2026-07-26 15:55 - 建立 MCP Server 本地单测闭环并补齐骨架边界验证

### 撰写时间

- 2026-07-26 15:55

### Base Commit

- 54c878b366510d64da521bc995dd00a125179723

### Compare Scope

- working_tree_only

### 背景与改动目标

- 这个 MCP Server 已有 Streamable HTTP 骨架和 token 调用上下文，但此前没有 TypeScript 测试入口。配置解析、请求体上限和 header 处理一旦回归，只能依赖人工启动后再发现问题；提交前也缺少统一的本地验证闭环。
- 这次不引入 CI，也不提前实现校园业务 Tool。目标是先把当前手写骨架的可观察行为固定下来，并让后续接入领域服务、OpenAPI adapter 和隐私策略时有一套可复用的测试约束。

### 改动概览

- 在 `package.json` 增加 `pnpm test`、`pnpm test:watch`、`pnpm test:typecheck` 和 `pnpm check`。测试使用 Node 原生 `node:test`，通过 `node --import tsx --test` 加载 TypeScript，避免额外引入 Jest/Vitest 转译链路。
- 新增 `tsconfig.test.json` 与 `test/` 目录，覆盖 `loadServerConfig`、`readToolInvocationContext`、`createHttpServer` 和 `createMcpServer`。当前共 12 个离线用例，包含配置边界、重复/空白 token、HTTP 路由、非法 JSON、请求体上限，以及 MCP 服务身份和空 Tool 状态。
- 新增 `docs/UTSpec.md` 与 `.codex/rules/unit-testing.md`，明确测试目录、Fake 边界、脱敏数据要求和提交前命令；README 同步公开本地校验入口。
- 将 `.codex/skills/commit-quality-reviewer` 的测试步骤从 Go 模板改为本仓 TypeScript 流程，审查报告必须记录 `pnpm test`、测试类型检查、生产类型检查和构建结果。
- `loadServerConfig` 改用 `Number` 校验端口，`PORT=3000.5` 不再被 `parseInt` 截断为合法端口；HTTP 入口会依据 `Content-Length` 提前以 413 拒绝超大请求，并修复非法 JSON 路径的 Promise 未结算问题。

### 关键链路解析（含上下游）

- 上游依赖：`src/index.ts` 继续通过 `loadServerConfig` 读取 `HOST` 与 `PORT`；Agent 仍通过 `X-Tongji-Access-Token` 将短期凭据传给 `/mcp`。本次没有改变入口参数、token 传递方式或 CAM 生成客户端。
- 当前改动：`test/config/server.test.ts` 在每个场景后恢复 `process.env`；`test/transport/http.test.ts` 在 loopback 临时端口验证 HTTP 边界并在 `finally` 关闭 server；`test/server.test.ts` 通过 SDK 的 `InMemoryTransport` 验证 MCP 身份与当前不声明 `tools` capability 的骨架行为。
- 下游影响：后续 Tool、领域聚合和手写 OpenAPI adapter 只需遵循 `docs/UTSpec.md` 在 `test/` 增加对应场景。提交前可用 `pnpm check` 一次跑完单测、测试类型检查、生产类型检查和 CommonJS 构建；当前没有 CI 门禁。

### 改动结果与业务影响

- 当前骨架的关键安全与协议边界已经有可重复的离线回归保护，测试不使用真实 token、学生数据、校园平台或外网。
- 开发过程中先使用 `tsx --test`，但它在受限环境会创建额外 IPC 管道；最终固定为 Node 原生测试运行器加载 `tsx`，本地反馈链路更直接。测试 glob 同时覆盖 `test/*.test.ts` 与嵌套目录，避免遗漏根目录的 MCP Server 契约用例。
- 已执行 `pnpm check`：12/12 单测通过，`pnpm test:typecheck`、`pnpm typecheck` 和 `pnpm build` 均通过；`git diff --check` 通过。

### 风险与待办

- 当前仍没有领域 Tool、隐私策略或手写 OpenAPI adapter，因此不存在这些层的业务回归用例。首个 `campus.schedule.get_term` 落地时，应按 UTSpec 补 token 注入、空数据、超时、未授权、错误归一和字段白名单测试。
- 请求体上限已覆盖带 `Content-Length` 的 413 拒绝路径；后续若需要支持流式/分块上传，应补充无 `Content-Length` 的超限场景并统一错误状态码。
- HTTP 测试会监听 loopback 临时端口。普通本地开发可直接执行；受限沙箱需要允许本地端口绑定，不能把该环境限制误判为产品测试失败。

### 建议 Commit Message（git-cz）

- `test(mcp): establish local regression suite`


## CHANGELOG - 2026-07-26 12:55 - 将校园 access token 收敛为单次 MCP 工具调用上下文

### 撰写时间

- 2026-07-26 12:55

### Base Commit

- b21eff1f9caec84f30a8f8b0da1c74b7d22a1929

### Compare Scope

- working_tree_only

### 背景与改动目标

- MCP 服务即将开始调用同济 OpenAPI，但工具参数不能承担 access token：把凭据放进 Schema 会让 Agent、模型和 Tool Result 都有机会看到它，也会使每个工具重复处理同一份传递逻辑。
- 因此这次把 token 传递约束成主仓到 MCP 的部署内调用上下文。MCP 服务不保存 token、不把它映射为用户身份，也不单独做校园 token 鉴权；它只把主仓提供的短期 bearer token 交给当前请求创建的 Tool 实例使用。

### 改动概览

- 新增 `src/transport/invocation-context.ts`。`readToolInvocationContext` 读取单值 `X-Tongji-Access-Token`，会丢弃重复 header，并在空白值时返回空上下文。
- `createHttpServer` 在创建无状态 `StreamableHTTPServerTransport` 和 `McpServer` 前构造调用上下文，再通过 `ToolRegistrationContext` 传入 `registerTools`。每个 HTTP 请求独立创建上下文，不产生 MCP session ID 或跨请求 token 缓存。
- 删除尚未有 verifier 实现的 `auth.ts` 与 `MCP_AUTH_REQUIRED` 配置，HTTP 存活探针统一为 `GET /health`；README 说明请求头名称、用途以及 token 不得进入 Tool Schema、Tool Result 或日志的约束。
- 新增 CAM 生成目录的只读规则，禁止在生成客户端中注入 token、身份、脱敏或业务逻辑，要求后续适配器在生成层之外消费调用上下文。

### 关键链路解析（含上下游）

- 上游依赖：`TongjiStudentAgent` 在需要校园数据的 MCP 请求中注入 `X-Tongji-Access-Token`。该设计依赖主仓与 MCP 服务处于可信部署边界；token 的签发、用户绑定和有效期仍由主仓及同济开放平台负责。
- 当前改动：`src/transport/http.ts` 从 HTTP headers 创建 `ToolInvocationContext`，随后调用 `createMcpServer({ invocation })`；`src/tools/registry.ts` 将同一上下文交给后续注册的领域工具。生成的 OpenAPI 客户端不直接接触 HTTP headers。
- 下游影响：后续 OpenAPI adapter 可以从 Tool 调用上下文读取 token 并设置上游 Authorization header，而不需要扩大 Tool 输入协议。当前 Tool Catalog 仍为空，因此本次没有触发真实校园数据调用。

### 改动结果与业务影响

- 当前 token 的生命周期被限制在单个 MCP HTTP 请求及其创建的 Tool 实例内，避免了包级缓存、会话存储和模型可见参数。
- 删除未实现的认证开关后，运行配置只保留监听地址和端口；`/health` 与 `/mcp` 的路径在 README 和历史 changelog 中同步为实际行为。
- 已执行 `pnpm typecheck`、`pnpm build` 与 `git diff --check HEAD`。离线 header 解析验证确认单值会进入调用上下文，重复 header 会被忽略；当前仍没有 TypeScript 自动化测试基座。

### 风险与待办

- 主仓注入 bearer token 而 MCP 不独立验证的设计按 `WL-20260726-001` 临时豁免至 2026-08-26。该豁免仅适用于可信部署边界；若 MCP 改为可被非主仓直接访问，必须先引入受认证的服务间传输或签名短期凭据。
- 调用上下文的正常、缺失、空白和重复 header 分支尚未有自动化测试；旧的骨架测试缺口按 `WL-20260725-002` 继续豁免至 2026-08-25。首个正式校园工具接入时必须补齐 HTTP/MCP 契约测试。
- token 只解决上游调用凭据传递，不替代参数 ownership、scope 限制和响应脱敏。领域工具接入时仍需禁止用户通过工具参数指定他人学号、身份证号或其他身份字段。

### 建议 Commit Message（git-cz）

- `feat(transport): pass campus token through tool context`


## CHANGELOG - 2026-07-25 15:22 - 统一 CAM OpenAPI 客户端输出并收敛 YourTJ 契约

### 撰写时间

- 2026-07-25 15:22

### Base Commit

- 9ffa4c6aa629a87911651c67a869e76a31ec53d0

### Compare Scope

- working_tree_only

### 背景与改动目标

- 第一版骨架把 CAM 生成结果直接放在 `src/integration/` 下，`tongji_openapi`、`tongji_poby` 和 `yourtj` 与人工维护的适配层混在一起。生成器再次执行时，文件归属、删除范围和业务封装边界都不够清楚。
- 这次不增加 MCP 工具，而是先把生成层收敛到单独目录，并更新 YourTJ 的 OpenAPI 契约。这样后续实现校园工具时，才能在生成代码之外明确放置认证、请求校验、错误归一与脱敏逻辑。

### 改动概览

- `cam.config.json` 的 `outDir` 改为 `src/integration/openapi`，并将 `cam-fe-code-generator` 升级至 `1.9.0`；`package.json` 增加 `pnpm cam` 命令，README 说明使用 `pnpm cam update` 同步已配置服务。
- 删除旧的 `src/integration/{tongji_openapi,tongji_poby,yourtj}` 生成目录，以及会在模块加载时发起请求的旧 `request-demo.ts`。
- 在新目录重新生成 `tongji_openapi`、`tongji_poby` 与 `yourtj` 客户端。YourTJ 客户端使用新的课程、学期、年级与专业查询 Schema，返回值从无类型 `any` 收敛为 CAM 生成的响应类型。
- 新增 `src/integration/test.ts` 作为人工验证生成客户端的独立示例，README 同步说明 CAM 输出不可直接作为生产适配器。

### 关键链路解析（含上下游）

- 上游依赖：`cam.config.json` 中的服务标识仍由 CAM 管理；`pnpm cam update` 读取该配置并将生成产物写入新的 `openapi` 目录。升级后的生成器是这些客户端文件和 Schema 的唯一来源。
- 当前改动：业务代码后续应从 `src/integration/openapi/<service>/` 导入生成类型和请求方法，再在独立适配器层注入可信身份、base URL、超时、错误处理和字段白名单。生成代码继续保留 `DO NOT EDIT` 标记，避免手工修改在下一次同步时丢失。
- 下游影响：现有 MCP 入口和工具目录没有导入旧客户端，因此迁移不会改变当前空 Tool Catalog 的运行行为。后续 `TongjiStudentAgent` 连接 MCP 服务时，仍只会看到显式注册的领域工具，而不会直接暴露 OpenAPI 方法。

### 改动结果与业务影响

- 生成代码与手写 integration 代码现在有明确目录边界，重新生成时不会覆盖未来的生产适配器。
- README 提供了 CAM 同步入口，并说明 `src/integration/openapi/` 仅是上游协议客户端，不承担生产环境的认证、脱敏或业务聚合。
- 当前没有新增正式 MCP Tool，也没有让进程入口调用同济开放平台；变更主要影响后续开发时的客户端生成和导入路径。

### 风险与待办

- `src/integration/test.ts` 仍会在被直接执行时访问 YourTJ 并打印结果，只能作为受控人工验证示例，不能被服务入口、工具实现或自动化测试导入。正式适配器应使用 fake HTTP 契约测试，不读取或输出真实学生数据。
- CAM 生成结果仍包含宽泛的 `any`、上游参数和敏感字段定义；在接入任何 MCP Tool 前，必须在手写适配器中限制请求参数、检查可信身份和 scope，并对白名单字段做脱敏。
- 本次未执行真实 CAM 同步或上游 API 调用验证。提交前至少应执行 `pnpm typecheck` 和 `pnpm build`，并在受控环境确认 `pnpm cam update` 不会产生非预期的生成差异。

### 建议 Commit Message（git-cz）

- `chore(openapi): consolidate CAM generated clients`


## CHANGELOG - 2026-07-25 02:28 - 建立同济校园能力 MCP Streamable HTTP 骨架

### 撰写时间

- 2026-07-25 02:28

### Base Commit

- 36ba4c7cb571e411fdbbf03e5989c5d47f2dc45a

### Compare Scope

- working_tree_only

### 背景与改动目标

- 同济校园能力此前没有独立的 MCP 服务边界。若直接让 Agent 调用开放平台接口，身份、scope、输入 Schema、字段脱敏与审计会散落在编排层，后续很难保证学生数据只按最小权限暴露。
- 因此这次先落一个可以启动、但不预置业务工具的 TypeScript 骨架。目标不是抢先暴露校园接口，而是固定 `Agent -> MCP -> 上游平台` 的边界，为后续按领域接入工具保留认证、归一化和隐私处理位置。

### 改动概览

- 新增 Node.js 20+、TypeScript CommonJS 与 pnpm 工程配置，固定 `@modelcontextprotocol/sdk` 1.x，并提供 `typecheck`、`build`、`dev` 和 `start` 命令。
- 新增 `createHttpServer`、`createMcpServer` 与空的 `registerTools` 入口。HTTP 服务提供 `/health` 和无状态的 `/mcp` Streamable HTTP 端点；每个请求创建独立 transport 和 MCP server，不保存业务会话。
- 新增 `ServerConfig` 与 `MCP_AUTH_REQUIRED` 边界。当前认证打开但未配置 verifier 时会拒绝 MCP 请求，避免把“尚未验证的调用方”误当成可信身份。
- 使用 CAM 生成 `tongji_openapi`、`tongji_poby`、`yourtj` 的类型客户端，作为后续 integration adapter 的输入；README 同步为真实的进程环境变量、端点与无状态边界说明。

### 关键链路解析（含上下游）

- 上游依赖：`src/index.ts` 读取 `HOST`、`PORT` 和 `MCP_AUTH_REQUIRED` 后创建 Node HTTP server；`StreamableHTTPServerTransport` 负责 MCP 协议解析，`McpServer` 负责承载注册后的工具目录。
- 当前改动：请求先经过 `authenticateCaller` 的可信调用方边界，再读取受 1 MiB 限制的 JSON body，随后连接无 session ID 的 transport。`registerTools` 目前为空，因此服务没有访问同济开放平台或返回个人数据的路径。
- 下游影响：`TongjiStudentAgent` 后续可通过 `/mcp` 连接并按 MCP 协议发现工具。真实校园数据能力应在 `tools` 中定义输入输出 Schema，在 `domain` 聚合业务，在 `integration` 调用上游，并在 `privacy` 与 `observability` 层完成脱敏和元数据观测。

### 改动结果与业务影响

- 当前骨架能完成 TypeScript 类型检查和 CommonJS 构建；SDK 的 `streamableHttp.js` 子路径已显式使用 `.js` 后缀，避免 CommonJS 运行时的 package exports 解析失败。
- README 不再要求复制不存在且不会被读取的 `.env.example`，改为列出实际由进程读取的环境变量和认证开关的当前行为。
- 已执行 `pnpm typecheck`、`pnpm build` 和 `git diff --check HEAD`。沙箱内监听 `127.0.0.1:3000` 被权限策略拒绝；在获批环境中启动命令不再出现 SDK 子路径加载错误，但仍需要在真实本地或部署环境完成 `/health` 与 MCP initialize 冒烟验证。

### 风险与待办

- `src/integration/request-demo.ts` 在被导入时仍会执行真实请求并输出响应。该项按 `WL-20260725-001` 临时豁免至 2026-08-25；首个正式工具接入前应移除顶层执行，改为 fake HTTP 契约测试。
- 当前没有 TypeScript 测试基座，也未覆盖健康检查、MCP 初始化、认证拒绝、非法 JSON 或请求体上限。该项按 `WL-20260725-002` 临时豁免至 2026-08-25；过期前必须补齐最小 HTTP/MCP 回归测试。
- 当前没有凭证 verifier、业务工具或个人数据脱敏实现。`MCP_AUTH_REQUIRED=true` 只能作为拒绝保护，不能代替正式认证；在接入任何校园数据之前必须完成身份、scope 和脱敏链路。

### 建议 Commit Message（git-cz）

- `feat(mcp): scaffold stateless campus MCP server`

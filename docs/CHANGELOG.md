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

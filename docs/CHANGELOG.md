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

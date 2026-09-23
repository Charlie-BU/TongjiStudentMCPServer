# YourTJ 课程接口迁移

课程工具通过手写适配器调用 CAM 生成客户端。课程接口使用 `https://f.yourtj.de`；学期、年级和专业接口仍使用 `https://jcourse.yourtj.de`。这些公开请求不携带同济 access token。

## 当前课程工具

| Tool | 上游 CAM 方法 | 输入重点 |
| --- | --- | --- |
| `tongji.course.search` | `CourseSearchGET` | `keyword`、`instructor[]`、`department[]`、`term[]`、`campus[]`、`onlyWithReviews=1`、`sortBy=rating`、`page=1`、`size=20` |
| `tongji.course.course-detail` | `CourseDetailGetGET` | `courseId` |
| `tongji.course.course-related` | `CourseRelatedListGET` | `courseId` |
| `tongji.course.reviews` | `CourseReviewListGET` | `courseId`、可选 `offeringId`、`cursor`、`pageSize=20` |
| `tongji.course.summary` | `CourseSummaryGetGET` | `courseId`、固定 `check=true` |

现有三个课程工具保留名称，输入和输出已整体切换到新契约，不保留旧参数别名。

## 客户端迁移

- 搜索输入从 `q/limit` 改为 `keyword/size`；`includeTotal` 不再使用。`data` 包含 `list/page/size/total/hasNext`，翻页保持筛选条件不变并增加 `page`。
- 详情、关联输入从 `id` 改为 `courseId`。详情包含开课记录 `offerings`，不再内嵌评价；评价正文使用 `tongji.course.reviews`。
- 输出使用新字段名，如 `primaryCode`、`teacherName`、`ratingAvg`、`reviewCount`、`recentTerms`；`creditX10` 除以 10 才是学分，不再输出旧的 `credit`。
- 评价使用不透明 `nextCursor` 分页；末页省略或返回空游标。不要使用 `page` 查询评价，也不要解析游标。`offeringId` 来自详情 `offerings[].id`。
- 成功结果继续使用 `{status, data, source:"YourTJ"}`，JSON 文本与 `structuredContent` 一致。上游 `code/result/messageCode` 在适配器内校验并转换，不直接透传。
- HTTP 200 下非零 `code` 仍为工具错误。`code=0` 但 `result=null` 或必填字段不合约时视为异常，不伪装成空结果。
- 空搜索或评价列表保留分页字段；空关联分组保留对象；AI 总结缺失时保留 `data.status`，外层为 `empty`。
- 可选字段缺失时保持缺失；已知对象采用字段白名单，未知字段被裁剪。CAM 声明为 `any[]` 的关联数组及总结代表性评价数组保留开放结构，未猜测其子字段。
- 输入严格校验，旧 `q/limit/id`、非正整数标识、非数组筛选、`check=false`、`refresh` 均拒绝。数组筛选通过重复键编码，不使用 `instructor[]` 形式。

## CAM 总结定义待补全

当前生成的 `CourseSummaryGetGET` 请求和响应仍为 `any`，没有替换 `{courseId}`，也没有传递 `check`。生成目录保持只读，`getCourseSummary` 暂通过该方法的请求 options 补齐实际 URL 与 `check=true`，并使用手写 Zod 契约验证响应。

后续应在 CAM 中补齐总结 Path、Query 和响应定义，再生成客户端；届时可移除这处 options 补齐代码，保留对应回归测试。总结 Tool 只读取已有结果，不开放可能触发生成的刷新操作。

## 验证边界

离线测试覆盖 MCP 注册和 Schema、成功与空结果、默认值、两种分页、数组编码、HTTP 200 业务错误、异常响应、HTTP 400/403/404/429/500、参数拒绝和已知对象字段裁剪。测试使用虚构数据和 Axios Fake，不访问真实站点。

执行 `pnpm check` 运行全部单测、测试类型检查、生产类型检查和构建。完整客户端可见 Schema 见 [Tool 目录](TOOLS.md)。

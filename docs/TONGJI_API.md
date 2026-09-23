# 同济 API

## 身份协议

Agent 每轮使用浏览器的原用户 token 查询 basic-info，成功取得 userId 后，向 MCP 同时发送：

```text
X-Tongji-Access-Token: <client_credentials service token>
X-Tongji-User-Id: <本轮 basic-info 返回的单个 userId>
```

MCP 不接收模型生成的身份或凭据，不从服务 token 的主体推断用户。重复头、批量身份、空值或只有一项均按匿名处理。HTTP 入口用服务 token 查询固定服务账号 00001，核对姓名李建中和用户类型教职工；失败返回 HTTP 401，不执行工具。此检查不替换用户上下文，也不在 MCP 中申请或刷新 token；刷新由 Agent 负责。

工具仅使用本请求上下文。适配器先展开业务参数，再覆盖 Authorization/userId；CAM 只将接口实际定义的参数发给上游。无 userId 参数的公共目录查询不额外添加该参数，但同济 API 仍要求完整的登录上下文。公开 YourTJ/本地评价工具保持匿名可用。

## 已有工具兼容变化

- 17 个既有同济工具名称保持不变。个人查询固定本轮 userId，学生详情和瑞幸工具不再用服务 token 反查用户身份。
- 本科成绩、学生课表接受数字或数字字符串学期编号，发送给 CAM 时转为数字；成绩的 -1 表示全部学期。其他非数字字符串被拒绝。
- 校门通行使用 `/v1/rt/door/campus_access_control`，端口使用 1/2；旧“入门/出门”映射到 1/2。响应 recordTime 映射到既有 dataTime 字段。
- 图书馆通行使用 `/v1/rt/lib/lib_access`，优先使用 dataStartTime/dataEndTime；旧 visitStartTime/visitEndTime 仍兼容并映射到新参数，新旧参数同时传入且冲突则拒绝。
- 两类门禁工具分别接收/返回 sinceCardRecordID、sinceVisitNo。上游未提供单独游标时，返回最后一条记录的 ID 供下一页使用；它不保证后面仍有数据，空页结束翻页。
- 住宿、竞赛、荣誉、奖学金和助学金接收 CAM 定义的游标/更新时间，响应通过 pagination 保留下一页元数据。翻页始终固定本轮 userId，不能用游标扩大到其他用户。
- 既有工具输入改为严格对象，未知字段（包括 userId/accessToken/Authorization）会被拒绝。

## 新增 26 个工具

新增能力包括研究生成绩/学分/培养计划、考试安排、本科绩点汇总、一卡通余额/消费汇总、科研项目/著作/专利、困难补助/贷款/勤工助学、教职工课表/岗位、联系方式/邮箱及辅导员。详见下方映射和 [实际 MCP Schema](TOOLS.md)。

`tongji.user.update_contact_info` 是写操作，readOnlyHint=false、idempotentHint=false；须有用户明确操作意图，至少提供手机号或邮箱，超时或异常不自动重试。仅在内层 `data.code=A00000` 且 `effectRows` 为正安全整数时报告成功；内层失败、零更新、空值或字段缺失均返回“结果尚未确认，请先核实，不要自动重试”。其他新增工具只读。

消费汇总 cycle=week/month 时 n 必填且为正整数；date 模式沿用上游时间范围默认规则。期末考试和重缓考必须提供学期编号。

新增工具使用显式响应字段白名单，未知字段和敏感凭据被裁剪。

## 工具裁剪

已移除 9 个工具，当前 MCP 和 Agent allowlist 均为 60 个工具。腾讯会议课表、云会议创建、课程学期列表、当日实时流水、逐日校历、高等讲堂完成情况的手写调用链已删除，保留 CAM 自动生成代码。本人学籍基础信息、本人基本档案、人员基础信息仅删除工具层；底层接口保留，人员基础信息仍供服务凭据校验使用。学生学期日历编号查询保留。

## CAM 覆盖矩阵

56 个 CAM 接口均已核对：43 个独立能力注册工具，5 个 v1 重复查询沿用对应 v2 工具，其余 8 个不暴露工具。以下路径和方法取自用户更新的 CAM 文件；没有修改生成代码。

| CAM 方法 | 路径 | MCP 工具 | 说明 |
| --- | --- | --- | --- |
| `Get_card_spending_flowGET` | `/v1/dc/card/card_history_flow` | `tongji.student.card_spending_flow` | 已有工具 |
| `Get_postgraduate_gpa_and_msGET` | `/v2/rt/teaching_info/postgraduate_gpa_and_ms` | `tongji.postgraduate.gpa` | 新增 |
| `Get_postgraduate_required_creditGET` | `/v2/rt/teaching_info/postgraduate_required_credit` | `tongji.postgraduate.required_credit` | 新增 |
| `Get_card_spending_summaryGET` | `/v1/dc/card/week_or_month_sum` | `tongji.card.spending_summary` | 新增 |
| `Get_book_lend_info_v1GET` | `/v1/dc/lib/lend_info_all` | `tongji.student.book-lend-info` | v1 重复，工具使用 v2 |
| `Get_research_projectsGET` | `/v1/dc/research/longitudinal_project_for_PD` | `tongji.research.projects` | 新增 |
| `Get_research_worksGET` | `/v1/dc/research/work` | `tongji.research.works` | 新增 |
| `Get_user_contact_infoGET` | `/v1/dc/sep_auth/all_contact_info` | `tongji.user.contact_info` | 新增 |
| `Update_user_contact_infoPOST` | `/v1/dc/sep_auth/update_contact_info` | `tongji.user.update_contact_info` | 新增 |
| `Get_competition_prizes_v1GET` | `/v1/dc/student_work_info/competition_winners` | `tongji.student.competition_prize` | v1 重复，工具使用 v2 |
| `Get_hardship_allowanceGET` | `/v1/dc/student_work_info/hardship_allowance` | `tongji.student.hardship_allowance` | 新增 |
| `Student_honorary_title_v1GET` | `/v1/dc/student_work_info/honorary_title` | `tongji.student.honorary_title` | v1 重复，工具使用 v2 |
| `Get_scholarship_info_v1GET` | `/v1/dc/student_work_info/scholarship` | `tongji.student.scholarship_info` | v1 重复，工具使用 v2 |
| `Get_stipend_v1GET` | `/v1/dc/student_work_info/stipend` | `tongji.student.stipend-info` | v1 重复，工具使用 v2 |
| `Get_student_loanGET` | `/v1/dc/student_work_info/student_loan` | `tongji.student.loan` | 新增 |
| `Get_work_studyGET` | `/v1/dc/student_work_info/work_study` | `tongji.student.work_study` | 新增 |
| `Get_teacher_current_term_timetableGET` | `/v1/dc/teaching_info/teacher_timetable` | `tongji.teacher.timetable` | 新增 |
| `Create_cloud_meetingPOST` | `/v1/infra/cloud_meeting/create` | — | 不暴露工具，仅保留 CAM／内部接口 |
| `Get_card_balanceGET` | `/v1/rt/card/card_balance` | `tongji.card.balance` | 新增 |
| `Get_card_current_actual_flowGET` | `/v1/rt/card/card_current_actual_flow` | — | 不暴露工具，仅保留 CAM／内部接口 |
| `Get_school_accessGET` | `/v1/rt/door/campus_access_control` | `tongji.student.school_access` | 已有工具 |
| `Get_library_accessGET` | `/v1/rt/lib/lib_access` | `tongji.student.library_access` | 已有工具 |
| `Get_school_calendarGET` | `/v1/rt/onetongji/calendar` | — | 不暴露工具，仅保留 CAM／内部接口 |
| `Cet_scoreGET` | `/v1/rt/onetongji/cet_score` | `tongji.student.cet-score` | 已有工具 |
| `Get_postgraduate_culture_plan_countGET` | `/v1/rt/onetongji/culture_plan/count` | `tongji.postgraduate.plan_progress` | 新增 |
| `Get_postgraduate_culture_planGET` | `/v1/rt/onetongji/culture_plan/get` | `tongji.postgraduate.plan` | 新增 |
| `Get_postgraduate_major_infoGET` | `/v1/rt/onetongji/grad_major` | `tongji.postgraduate.majors` | 新增 |
| `Get_advanced_lecture_countGET` | `/v1/rt/onetongji/lecture/count_advanced_lecture` | — | 不暴露工具，仅保留 CAM／内部接口 |
| `Postgraduate_scoreGET` | `/v1/rt/onetongji/postgraduate_score` | `tongji.postgraduate.score` | 新增 |
| `Get_all_term_calendarGET` | `/v1/rt/onetongji/school_calendar_all_term_calendar` | `tongji.student.term-calendar` | 已有工具 |
| `Get_current_term_calendarGET` | `/v1/rt/onetongji/school_calendar_current_term_calendar` | `tongji.student.current-term-calendar` | 已有工具 |
| `Student_timetableGET` | `/v1/rt/onetongji/student_timetable` | `tongji.student.timetable` | 已有工具 |
| `Undergraduate_scoreGET` | `/v1/rt/onetongji/undergraduate_score` | `tongji.student.score` | 已有工具 |
| `Get_research_patentGET` | `/v1/rt/research/patent` | `tongji.research.patents` | 新增 |
| `Get_final_exam_infoGET` | `/v1/rt/teaching_info/absent_examinfo` | `tongji.student.final_exams` | 新增 |
| `Get_deferred_exam_infoGET` | `/v1/rt/teaching_info/deferred_examinfo` | `tongji.student.deferred_exams` | 新增 |
| `Get_undergraduate_summarized_gradesGET` | `/v1/rt/teaching_info/undergraduate_summarized_grades` | `tongji.student.grade_summary` | 新增 |
| `Get_student_detailed_infoPOST` | `/v1/rt/user/all_student` | `tongji.student.detailed_info` | 已有工具 |
| `Get_tongji_email_infoGET` | `/v1/rt/user/coremail_info` | `tongji.user.email` | 新增 |
| `Get_user_single_infoGET` | `/v1/rt/user/single_info` | — | 不暴露工具，仅保留 CAM／内部接口 |
| `Get_book_lend_infoGET` | `/v2/dc/lib/lend_info_all` | `tongji.student.book-lend-info` | 已有工具 |
| `Student_accommodation_infoGET` | `/v2/dc/sep_auth/student_accommodation_info` | `tongji.student.accommodation-info` | 已有工具 |
| `Get_teacher_title_infoGET` | `/v2/dc/sep_auth/teacher_title_info` | `tongji.teacher.title` | 新增 |
| `Get_competition_prizesGET` | `/v2/dc/student_work_info/competition_winners` | `tongji.student.competition_prize` | 已有工具 |
| `Student_honorary_titleGET` | `/v2/dc/student_work_info/honorary_title` | `tongji.student.honorary_title` | 已有工具 |
| `Get_scholarship_infoGET` | `/v2/dc/student_work_info/scholarship` | `tongji.student.scholarship_info` | 已有工具 |
| `Get_stipendGET` | `/v2/dc/student_work_info/stipend` | `tongji.student.stipend-info` | 已有工具 |
| `Get_student_counselor_infoGET` | `/v2/dc/student_work_info/student_headteacher_counselor_info` | `tongji.student.counselor` | 新增 |
| `Get_student_tencent_meeting_courseGET` | `/v2/dc/teaching_info/stu_tencent_meeting_course` | — | 不暴露工具，仅保留 CAM／内部接口 |
| `Get_student_basic_infoGET` | `/v2/dc/user/student_infos` | — | 不暴露工具，仅保留 CAM／内部接口 |
| `Get_statistics_info_by_yearGET` | `/v2/dc/user/user_annual_bill` | `tongji.student.annual_bill` | 已有工具 |
| `Get_statistics_infoGET` | `/v2/dc/user/user_data_statistics` | `tongji.student.statistics-info` | 已有工具 |
| `Get_postgraduate_completed_creditGET` | `/v2/rt/teaching_info/postgraduate_completed_credit` | `tongji.postgraduate.completed_credit` | 新增 |
| `Get_postgraduate_degree_course_creditGET` | `/v2/rt/teaching_info/postgraduate_degree_course_credit` | `tongji.postgraduate.degree_credit` | 新增 |
| `Get_postgraduate_degree_course_msGET` | `/v2/rt/teaching_info/postgraduate_degree_course_ms` | `tongji.postgraduate.degree_average` | 新增 |
| `Get_user_basic_infoGET` | `/v2/rt/user/all_info` | — | 不暴露工具，仅保留 CAM／内部接口 |

## 部署与验证

Agent 与 MCP 需配套部署。Agent 的服务 token 通过 TONGJI_MCP_CLIENT_ID / TONGJI_MCP_CLIENT_SECRET 申请，MCP 不保存这些客户端密钥。Agent 静态 allowlist 已同步为当前 60 个工具。

本地测试覆盖新工具逐项 CAM 请求契约、完整凭据/匿名/批量身份拒绝、模型身份注入拒绝、并发用户隔离、写操作参数与不重试、分页和响应裁剪。运行 pnpm test、pnpm test:typecheck、pnpm typecheck、pnpm build。pnpm docs:tools 从无凭据内存实例导出目录，不执行任何上游请求。

未用真实校园账号进行联调；单元测试不访问生产 API，也不会修改联系方式。

## 代码组织

所有手写同济上游方法统一放在 `src/integration/tongji_openapi/methods.ts`；`adapter.ts` 负责认证参数注入、HTTP 配置和上游业务错误处理，`index.ts` 统一导出。工具层通过这些方法调用上游，不直接依赖 CAM 客户端。

工具按 `a.b.c` 对应 `src/tools/a/b/c/` 组织。例如 `tongji.postgraduate.gpa` 位于 `src/tools/tongji/postgraduate/gpa/`，`index.ts` 定义工具，`schemas.ts` 保存响应白名单。公共执行逻辑放在 `src/tools/tongji/campus-tool.ts`，所有工具由 `src/tools/registry.ts` 显式注册。

### 校园工具公共执行层

全部 43 个同济校园工具使用 `campusTool(...).register`，包括原有 17 个和新增 26 个。6 个 YourTJ／历史评价工具使用独立的数据源契约，不接入此执行层。

`campus-tool.ts` 统一处理严格输入 Schema、Agent 身份上下文检查、只读／写操作标记、业务参数验证、上游错误、响应 Schema 校验和 MCP 结果封装。工具自身只声明业务查询和数据转换，不读取请求头或接收模型生成的凭据。

工具目录的 `schemas.ts` 保存响应 Schema。直接返回上游业务字段的工具声明 `data`；需要字段映射的工具声明 `output` 和 `mapResponse`，保留原有空结果、分页游标、参数回显和已脱敏展示字段。公共层校验转换结果并清除数据中的服务 token；转换失败返回工具错误。旧接口允许不含 code 的数据封装，明确的业务失败仍由适配器拒绝。

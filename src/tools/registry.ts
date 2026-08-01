import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolInvocationContext } from "../transport/invocation-context";
import { registerAnnualBillTool } from "./annual-bill";
import { registerCardSpendingFlowTool } from "./card-spending-flow";
import { registerCompetitionPrizeTool } from "./competition-prize";
import { registerCourseCatalogTool } from "./course-catalog";
import { registerHonoraryTitleTool } from "./honorary-title";
import { registerLibraryAccessTool } from "./library-access";
import { registerSchoolAccessTool } from "./school-access";
import { registerStudentDetailedInfoTool } from "./student-detailed-info";
import { registerScholarshipInfoTool } from "./scholarship-info";
import { registerStudentTimetableTool } from "./student-timetable";
import { registerUndergraduateScoreTool } from "./undergraduate-score";
import { registerUserBasicInfoTool } from "./user-basic-info";

// ToolRegistrationContext 表示注册工具所需的可信调用方上下文。
export interface ToolRegistrationContext {
    invocation: ToolInvocationContext;
}

// registerTools 注册校园领域工具目录。
export const registerTools = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    // 注册学生年度统计账单查询工具。
    registerAnnualBillTool(server, context);
    // 注册一卡通消费流水查询工具。
    registerCardSpendingFlowTool(server, context);
    // 注册课程目录查询工具。
    registerCourseCatalogTool(server, context);
    // 注册学生课表查询工具。
    registerStudentTimetableTool(server, context);
    // 注册学生详细学籍信息查询工具。
    registerStudentDetailedInfoTool(server, context);
    // 注册本科生成绩查询工具。
    registerUndergraduateScoreTool(server, context);
    // 注册本科生竞赛奖励查询工具。
    registerCompetitionPrizeTool(server, context);
    // 注册学生荣誉称号查询工具。
    registerHonoraryTitleTool(server, context);
    // 注册学生奖学金查询工具。
    registerScholarshipInfoTool(server, context);
    // 注册校门通行记录查询工具。
    registerSchoolAccessTool(server, context);
    // 注册图书馆通行记录查询工具。
    registerLibraryAccessTool(server, context);
    // 注册人员基础信息查询工具。
    registerUserBasicInfoTool(server, context);
};

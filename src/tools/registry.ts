import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolInvocationContext } from "../transport/invocation-context";

import { registerLegacyTeacherReviewsTool } from "./tongji/course/legacy-teacher-reviews";
import { registerAnnualBillTool } from "./tongji/student/annual_bill";
import { registerCardSpendingFlowTool } from "./tongji/student/card_spending_flow";
import { registerCompetitionPrizeTool } from "./tongji/student/competition_prize";
import { registerHonoraryTitleTool } from "./tongji/student/honorary_title";
import { registerLibraryAccessTool } from "./tongji/student/library_access";
import { registerSchoolAccessTool } from "./tongji/student/school_access";
import { registerStudentDetailedInfoTool } from "./tongji/student/detailed_info";
import { registerScholarshipInfoTool } from "./tongji/student/scholarship_info";
import { registerStudentTimetableTool } from "./tongji/student/timetable";
import { registerUndergraduateScoreTool } from "./tongji/student/score";
import { registerAllTermCalendarTool } from "./tongji/student/term-calendar";
import { registerCurrentTermCalendarTool } from "./tongji/student/current-term-calendar";
import { registerCetScoreTool } from "./tongji/student/cet-score";
import { registerBookLendInfoTool } from "./tongji/student/book-lend-info";
import { registerStatisticsInfoTool } from "./tongji/student/statistics-info";
import { registerStipendInfoTool } from "./tongji/student/stipend-info";
import { registerAccommodationInfoTool } from "./tongji/student/accommodation-info";
import { registerUserBasicInfoTool } from "./tongji/user/basic_info";
import { registerCalendarListTool } from "./tongji/course/calendar_list";
import { registerCourseCatalogTool } from "./tongji/course/search";
import { registerCourseDetailTool } from "./tongji/course/course-detail";
import { registerCourseRelatedTool } from "./tongji/course/course-related";
import { registerCourseReviewsTool } from "./tongji/course/reviews";
import { registerCourseSummaryTool } from "./tongji/course/summary";
import { registerLuckinSendSMSCodeTool } from "./luckin/auth/send_sms_code";
import { registerLuckinLoginTool } from "./luckin/auth/login";
import { registerLuckinCheckTool } from "./luckin/auth/check";
import { registerLuckinShopSearchTool } from "./luckin/shop/search";
import { registerLuckinProductSearchTool } from "./luckin/product/search";
import { registerLuckinProductDetailTool } from "./luckin/product/detail";
import { registerLuckinProductSwitchTool } from "./luckin/product/switch";
import { registerLuckinOrderPreviewTool } from "./luckin/order/preview";
import { registerLuckinOrderCreateTool } from "./luckin/order/create";
import { registerLuckinOrderGetTool } from "./luckin/order/get";
import { registerLuckinOrderCancelTool } from "./luckin/order/cancel";

export interface ToolRegistrationContext {
    invocation: ToolInvocationContext;
}

export const registerTools = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
    registerLegacyTeacherReviewsTool(server);
    // TongjiOpenAPI
    registerAnnualBillTool(server, context);
    registerCardSpendingFlowTool(server, context);
    registerStudentTimetableTool(server, context);
    registerStudentDetailedInfoTool(server, context);
    registerUndergraduateScoreTool(server, context);
    registerAllTermCalendarTool(server, context);
    registerCurrentTermCalendarTool(server, context);
    registerCetScoreTool(server, context);
    registerBookLendInfoTool(server, context);
    registerStatisticsInfoTool(server, context);
    registerStipendInfoTool(server, context);
    registerAccommodationInfoTool(server, context);
    registerCompetitionPrizeTool(server, context);
    registerHonoraryTitleTool(server, context);
    registerScholarshipInfoTool(server, context);
    registerSchoolAccessTool(server, context);
    registerLibraryAccessTool(server, context);
    registerUserBasicInfoTool(server, context);
    // YourTJ
    registerCourseDetailTool(server, context);
    registerCourseRelatedTool(server, context);
    registerCourseReviewsTool(server, context);
    registerCourseSummaryTool(server, context);
    registerCourseCatalogTool(server, context);
    registerCalendarListTool(server, context);
    // Luckin Coffee
    registerLuckinSendSMSCodeTool(server);
    registerLuckinLoginTool(server, context);
    registerLuckinCheckTool(server, context);
    registerLuckinShopSearchTool(server, context);
    registerLuckinProductSearchTool(server, context);
    registerLuckinProductDetailTool(server, context);
    registerLuckinProductSwitchTool(server, context);
    registerLuckinOrderPreviewTool(server, context);
    registerLuckinOrderCreateTool(server, context);
    registerLuckinOrderGetTool(server, context);
    registerLuckinOrderCancelTool(server, context);
};

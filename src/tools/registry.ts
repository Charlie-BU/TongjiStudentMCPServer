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
import { registerPostgraduateGpaTool } from "./tongji/postgraduate/gpa";
import { registerPostgraduateRequiredCreditTool } from "./tongji/postgraduate/required_credit";
import { registerCardSpendingSummaryTool } from "./tongji/card/spending_summary";
import { registerResearchProjectsTool } from "./tongji/research/projects";
import { registerResearchWorksTool } from "./tongji/research/works";
import { registerUserContactInfoTool } from "./tongji/user/contact_info";
import { registerUserUpdateContactInfoTool } from "./tongji/user/update_contact_info";
import { registerStudentHardshipAllowanceTool } from "./tongji/student/hardship_allowance";
import { registerStudentLoanTool } from "./tongji/student/loan";
import { registerStudentWorkStudyTool } from "./tongji/student/work_study";
import { registerTeacherTimetableTool } from "./tongji/teacher/timetable";
import { registerCardBalanceTool } from "./tongji/card/balance";
import { registerPostgraduatePlanProgressTool } from "./tongji/postgraduate/plan_progress";
import { registerPostgraduatePlanTool } from "./tongji/postgraduate/plan";
import { registerPostgraduateMajorsTool } from "./tongji/postgraduate/majors";
import { registerPostgraduateScoreTool } from "./tongji/postgraduate/score";
import { registerResearchPatentsTool } from "./tongji/research/patents";
import { registerStudentFinalExamsTool } from "./tongji/student/final_exams";
import { registerStudentDeferredExamsTool } from "./tongji/student/deferred_exams";
import { registerStudentGradeSummaryTool } from "./tongji/student/grade_summary";
import { registerUserEmailTool } from "./tongji/user/email";
import { registerTeacherTitleTool } from "./tongji/teacher/title";
import { registerStudentCounselorTool } from "./tongji/student/counselor";
import { registerPostgraduateCompletedCreditTool } from "./tongji/postgraduate/completed_credit";
import { registerPostgraduateDegreeCreditTool } from "./tongji/postgraduate/degree_credit";
import { registerPostgraduateDegreeAverageTool } from "./tongji/postgraduate/degree_average";

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
    registerPostgraduateGpaTool(server, context);
    registerPostgraduateRequiredCreditTool(server, context);
    registerCardSpendingSummaryTool(server, context);
    registerResearchProjectsTool(server, context);
    registerResearchWorksTool(server, context);
    registerUserContactInfoTool(server, context);
    registerUserUpdateContactInfoTool(server, context);
    registerStudentHardshipAllowanceTool(server, context);
    registerStudentLoanTool(server, context);
    registerStudentWorkStudyTool(server, context);
    registerTeacherTimetableTool(server, context);
    registerCardBalanceTool(server, context);
    registerPostgraduatePlanProgressTool(server, context);
    registerPostgraduatePlanTool(server, context);
    registerPostgraduateMajorsTool(server, context);
    registerPostgraduateScoreTool(server, context);
    registerResearchPatentsTool(server, context);
    registerStudentFinalExamsTool(server, context);
    registerStudentDeferredExamsTool(server, context);
    registerStudentGradeSummaryTool(server, context);
    registerUserEmailTool(server, context);
    registerTeacherTitleTool(server, context);
    registerStudentCounselorTool(server, context);
    registerPostgraduateCompletedCreditTool(server, context);
    registerPostgraduateDegreeCreditTool(server, context);
    registerPostgraduateDegreeAverageTool(server, context);
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
    // YourTJ
    registerCourseDetailTool(server, context);
    registerCourseRelatedTool(server, context);
    registerCourseReviewsTool(server, context);
    registerCourseSummaryTool(server, context);
    registerCourseCatalogTool(server, context);
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

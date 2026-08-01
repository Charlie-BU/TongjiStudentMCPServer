import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolInvocationContext } from "../transport/invocation-context";
import { registerAnnualBillTool } from "./annual-bill";
import { registerCardSpendingFlowTool } from "./card-spending-flow";
import { registerCompetitionPrizeTool } from "./competition-prize";
import { registerHonoraryTitleTool } from "./honorary-title";
import { registerLibraryAccessTool } from "./library-access";
import { registerSchoolAccessTool } from "./school-access";
import { registerStudentDetailedInfoTool } from "./student-detailed-info";
import { registerScholarshipInfoTool } from "./scholarship-info";
import { registerStudentTimetableTool } from "./student-timetable";
import { registerUndergraduateScoreTool } from "./undergraduate-score";
import { registerAllTermCalendarTool } from "./term-calendar";
import { registerCurrentTermCalendarTool } from "./current-term-calendar";
import { registerCetScoreTool } from "./cet-score";
import { registerBookLendInfoTool } from "./book-lend-info";
import { registerStatisticsInfoTool } from "./statistics-info";
import { registerStipendInfoTool } from "./stipend-info";
import { registerAccommodationInfoTool } from "./accommodation-info";
import { registerUserBasicInfoTool } from "./user-basic-info";
import { registerCalendarListTool } from "./calendar-list";
import { registerCourseCatalogTool } from "./course-catalog";
import { registerGradeListTool } from "./grade-list";
import { registerCourseDetailTool } from "./course-detail";
import { registerCourseRelatedTool } from "./course-related";
import { registerFindMajorByGradeTool } from "./find-major-by-grade";

export interface ToolRegistrationContext {
    invocation: ToolInvocationContext;
}

export const registerTools = (
    server: McpServer,
    context: ToolRegistrationContext,
): void => {
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
    registerFindMajorByGradeTool(server, context);
    registerCourseCatalogTool(server, context);
    registerCalendarListTool(server, context);
    registerGradeListTool(server, context);
};

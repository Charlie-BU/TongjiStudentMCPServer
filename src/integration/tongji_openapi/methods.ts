import { createTongjiOpenapiAdapter, type TongjiOpenapiAdapter, type TongjiOpenapiAdapterConfig } from "./adapter";

// getUndergraduateScores 查询本科生学期成绩。
export const getUndergraduateScores = async (
    config: TongjiOpenapiAdapterConfig,
    calendarId?: string,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Undergraduate_scoreGET(
        adapter.withAuthorization({ calendarId: calendarId === undefined ? undefined : Number(calendarId) }),
    );
};

// getAllTermCalendars 查询所有学期日历。
export const getAllTermCalendars = async (
    config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_all_term_calendarGET(
        adapter.withAuthorization({}),
    );
};

// getCurrentTermCalendar 查询当前学期日历。
export const getCurrentTermCalendar = async (
    config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_current_term_calendarGET(
        adapter.withAuthorization({}),
    );
};

// getCetScores 查询四六级成绩。
export const getCetScores = async (
    config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Cet_scoreGET(adapter.withAuthorization({}));
};

// getBookLendInfo 查询图书借阅信息。
export const getBookLendInfo = async (
    config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_book_lend_infoGET(adapter.withAuthorization({}));
};

// getStipendInfo 查询助学金信息。
export const getStipendInfo = async (
    config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_stipendGET(adapter.withAuthorization({}));
};

// getAccommodationInfo 查询住宿信息。
export const getAccommodationInfo = async (
    config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Student_accommodation_infoGET(
        adapter.withAuthorization({}),
    );
};

// getStatisticsInfo 查询个人统计数据。
export const getStatisticsInfo = async (
    config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_statistics_infoGET(
        adapter.withAuthorization({}),
    );
};

// getCompetitionPrizes 查询本科生竞赛奖励记录。
export const getCompetitionPrizes = async (
    config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_competition_prizesGET(
        adapter.withAuthorization({}),
    );
};

// getStudentHonoraryTitles 查询学生获得荣誉称号情况信息。
export const getStudentHonoraryTitles = async (
    config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Student_honorary_titleGET(
        adapter.withAuthorization({}),
    );
};

// getStudentScholarshipInfo 查询学生获得奖学金情况信息。
export const getStudentScholarshipInfo = async (
    config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_scholarship_infoGET(
        adapter.withAuthorization({}),
    );
};

// getAllStudentDetailedInfo 获取教务系统所有的学生详细信息。
export const getAllStudentDetailedInfo = async (
    config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_student_detailed_infoPOST(
        adapter.withAuthorization({}),
    );
};

// getUserBasicInfo 获取人员基础信息。
export const getUserBasicInfo = async (
    config: TongjiOpenapiAdapterConfig,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_user_basic_infoGET(
        adapter.withAuthorization({}),
    );
};

// getStatisticsInfoByYear 根据年份查询当前授权人员的全校师生统计数据。
export const getStatisticsInfoByYear = async (
    config: TongjiOpenapiAdapterConfig,
    year: string,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_statistics_info_by_yearGET(
        adapter.withAuthorization({ year }),
    );
};

// getCardSpendingFlow 根据数据时间查询人员一卡通历史流水信息。
export const getCardSpendingFlow = async (
    config: TongjiOpenapiAdapterConfig,
    tradeStartTime?: string,
    tradeEndTime?: string,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_card_spending_flowGET(
        adapter.withAuthorization({ tradeStartTime, tradeEndTime }),
    );
};

// getStudentTimetable 获取1tongji系统上学生课表信息，支持当前学期和历史学期实时查询。
export const getStudentTimetable = async (
    config: TongjiOpenapiAdapterConfig,
    calendarId?: string,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Student_timetableGET(
        adapter.withAuthorization({ calendarId: calendarId === undefined ? undefined : Number(calendarId) }),
    );
};

// getSchoolAccess 查询在某一段时间内进出校门门禁的信息。
export const getSchoolAccess = async (
    config: TongjiOpenapiAdapterConfig,
    portNum?: string,
    dataStartTime?: string,
    dataEndTime?: string,
    sinceCardRecordID?: string,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_school_accessGET(
        adapter.withAuthorization({ portNum: portNum === "入门" ? "1" : portNum === "出门" ? "2" : portNum, dataStartTime, dataEndTime, sinceCardRecordID }),
    );
};

// getLibraryAccess 根据学工号查询在某一段时间内进出图书馆闸机门禁信息。
export const getLibraryAccess = async (
    config: TongjiOpenapiAdapterConfig,
    direction?: string,
    visitStartTime?: string,
    visitEndTime?: string,
    sinceVisitNo?: string,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_library_accessGET(
        adapter.withAuthorization({ direction, dataStartTime: visitStartTime, dataEndTime: visitEndTime, sinceVisitNo }),
    );
};

// getPostgraduateGpa 研究生平均成绩与绩点。
export const getPostgraduateGpa = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_postgraduate_gpa_and_msGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_postgraduate_gpa_and_msGET(adapter.withAuthorization(input));
};

// getPostgraduateRequiredCredit 研究生应修学分。
export const getPostgraduateRequiredCredit = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_postgraduate_required_creditGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_postgraduate_required_creditGET(adapter.withAuthorization(input));
};

// getCardSpendingSummary 一卡通消费汇总。
export const getCardSpendingSummary = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_card_spending_summaryGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_card_spending_summaryGET(adapter.withAuthorization(input));
};

// getResearchProjects 本人科研项目。
export const getResearchProjects = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_research_projectsGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_research_projectsGET(adapter.withAuthorization(input));
};

// getResearchWorks 本人科研著作。
export const getResearchWorks = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_research_worksGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_research_worksGET(adapter.withAuthorization(input));
};

// getUserContactInfo 本人联系方式。
export const getUserContactInfo = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_user_contact_infoGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_user_contact_infoGET(adapter.withAuthorization(input));
};

// updateUserContactInfo 修改本人联系方式。
export const updateUserContactInfo = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Update_user_contact_infoPOST"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Update_user_contact_infoPOST(adapter.withAuthorization(input));
};

// getStudentHardshipAllowance 困难补助。
export const getStudentHardshipAllowance = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_hardship_allowanceGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_hardship_allowanceGET(adapter.withAuthorization(input));
};

// getStudentLoan 助学贷款。
export const getStudentLoan = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_student_loanGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_student_loanGET(adapter.withAuthorization(input));
};

// getStudentWorkStudy 勤工助学。
export const getStudentWorkStudy = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_work_studyGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_work_studyGET(adapter.withAuthorization(input));
};

// getTeacherTimetable 教职工本学期课表。
export const getTeacherTimetable = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_teacher_current_term_timetableGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_teacher_current_term_timetableGET(adapter.withAuthorization(input));
};

// getCardBalance 一卡通实时余额。
export const getCardBalance = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_card_balanceGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_card_balanceGET(adapter.withAuthorization(input));
};

// getPostgraduatePlanProgress 研究生培养计划完成统计。
export const getPostgraduatePlanProgress = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_postgraduate_culture_plan_countGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_postgraduate_culture_plan_countGET(adapter.withAuthorization(input));
};

// getPostgraduatePlan 研究生培养计划。
export const getPostgraduatePlan = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_postgraduate_culture_planGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_postgraduate_culture_planGET(adapter.withAuthorization(input));
};

// getPostgraduateMajors 研究生学位专业目录。
export const getPostgraduateMajors = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_postgraduate_major_infoGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_postgraduate_major_infoGET(adapter.withAuthorization(input));
};

// getPostgraduateScore 研究生成绩。
export const getPostgraduateScore = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Postgraduate_scoreGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Postgraduate_scoreGET(adapter.withAuthorization(input));
};

// getResearchPatents 本人科研专利。
export const getResearchPatents = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_research_patentGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_research_patentGET(adapter.withAuthorization(input));
};

// getStudentFinalExams 期末考试安排与缺考情况。
export const getStudentFinalExams = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_final_exam_infoGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_final_exam_infoGET(adapter.withAuthorization(input));
};

// getStudentDeferredExams 重缓考安排与状态。
export const getStudentDeferredExams = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_deferred_exam_infoGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_deferred_exam_infoGET(adapter.withAuthorization(input));
};

// getStudentGradeSummary 本科生绩点与学分汇总。
export const getStudentGradeSummary = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_undergraduate_summarized_gradesGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_undergraduate_summarized_gradesGET(adapter.withAuthorization(input));
};

// getUserEmail 本人同济邮箱与别名。
export const getUserEmail = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_tongji_email_infoGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_tongji_email_infoGET(adapter.withAuthorization(input));
};

// getTeacherTitle 教职工职称与岗位。
export const getTeacherTitle = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_teacher_title_infoGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_teacher_title_infoGET(adapter.withAuthorization(input));
};

// getStudentCounselor 本人班主任与辅导员。
export const getStudentCounselor = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_student_counselor_infoGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_student_counselor_infoGET(adapter.withAuthorization(input));
};

// getPostgraduateCompletedCredit 研究生已修学分。
export const getPostgraduateCompletedCredit = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_postgraduate_completed_creditGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_postgraduate_completed_creditGET(adapter.withAuthorization(input));
};

// getPostgraduateDegreeCredit 研究生学位课总学分。
export const getPostgraduateDegreeCredit = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_postgraduate_degree_course_creditGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_postgraduate_degree_course_creditGET(adapter.withAuthorization(input));
};

// getPostgraduateDegreeAverage 研究生学位课平均分。
export const getPostgraduateDegreeAverage = async (
    config: TongjiOpenapiAdapterConfig,
    input: Omit<Parameters<TongjiOpenapiAdapter["service"]["Get_postgraduate_degree_course_msGET"]>[0], "Authorization" | "userId">,
): Promise<unknown> => {
    const adapter = createTongjiOpenapiAdapter(config);
    return adapter.service.Get_postgraduate_degree_course_msGET(adapter.withAuthorization(input));
};

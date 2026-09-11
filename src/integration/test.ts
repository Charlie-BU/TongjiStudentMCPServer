// 包含有权限的 API demo
import axios, { type AxiosRequestConfig } from "axios";
import TongjiService from "./openapi/tongji_openapi";
import { searchCourses, getCourseDetail, getCourseRelated, getCourseReviews, getCourseSummary } from "./yourtj";

// YourtjServiceDemo 演示公开课程搜索及详情查询。
const YourtjServiceDemo = async (): Promise<void> => {
    const courses = await searchCourses({ keyword: "高等数学", page: 1, size: 20 });
    const courseId = courses.list[0]?.id;
    if (!courseId) return;
    console.log(await getCourseDetail(courseId));
    console.log(await getCourseRelated(courseId));
    console.log(await getCourseReviews({ courseId, pageSize: 20 }));
    console.log(await getCourseSummary({ courseId, check: true }));
};

const TongjiServiceDemo = async (token: string): Promise<void> => {
    const BASE_URL = "https://api.tongji.edu.cn";
    const authorization = `Bearer ${token}`;

    const demoServiceForAxios = new TongjiService<AxiosRequestConfig>({
        baseURL: BASE_URL,
        request: (config, _options) =>
            axios.request({ ...config }).then((res) => res.data),
    });

    const runTest = async (
        name: string,
        request: () => Promise<unknown>,
    ): Promise<unknown> => {
        try {
            const result = await request();
            console.log(`[${name}] success`, result);
            return result;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(
                    `[${name}] failed`,
                    error.response?.data ?? error.message,
                );
            } else {
                console.error(`[${name}] failed`, error);
            }
            return undefined;
        }
    };

    const testUndergraduateScore = async (
        calendarId?: string,
    ): Promise<unknown> => {
        const request = {
            Authorization: authorization,
            calendarId: calendarId ?? "118",
        };
        return runTest("rt_onetongji_undergraduate_score", () =>
            demoServiceForAxios.Undergraduate_scoreGET(request),
        );
    };

    const testCetScore = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
        };
        return runTest("rt_onetongji_cet_score", () =>
            demoServiceForAxios.Cet_scoreGET(request),
        );
    };

    const testLendInfoAll = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
        };
        return runTest("dc_lib_lend_info_all", () =>
            demoServiceForAxios.Get_book_lend_infoGET(request),
        );
    };

    const testUserDataStatistics = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
        };
        return runTest("dc_user_user_data_statistics", () =>
            demoServiceForAxios.Get_statistics_infoGET(request),
        );
    };

    const testAllTermCalendar = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
        };
        return runTest("rt_onetongji_school_calendar_all_term_calendar", () =>
            demoServiceForAxios.Get_all_term_calendarGET(request),
        );
    };

    const testCurrentTermCalendar = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
        };
        return runTest(
            "rt_onetongji_school_calendar_current_term_calendar",
            () => demoServiceForAxios.Get_current_term_calendarGET(request),
        );
    };

    const testStipend = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
        };
        return runTest("dc_student_work_info_stipend", () =>
            demoServiceForAxios.Get_stipendGET(request),
        );
    };

    const testStudentAccommodationInfo = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
        };
        return runTest("dc_sep_auth_student_accommodation_info", () =>
            demoServiceForAxios.Student_accommodation_infoGET(request),
        );
    };

    const testHonoraryTitle = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
        };
        return runTest("dc_student_work_info_honorary_title", () =>
            demoServiceForAxios.Student_honorary_titleGET(request),
        );
    };

    const testCompetitionWinners = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
        };
        return runTest("dc_student_work_info_competition_winners", () =>
            demoServiceForAxios.Get_competition_prizesGET(request),
        );
    };

    const testLibraryAccessControl = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
            direction: "",
            visitStartTime: "2024-01-01 00:00:00",
            visitEndTime: "2024-12-31 23:59:59",
        };
        return runTest("dc_lib_lib_access_control", () =>
            demoServiceForAxios.Get_library_accessGET(request),
        );
    };

    const testScholarship = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
        };
        return runTest("dc_student_work_info_scholarship", () =>
            demoServiceForAxios.Get_scholarship_infoGET(request),
        );
    };

    const testAllStudent = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
            userId: "2350939",
        };
        return runTest("rt_user_all_student", () =>
            demoServiceForAxios.Get_student_detailed_infoPOST(request),
        );
    };

    const testSchoolAccessControl = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
            portNum: "",
            dataStartTime: "2024-01-01 00:00:00",
            dataEndTime: "2024-12-31 23:59:59",
        };
        return runTest("dc_door_school_access_control", () =>
            demoServiceForAxios.Get_school_accessGET(request),
        );
    };

    const testStudentTimetable = async (
        calendarId?: string,
    ): Promise<unknown> => {
        const request = {
            Authorization: authorization,
            calendarId: calendarId ?? "118",
        };
        return runTest("rt_onetongji_student_timetable", () =>
            demoServiceForAxios.Student_timetableGET(request),
        );
    };

    const testUserAnnualBill = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
            year: "2024",
        };
        return runTest("dc_user_user_annual_bill", () =>
            demoServiceForAxios.Get_statistics_info_by_yearGET(request),
        );
    };

    const testAllInfo = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
        };
        return runTest("rt_user_all_info", () =>
            demoServiceForAxios.Get_user_basic_infoGET(request),
        );
    };

    const testCardHistoryFlow = async (): Promise<unknown> => {
        const request = {
            Authorization: authorization,
            tradeStartTime: "2024-01-01 00:00:00",
            tradeEndTime: "2024-12-31 23:59:59",
        };
        return runTest("dc_card_card_history_flow", () =>
            demoServiceForAxios.Get_card_spending_flowGET(request),
        );
    };

    const allTermCalendarRes = await testAllTermCalendar();
    const currentTermCalendarRes = await testCurrentTermCalendar();
    const currentCalendarId =
        (currentTermCalendarRes as { calendarId?: string } | undefined)
            ?.calendarId ?? "118";

    await testCetScore();
    await testLendInfoAll();
    await testUserDataStatistics();
    await testUndergraduateScore(currentCalendarId);
    await testStipend();
    await testStudentAccommodationInfo();
    await testHonoraryTitle();
    await testCompetitionWinners();
    await testLibraryAccessControl();
    await testScholarship();
    await testAllStudent();
    await testSchoolAccessControl();
    await testStudentTimetable(currentCalendarId);
    await testUserAnnualBill();
    await testAllInfo();
    await testCardHistoryFlow();
};

// YourtjServiceDemo();
TongjiServiceDemo("test_token");

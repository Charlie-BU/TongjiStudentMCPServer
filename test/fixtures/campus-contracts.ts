// Wire contracts; no production endpoints are contacted.
export const campusContracts = [
    {
        "name": "tongji.postgraduate.gpa",
        "path": "/v2/rt/teaching_info/postgraduate_gpa_and_ms",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": []
    },
    {
        "name": "tongji.postgraduate.required_credit",
        "path": "/v2/rt/teaching_info/postgraduate_required_credit",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": []
    },
    {
        "name": "tongji.card.spending_summary",
        "path": "/v1/dc/card/week_or_month_sum",
        "method": "get",
        "args": {
            "cycle": "week",
            "tradeStartTime": "value",
            "tradeEndTime": "value",
            "n": 2
        },
        "scoped": true,
        "data": []
    },
    {
        "name": "tongji.research.projects",
        "path": "/v1/dc/research/longitudinal_project_for_PD",
        "method": "get",
        "args": {
            "projClassifyCode": "1,3"
        },
        "scoped": true,
        "data": {}
    },
    {
        "name": "tongji.research.works",
        "path": "/v1/dc/research/work",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": {}
    },
    {
        "name": "tongji.user.contact_info",
        "path": "/v1/dc/sep_auth/all_contact_info",
        "method": "get",
        "args": {
            "systemCode": "value"
        },
        "scoped": true,
        "data": []
    },
    {
        "name": "tongji.user.update_contact_info",
        "path": "/v1/dc/sep_auth/update_contact_info",
        "method": "post",
        "args": {
            "email": "student@example.test",
            "phone": "13800000000"
        },
        "scoped": true,
        "data": { "code": "A00000", "effectRows": 1 }
    },
    {
        "name": "tongji.student.hardship_allowance",
        "path": "/v1/dc/student_work_info/hardship_allowance",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": {}
    },
    {
        "name": "tongji.student.loan",
        "path": "/v1/dc/student_work_info/student_loan",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": {}
    },
    {
        "name": "tongji.student.work_study",
        "path": "/v1/dc/student_work_info/work_study",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": {}
    },
    {
        "name": "tongji.teacher.timetable",
        "path": "/v1/dc/teaching_info/teacher_timetable",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": {}
    },
    {
        "name": "tongji.card.balance",
        "path": "/v1/rt/card/card_balance",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": []
    },
    {
        "name": "tongji.postgraduate.plan_progress",
        "path": "/v1/rt/onetongji/culture_plan/count",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": []
    },
    {
        "name": "tongji.postgraduate.plan",
        "path": "/v1/rt/onetongji/culture_plan/get",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": {}
    },
    {
        "name": "tongji.postgraduate.majors",
        "path": "/v1/rt/onetongji/grad_major",
        "method": "get",
        "args": {},
        "scoped": false,
        "data": []
    },
    {
        "name": "tongji.postgraduate.score",
        "path": "/v1/rt/onetongji/postgraduate_score",
        "method": "get",
        "args": {
            "calendarId": 120
        },
        "scoped": true,
        "data": {}
    },
    {
        "name": "tongji.research.patents",
        "path": "/v1/rt/research/patent",
        "method": "get",
        "args": {
            "appNo": "value"
        },
        "scoped": true,
        "data": {}
    },
    {
        "name": "tongji.student.final_exams",
        "path": "/v1/rt/teaching_info/absent_examinfo",
        "method": "get",
        "args": {
            "calendarId": "120",
            "defeat": "1"
        },
        "scoped": true,
        "data": []
    },
    {
        "name": "tongji.student.deferred_exams",
        "path": "/v1/rt/teaching_info/deferred_examinfo",
        "method": "get",
        "args": {
            "calendarId": "120",
            "defeat": "1"
        },
        "scoped": true,
        "data": []
    },
    {
        "name": "tongji.student.grade_summary",
        "path": "/v1/rt/teaching_info/undergraduate_summarized_grades",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": []
    },
    {
        "name": "tongji.user.email",
        "path": "/v1/rt/user/coremail_info",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": []
    },
    {
        "name": "tongji.teacher.title",
        "path": "/v2/dc/sep_auth/teacher_title_info",
        "method": "get",
        "args": {
            "sinceUserId": "value",
            "sinceUpdateTime": "value"
        },
        "scoped": true,
        "data": {}
    },
    {
        "name": "tongji.student.counselor",
        "path": "/v2/dc/student_work_info/student_headteacher_counselor_info",
        "method": "get",
        "args": {
            "sinceUserId": "value"
        },
        "scoped": true,
        "data": {}
    },
    {
        "name": "tongji.postgraduate.completed_credit",
        "path": "/v2/rt/teaching_info/postgraduate_completed_credit",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": []
    },
    {
        "name": "tongji.postgraduate.degree_credit",
        "path": "/v2/rt/teaching_info/postgraduate_degree_course_credit",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": []
    },
    {
        "name": "tongji.postgraduate.degree_average",
        "path": "/v2/rt/teaching_info/postgraduate_degree_course_ms",
        "method": "get",
        "args": {},
        "scoped": true,
        "data": []
    }
];

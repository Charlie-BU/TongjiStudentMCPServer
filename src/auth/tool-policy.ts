// 每个工具必须且只能归属一个权限组，不按名称前缀隐式放行。
export type ToolPolicy = "tongji" | "authenticated";
export const TOOL_POLICIES: Readonly<Record<ToolPolicy, readonly string[]>> = Object.freeze({
    "tongji": Object.freeze([
        "tongji.bachelor.competition_prize",
        "tongji.bachelor.grade_summary",
        "tongji.bachelor.score",
        "tongji.postgraduate.completed_credit",
        "tongji.postgraduate.degree_average",
        "tongji.postgraduate.degree_credit",
        "tongji.postgraduate.gpa",
        "tongji.postgraduate.majors",
        "tongji.postgraduate.plan",
        "tongji.postgraduate.plan_progress",
        "tongji.postgraduate.required_credit",
        "tongji.postgraduate.score",
        "tongji.student.accommodation-info",
        "tongji.student.cet-score",
        "tongji.student.counselor",
        "tongji.student.deferred_exams",
        "tongji.student.detailed_info",
        "tongji.student.final_exams",
        "tongji.student.hardship_allowance",
        "tongji.student.honorary_title",
        "tongji.student.loan",
        "tongji.student.scholarship_info",
        "tongji.student.stipend-info",
        "tongji.student.timetable",
        "tongji.student.work_study",
        "tongji.teacher.timetable",
        "tongji.teacher.title",
        "tongji.user.annual_bill",
        "tongji.user.book-lend-info",
        "tongji.user.card_balance",
        "tongji.user.card_spending_flow",
        "tongji.user.contact_info",
        "tongji.user.current-term-calendar",
        "tongji.user.email",
        "tongji.user.library_access",
        "tongji.user.research_patents",
        "tongji.user.research_projects",
        "tongji.user.research_works",
        "tongji.user.school_access",
        "tongji.user.statistics-info",
        "tongji.user.term-calendar",
        "tongji.user.update_contact_info",
    ]),
    "authenticated": Object.freeze([
        "tongji.course.search",
        "tongji.course.course-detail",
        "tongji.course.course-related",
        "tongji.course.reviews",
        "tongji.course.summary",
        "tongji.course.legacy-teacher-reviews",
        "luckin.auth.send_sms_code",
        "luckin.auth.login",
        "luckin.auth.check",
        "luckin.shop.search",
        "luckin.product.search",
        "luckin.product.detail",
        "luckin.product.switch",
        "luckin.order.preview",
        "luckin.order.create",
        "luckin.order.get",
        "luckin.order.cancel",
    ]),
});

// 从分组配置生成内部索引，并在加载时拒绝组内或跨组重复声明。
const policiesByTool = new Map<string, ToolPolicy>();
for (const policy of Object.keys(TOOL_POLICIES) as ToolPolicy[]) {
    for (const name of TOOL_POLICIES[policy]) {
        if (policiesByTool.has(name)) throw new Error(`Duplicate tool authentication policy: ${name}`);
        policiesByTool.set(name, policy);
    }
}

export const TOOL_NAMES: readonly string[] = Object.freeze([...policiesByTool.keys()]);
export const hasToolPolicy = (name: string): boolean => policiesByTool.has(name);
export const toolPolicy = (name: string): ToolPolicy => {
    const policy = policiesByTool.get(name);
    if (!policy) throw new Error(`Tool has no authentication policy: ${name}`);
    return policy;
};

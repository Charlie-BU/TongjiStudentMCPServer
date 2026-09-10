// courseFixture 创建虚构课程详情数据。
export const courseFixture = () => ({
    id: 101, primaryCode: "00101", name: "测试课程", department: "测试学院",
    creditX10: 25, teacherId: 201, teacherName: "测试教师",
    ratingAvg: 4.5, reviewCount: 2, ratingDistribution: [0, 0, 0, 1, 1], reviewScope: "teacher",
    offerings: [{ id: 301, termCode: "2026-2027-1", termName: "测试学期", campus: "测试校区",
        faculty: "测试学院", classCode: "00101-A", className: "测试班", instructors: ["测试教师"],
        ratingAvg: 4.5, reviewCount: 2 }],
});

// searchFixture 创建虚构课程搜索结果。
export const searchFixture = () => ({
    list: [{ id: 101, primaryCode: "00101", name: "测试课程", creditX10: 25,
        teacherId: 201, teacherName: "测试教师", department: "测试学院", aliases: ["alias-101"],
        instructors: ["测试教师"], recentTerms: ["2026-2027-1"], ratingAvg: 4.5, reviewCount: 2 }],
    page: 1, size: 20, total: 21, hasNext: true,
});

// reviewsFixture 创建虚构评价分页结果。
export const reviewsFixture = () => ({
    list: [{ id: 401, offeringId: 301, rating: 5, content: "测试评价\n第二段", contentHtml: "<p>测试评价</p>",
        author: { kind: "legacy", label: "测试匿名评价" },
        viewer: { canEdit: false, canDelete: false, isHelpful: false, isDisliked: false },
        helpfulCount: 1, dislikeCount: 0, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-02T00:00:00Z" }],
    total: 2, nextCursor: "301:401+/=",
});

// summaryFixture 创建虚构 AI 总结数据。
export const summaryFixture = () => ({
    status: "cached", summary: { consensus: "recommend", keywords: ["测试关键词"],
        pros: ["测试优点"], cons: ["测试缺点"], representativeReviews: [] },
    generatedAt: "2026-01-02T00:00:00Z", model: "test-model",
});

// relatedFixture 创建虚构关联课程结果。
export const relatedFixture = () => ({
    teacherOtherCourses: [{ id: 102, primaryCode: "00102", name: "测试关联课程", department: "测试学院",
        teacherName: "测试教师", instructors: ["测试教师"], ratingAvg: 4, ratingCount: 3, reviewCount: 2 }],
    sameCourseOtherTeachers: [], lineage: [],
});

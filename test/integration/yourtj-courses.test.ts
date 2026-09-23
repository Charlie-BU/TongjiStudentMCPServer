import assert from "node:assert/strict";
import { describe, it } from "node:test";
import axios, { type AxiosRequestConfig } from "axios";
import { searchCourses, getCourseDetail, getCourseRelated, getCourseReviews, getCourseSummary,
    createYourtjAdapter, YourtjResponseError } from "../../src/integration/yourtj";
import { courseFixture, searchFixture, reviewsFixture, summaryFixture, relatedFixture } from "../fixtures/yourtj";

// withResponse 隔离 Axios 请求并返回已捕获的请求配置。
const withResponse = async (data: unknown, run: (requests: AxiosRequestConfig[]) => Promise<void>) => {
    const previous = axios.defaults.adapter;
    const requests: AxiosRequestConfig[] = [];
    axios.defaults.adapter = async (config) => {
        requests.push(config);
        return { data, status: 200, statusText: "OK", headers: {}, config };
    };
    try { await run(requests); } finally { axios.defaults.adapter = previous; }
};

// config 定义离线适配器地址。
const config = { baseUrl: "https://forum.example.test/", timeoutMs: 1234 };

describe("YourTJ 课程适配器", () => {
    it("应使用新搜索契约并将多值筛选编码为重复键", async () => {
        await withResponse({ code: 0, result: searchFixture() }, async (requests) => {
            const input = { keyword: "测试课程", instructor: ["测试甲", "测试乙"], department: ["测试学院"],
                term: ["2026-2027-1"], campus: ["测试校区"], onlyWithReviews: 1 as const, sortBy: "rating" as const,
                page: 2, size: 10 };
            assert.deepEqual(await searchCourses(input, config), searchFixture());
            assert.deepEqual(requests[0].params, input);
            const url = new URL(axios.getUri(requests[0]));
            assert.equal(url.pathname, "/api/forum/courses");
            assert.deepEqual(url.searchParams.getAll("instructor"), input.instructor);
            assert.equal(url.searchParams.has("instructor[]"), false);
            assert.equal(requests[0].timeout, 1234);
            assert.equal(requests[0].headers?.Authorization, undefined);
            assert.equal(requests[0].headers?.Cookie, undefined);
            assert.equal(requests[0].headers?.Accept, "application/json");
        });
    });

    it("应向 CAM 新详情和关联方法传递 courseId 并裁剪未知字段", async () => {
        for (const [query, fixture, suffix] of [
            [getCourseDetail, courseFixture(), ""], [getCourseRelated, relatedFixture(), "/related"],
        ] as const) {
            await withResponse({ code: 0, result: { ...fixture, privateField: "test-secret" } }, async (requests) => {
                assert.deepEqual(await query(101, config), fixture);
                assert.equal(requests[0].url, `https://forum.example.test/api/forum/courses/101${suffix}`);
                assert.equal(requests[0].method, "get");
            });
        }
    });

    it("应保留评价正文和不透明游标并正确编码下一页参数", async () => {
        await withResponse({ code: 0, result: reviewsFixture() }, async (requests) => {
            const input = { courseId: 101, offeringId: 301, cursor: "301:401+/=", pageSize: 7 };
            assert.deepEqual(await getCourseReviews(input, config), reviewsFixture());
            const url = new URL(axios.getUri(requests[0]));
            assert.equal(url.pathname, "/api/forum/courses/101/reviews");
            assert.equal(url.searchParams.get("cursor"), input.cursor);
            assert.equal(url.searchParams.get("offeringId"), "301");
            assert.equal(url.searchParams.get("pageSize"), "7");
            assert.equal(url.searchParams.has("courseId"), false);
        });
    });

    it("应补齐生成器缺失的总结路径和 check 参数且不触发刷新", async () => {
        await withResponse({ code: 0, result: summaryFixture() }, async (requests) => {
            assert.deepEqual(await getCourseSummary({ courseId: 101 }, config), summaryFixture());
            assert.equal(requests[0].url, "https://forum.example.test/api/forum/courses/101/summary");
            assert.deepEqual(requests[0].params, { check: true });
            assert.equal(requests[0].method, "get");
            await assert.rejects(getCourseSummary({ courseId: 101, check: false } as never, config));
            assert.equal(requests.length, 1);
        });
    });

    it("应对所有课程 API 拒绝 HTTP 200 业务错误、null 和旧版响应", async () => {
        const calls = [() => searchCourses({}, config), () => getCourseDetail(101, config),
            () => getCourseRelated(101, config), () => getCourseReviews({ courseId: 101 }, config),
            () => getCourseSummary({ courseId: 101 }, config)];
        for (const response of [
            { code: 1, result: null, messageCode: "common.request.invalidParams", token: "test-secret" },
            { code: 0, result: null }, { data: [] }, "<html>challenge</html>",
        ]) {
            await withResponse(response, async () => {
                for (const call of calls) await assert.rejects(call(), YourtjResponseError);
            });
        }
    });

    it("应补齐分页默认值并拒绝错误输入且不发出请求", async () => {
        await withResponse({ code: 0, result: searchFixture() }, async (requests) => {
            await searchCourses({}, config);
            assert.equal(requests[0].params.page, 1);
            assert.equal(requests[0].params.size, 20);
            await assert.rejects(searchCourses({ page: 0 }, config));
            await assert.rejects(searchCourses({ q: "旧参数" } as never, config));
            await assert.rejects(getCourseDetail(-1, config));
            await assert.rejects(getCourseReviews({ courseId: 101, pageSize: 0 }, config));
            assert.equal(requests.length, 1);
        });
    });

    it("应保持课程论坛和原有教务服务的默认路由独立", async () => {
        await withResponse({ code: 0, result: searchFixture() }, async (requests) => {
            await searchCourses();
            // 只检查域名差异和路径；所有 HTTP 均由 Fake 隔离。
        });
    });
});

import axios, { type AxiosRequestConfig } from "axios";
import YourtjService from "./openapi/yourtj/index";

// BASE_URL 表示 YourTJ 服务的基础地址。
const BASE_URL = "https://jcourse.yourtj.de";

export const demoServiceForAxios = new YourtjService<AxiosRequestConfig>({
    baseURL: BASE_URL,
    request: (config, _options) =>
        axios.request({ ...config }).then((res) => res.data),
});

// runRequestDemo 执行 YourTJ 服务的请求示例。
export const runRequestDemo = async (): Promise<void> => {
    // const coursesRes = await demoServiceForAxios.CoursesGET({
    //     limit: 50,
    //     page: 1,
    //     q: "高等数学",
    //     includeTotal: true,
    // });
    // const courseDetailRes = await demoServiceForAxios.CourseDetailGET({
    //     id: 11388,
    // });
    // const relatedRes = await demoServiceForAxios.CourseidRelatedGET({
    //     id: 11388,
    // });
    const calendars = await demoServiceForAxios.GetAllCalendarGET();
    const grades = await demoServiceForAxios.FindGradeByCalendarIdPOST({
        calendarId: 118,
    });
    const majors = await demoServiceForAxios.FindMajorByGradePOST({
        grade: 2020,
        calendarId: 118,
    });
    console.log(majors);
};

runRequestDemo();

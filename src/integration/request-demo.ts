import axios, { type AxiosRequestConfig } from 'axios';
import YourtjService from './yourtj/index';

// BASE_URL 表示 YourTJ 服务的基础地址。
const BASE_URL = 'https://jcourse.yourtj.de';

// demoServiceForAxios 表示使用 Axios 的 YourTJ 服务示例。
export const demoServiceForAxios =
  new YourtjService<AxiosRequestConfig>({
    baseURL: BASE_URL,
    request: (config, _options) => axios.request({ ...config }),
  });

// demoServiceForFetch 表示使用 Fetch 的 YourTJ 服务示例。
export const demoServiceForFetch = new YourtjService<RequestInit>({
  baseURL: BASE_URL,
  request: (config, _options) =>
    fetch(config.url, { ...config }).then((res) => res.json()),
  });

// runRequestDemo 执行 YourTJ 服务的请求示例。
export const runRequestDemo = async (): Promise<void> => {
  const courses = await demoServiceForAxios.CoursesGET({ 
    clientId: "123",
   });
  console.log(courses.data);
};

runRequestDemo();
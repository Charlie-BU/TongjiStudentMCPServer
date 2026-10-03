import "./server"; // 先加载项目 .env，进程环境变量仍优先。
import { isAbsolute, relative, resolve } from "node:path";

// 两个运行数据库共用目录；种子库仍随代码发布，不放入持久卷。
export const loadDataDirectory = (environment: NodeJS.ProcessEnv = process.env): string => {
    const volume = environment.RAILWAY_VOLUME_MOUNT_PATH;
    const directory = resolve(environment.MCP_DATA_DIR || volume || resolve(__dirname, "../../data"));
    if (environment.RAILWAY_ENVIRONMENT_ID) {
        if (!volume) throw new Error("Railway requires a persistent volume for MCP and OAuth state");
        const child = relative(resolve(volume), directory);
        if (child === ".." || child.startsWith("../") || child.startsWith("..\\") || isAbsolute(child)) {
            throw new Error("MCP_DATA_DIR must be inside the Railway persistent volume");
        }
    }
    return directory;
};

export const DATA_DIRECTORY = loadDataDirectory();

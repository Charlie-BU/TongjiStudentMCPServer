# 历史教师评价

两份原文 `raw/必修.md`、`raw/选修.md` 整理为本地 SQLite 快照。历史数据使用以下业务表；瑞幸凭据已独立存储于 PostgreSQL：

```sql
CREATE TABLE teacher_reviews (
  id INTEGER PRIMARY KEY,
  teacher TEXT NOT NULL,
  content TEXT NOT NULL
);
CREATE INDEX teacher_reviews_teacher ON teacher_reviews(teacher);
```

## 检索

`GET /legacy/teacher-reviews?teacher=陈滨` 按姓名片段连续子串匹配（去除首尾空白后至少两个字符，单字返回参数错误），返回所有匹配老师的全部 `content` 数组，按主键排列，不分页、不截断。空结果为 `[]`。参数化 SQL 不解释输入中的通配符；同名老师无法从原始资料进一步区分，结果保留课程名称供判断。

MCP tool `tongji.course.legacy-teacher-reviews` 接受 `{ "teacher": "陈滨" }`，返回 `{ "content": ["..."] }`。路由与 tool 共用本地查询函数，不发起回环 HTTP 请求，无需凭据。数据库错误在路由返回 503，在 MCP 返回 `isError: true`。

Node.js 要求 22.13+，使用 `node:sqlite`；开发与测试使用 tsx 时禁用新版 Node 的原生类型剥离以避免旧版 tsx 的模块加载冲突。生产启动仍为 `node dist/index.js`。数据库路径相对模块定位，部署必须保留同级 `data/`，不依赖启动目录。

## 数据说明

当前数据库包含 2,557 个有效条目，共 2,704 行、770 位老师。多人合授的评价关联到每位明确署名的教师；79 个未署名条目使用空 `teacher` 保存，不由姓名接口返回。

评价保留来源、课程、学期和原文正文，已过滤空条目、仅手册页码引用及无评价的场地条目。简短、负面、相互矛盾或重复但含实质正文的评价均保留。旧数据不代表当前教学情况。

一次性导入脚本、清单和报告已移除，运行时读取常驻库 `data/mcp.sqlite`。数据库不存在或评价表为空时，自动从随代码发布的 `data/teacher-reviews.seed.sqlite` 导入全部 2704 条评价，保留原始 ID、教师姓名及正文；已有非空评价表保持不变。部署须同时携带种子库与构建产物，不能用种子库覆盖运行库。执行 `pnpm check` 验证数据库结构、检索、HTTP 路由与 MCP 工具。

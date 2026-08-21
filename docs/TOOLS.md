# Tongji Student MCP Tool Catalog

> 本文档由服务内存实例执行 MCP `tools/list` 导出。服务：`tongji-student-mcp-server`，版本：`0.1.0`。
>
> 本目录共包含 **24** 个当前注册 Tool。下列 JSON Schema 是 MCP 对客户端公开的原始契约：每个字段的 `description` 均保留中文说明；`required`、`enum`、`const`、`additionalProperties` 与可空类型均为实际约束。

## 通用调用与响应约定

- MCP 端点：`POST /mcp`（Streamable HTTP）；健康检查：`GET /health`。
- Tongji Open Platform 的个人数据 Tool 需要调用请求的 `X-Tongji-Access-Token`；YourTJ 公开课程 Tool 不需要该 header。令牌不得写入日志或响应。
- 正常结果的 `status` 是 `ok` 或 `empty`；`empty` 表示调用成功但没有业务数据。
- 业务错误通过 `isError: true` 返回，文本内容为 `{\"status\": \"unauthorized | upstream_unavailable\", \"message\": string}`。
- 输出 schema 中 `string | null`、`number | null` 表示字段存在但上游无可用值时为 `null`；数组字段返回数组。

## 工具目录

| # | Tool | 标题 | 数据源 |
| ---: | --- | --- | --- |
| 1 | `tongji.student.annual_bill` | 查询学生年度统计账单 | Tongji Open Platform |
| 2 | `tongji.student.card_spending_flow` | 查询一卡通消费流水 | Tongji Open Platform |
| 3 | `tongji.student.timetable` | 查询学生课表 | Tongji Open Platform |
| 4 | `tongji.student.detailed_info` | 查询学生详细学籍信息 | Tongji Open Platform |
| 5 | `tongji.student.score` | 查询本科生成绩 | Tongji Open Platform |
| 6 | `tongji.student.term-calendar` | 查询学期日历 | Tongji Open Platform |
| 7 | `tongji.student.current-term-calendar` | 查询当前学期日历 | Tongji Open Platform |
| 8 | `tongji.student.cet-score` | 查询四六级成绩 | Tongji Open Platform |
| 9 | `tongji.student.book-lend-info` | 查询图书借阅信息 | Tongji Open Platform |
| 10 | `tongji.student.statistics-info` | 查询个人统计数据 | Tongji Open Platform |
| 11 | `tongji.student.stipend-info` | 查询助学金信息 | Tongji Open Platform |
| 12 | `tongji.student.accommodation-info` | 查询住宿信息 | Tongji Open Platform |
| 13 | `tongji.student.competition_prize` | 查询本科生竞赛奖励记录 | Tongji Open Platform |
| 14 | `tongji.student.honorary_title` | 查询学生荣誉称号记录 | Tongji Open Platform |
| 15 | `tongji.student.scholarship_info` | 查询学生奖学金记录 | Tongji Open Platform |
| 16 | `tongji.student.school_access` | 查询校门通行记录 | Tongji Open Platform |
| 17 | `tongji.student.library_access` | 查询图书馆通行记录 | Tongji Open Platform |
| 18 | `tongji.user.basic_info` | 查询人员基础信息 | Tongji Open Platform |
| 19 | `tongji.student.course-detail` | 查询课程详情 | YourTJ |
| 20 | `tongji.student.course-related` | 查询课程关联 | YourTJ |
| 21 | `tongji.student.find-major-by-grade` | 按学期年级查询专业 | YourTJ |
| 22 | `tongji.course.catalog` | 查询课程目录 | YourTJ |
| 23 | `tongji.course.calendar_list` | 查询学期列表 | YourTJ |
| 24 | `tongji.course.grade_list` | 查询年级界别列表 | YourTJ |

## 1. `tongji.student.annual_bill` — 查询学生年度统计账单

查询当前已授权学生指定年份的校园年度统计账单。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "year": {
        "type": "string",
        "minLength": 1,
        "description": "必填的统计年份；支持字符串或整数，例如 2024。"
      }
    },
    "required": [
      "year"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的年度统计账单。"
      },
      "data": {
        "type": "object",
        "properties": {
          "list": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "annualBorrowedTopPct": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "借阅图书数量超越全校学生的百分比。"
                },
                "avgDailySpending": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "日均消费金额，单位元。"
                },
                "booksCount": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "年度借阅图书数量。"
                },
                "deptName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学生所属学院或部门名称。"
                },
                "earliestEntryTime": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "年度最早入校时间。"
                },
                "latestExitTime": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "年度最晚出校或夜归时间。"
                },
                "libraryAccessCount": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "年度图书馆入馆总次数。"
                },
                "libraryStudyTime": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "年度在图书馆学习的总时长，单位小时。"
                },
                "libraryStudyTopPct": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "图书馆学习时长超越全校学生的百分比。"
                },
                "maxCumulativeLoc": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "年度最常去或累计消费最多的地点。"
                },
                "maxTransactionAmt": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "年度单笔最高消费金额，单位元。"
                },
                "maxTransactionLoc": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "年度 单笔最高消费地点。"
                },
                "maxTransactionTime": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "年度单笔最高消费发生日期。"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学生姓名，以上游返回内容为准。"
                },
                "shuttleRidesCount": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "跨校区班车乘坐次数。"
                },
                "totalEntries": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "年度进出校总次数。"
                },
                "totalSpendingCanteen": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "年度食堂总消费金额，单位元。"
                },
                "year": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "统计年份。"
                }
              },
              "required": [
                "annualBorrowedTopPct",
                "avgDailySpending",
                "booksCount",
                "deptName",
                "earliestEntryTime",
                "latestExitTime",
                "libraryAccessCount",
                "libraryStudyTime",
                "libraryStudyTopPct",
                "maxCumulativeLoc",
                "maxTransactionAmt",
                "maxTransactionLoc",
                "maxTransactionTime",
                "name",
                "shuttleRidesCount",
                "totalEntries",
                "totalSpendingCanteen",
                "year"
              ],
              "additionalProperties": false
            },
            "description": "当前授权学生的年度统计账单列表。"
          }
        },
        "required": [
          "list"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "年度统计账单数据来源。"
      },
      "year": {
        "type": "string",
        "description": "本次查询指定的统计年份。"
      }
    },
    "required": [
      "status",
      "data",
      "source",
      "year"
    ],
    "additionalProperties": false
  }
}
```

## 2. `tongji.student.card_spending_flow` — 查询一卡通消费流水

查询当前已授权用户在指定时间范围内的一卡通历史消费流水信息。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "tradeStartTime": {
        "type": "string",
        "minLength": 1,
        "description": "可选的交易开始时间，格式为 yyyy-MM-dd HH:mm:ss。"
      },
      "tradeEndTime": {
        "type": "string",
        "minLength": 1,
        "description": "可选的交易结束时间，格式为 yyyy-MM-dd HH:mm:ss。"
      }
    }
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的一卡通消费流水。"
      },
      "data": {
        "type": "object",
        "properties": {
          "userInfos": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "campusAreaName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "消费发生的校区名称，例如四平校区。"
                },
                "cardBalance": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "本次消费完成后的一卡通卡内余额，单位元。"
                },
                "mercName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "发生消费的具体商户或商铺名称。"
                },
                "mercTypeName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "消费分类名称，例如食堂、超市或店铺。"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "消费人员姓名，以上游返回内容为准。"
                },
                "personTypeCode": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "消费人员的人员类型或身份标签。"
                },
                "restaurantName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "餐厅名称；非食堂场景可能返回无。"
                },
                "tradeAmount": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "本次一卡通消费金额，单位元。"
                },
                "tradeDateTime": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "完整交易时间戳，用于按时间排序和查看详细账单。"
                }
              },
              "required": [
                "campusAreaName",
                "cardBalance",
                "mercName",
                "mercTypeName",
                "name",
                "personTypeCode",
                "restaurantName",
                "tradeAmount",
                "tradeDateTime"
              ],
              "additionalProperties": false
            },
            "description": "当前授权用户的一卡通消费流水记录列表。"
          }
        },
        "required": [
          "userInfos"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "一卡通消费流水数据来源。"
      },
      "tradeStartTime": {
        "type": "string",
        "description": "本次查询指定的交易开始时间。"
      },
      "tradeEndTime": {
        "type": "string",
        "description": "本次查询指定的交易结束时间。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 3. `tongji.student.timetable` — 查询学生课表

查询当前已授权学生指定学期的 1Tongji 课表；不传 calendarId 时查询当前学期。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "calendarId": {
        "type": "string",
        "minLength": 1,
        "description": "可选的学期编号；支持字符串或整数，不传时由同济开放平台查询当前学期。"
      }
    }
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的学生课表。"
      },
      "data": {
        "type": "object",
        "properties": {
          "list": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "classCode": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "教学班级编号或选课代码。"
                },
                "className": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "班级名称，例如 01班。"
                },
                "courseCode": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "课程代码。"
                },
                "courseName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "课程名称。"
                },
                "credits": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "课程学分。"
                },
                "teacherName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "授课教师姓名。"
                },
                "classTime": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "上课时间概要或汇总上课时间文本，适合列表直接展示。"
                },
                "classRoom": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "原始教室代码。"
                },
                "classRoomPractice": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "实践地点分类，例如校内或校外。"
                },
                "remark": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "课程备注信息，有值时可展示。"
                },
                "timeTableList": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "dayOfWeek": {
                        "type": [
                          "number",
                          "null"
                        ],
                        "description": "星期几，数字 1-7，用于在日历或格子课表中定位列。"
                      },
                      "timeStart": {
                        "type": [
                          "number",
                          "null"
                        ],
                        "description": "本次上课的开始节次。"
                      },
                      "timeEnd": {
                        "type": [
                          "number",
                          "null"
                        ],
                        "description": "本次上课的结束节次。"
                      },
                      "weekNum": {
                        "type": [
                          "string",
                          "null"
                        ],
                        "description": "本次上课的周次范围文本。"
                      },
                      "weekstr": {
                        "type": [
                          "string",
                          "null"
                        ],
                        "description": "本次上课的星期文本。"
                      },
                      "weeks": {
                        "type": "array",
                        "items": {
                          "type": "number"
                        },
                        "description": "本次排课实际发生的具体上课周次列表。"
                      },
                      "popover": {
                        "type": [
                          "string",
                          "null"
                        ],
                        "description": "鼠标悬停或点击课程时可展示的弹窗文本。"
                      },
                      "roomIdI18n": {
                        "type": [
                          "string",
                          "null"
                        ],
                        "description": "本次上课的教室名称。"
                      },
                      "campusI18n": {
                        "type": [
                          "string",
                          "null"
                        ],
                        "description": "本次上课所在校区名称。"
                      }
                    },
                    "required": [
                      "dayOfWeek",
                      "timeStart",
                      "timeEnd",
                      "weekNum",
                      "weekstr",
                      "weeks",
                      "popover",
                      "roomIdI18n",
                      "campusI18n"
                    ],
                    "additionalProperties": false
                  },
                  "description": "结构化课表细则数组，用于渲染日历或格子课表。"
                },
                "campusI18n": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "课程所在校区名称。"
                },
                "assessmentModeI18n": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "课程考核方式文本，例如考查或考试。"
                },
                "classRoomI18n": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "课程主教室名称。"
                },
                "teachingWayI18n": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "课程授课方式文本，例如线下授课或线上。"
                }
              },
              "required": [
                "classCode",
                "className",
                "courseCode",
                "courseName",
                "credits",
                "teacherName",
                "classTime",
                "classRoom",
                "classRoomPractice",
                "remark",
                "timeTableList",
                "campusI18n",
                "assessmentModeI18n",
                "classRoomI18n",
                "teachingWayI18n"
              ],
              "additionalProperties": false
            },
            "description": "当前授权学生的课程课表列表。"
          }
        },
        "required": [
          "list"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "学生课表数据来源。"
      },
      "calendarId": {
        "type": "string",
        "description": "本次查询指定的学期编号。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 4. `tongji.student.detailed_info` — 查询学生详细学籍信息

查询当前已授权学生的教务系统详细学籍信息。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的学生详细学籍信息。"
      },
      "data": {
        "type": "object",
        "properties": {
          "list": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "nation": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学生民族。"
                },
                "faculty": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学生所属学院名称。"
                },
                "degreeCategory": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学位类别。"
                },
                "enrolDate": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学生入学日期。"
                },
                "cultureProfession": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "培养专业名称。"
                },
                "state": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学生国籍。"
                },
                "profession": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "专业名称。"
                },
                "expectedGraduationDate": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "预计毕业日期。"
                },
                "campus": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "所在校区名称。"
                },
                "degree": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "拟获得的学位名称。"
                },
                "enrolMethods": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "录取或入学方式。"
                },
                "studentSource": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "生源地。"
                },
                "grade": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "学生所在年级。"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学生姓名，以上游返回内容为准。"
                },
                "householdRegister": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "户籍所在地。"
                },
                "trainingMethods": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "培养方式。"
                },
                "maritalStatus": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "婚姻状况。"
                },
                "birthday": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "出生日期。"
                },
                "projId": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "项目或学生类别。"
                },
                "leaveSchool": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学籍或在校状态。"
                },
                "degreeType": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学位类型，例如专业型或学术型。"
                },
                "learningStyle": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学习形式，例如脱产或半脱产。"
                },
                "studentId": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学生学号。"
                },
                "enrolCategory": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "录取类别。"
                },
                "trainingLevel": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "培养层次，例如硕士、博士或本科。"
                },
                "politicalStatus": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "政治面貌。"
                },
                "sex": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学生性别。"
                },
                "enrolSeason": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "入学季节。"
                },
                "teacherId": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "导师编号或后端映射后的导师姓名。"
                },
                "mailingAddress": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "通讯地址或联系地址。"
                },
                "formLearning": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学习形式，例如全日制或非全日制。"
                },
                "stationTermini": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "乘车优惠区间终点。"
                },
                "researchDirection": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "研究方向或具体项目。"
                },
                "lengthSchooling": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学制，单位年。"
                },
                "stationStart": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "乘车优惠区间起点。"
                }
              },
              "required": [
                "nation",
                "faculty",
                "degreeCategory",
                "enrolDate",
                "cultureProfession",
                "state",
                "profession",
                "expectedGraduationDate",
                "campus",
                "degree",
                "enrolMethods",
                "studentSource",
                "grade",
                "name",
                "householdRegister",
                "trainingMethods",
                "maritalStatus",
                "birthday",
                "projId",
                "leaveSchool",
                "degreeType",
                "learningStyle",
                "studentId",
                "enrolCategory",
                "trainingLevel",
                "politicalStatus",
                "sex",
                "enrolSeason",
                "teacherId",
                "mailingAddress",
                "formLearning",
                "stationTermini",
                "researchDirection",
                "lengthSchooling",
                "stationStart"
              ],
              "additionalProperties": false
            },
            "description": "当前授权学生的详细学籍信息记录列表。"
          }
        },
        "required": [
          "list"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "学生详细学籍信息数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 5. `tongji.student.score` — 查询本科生成绩

查询当前已授权本科生在指定学期的成绩；不传 calendarId 时查询当前学期。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "calendarId": {
        "type": "string",
        "minLength": 1,
        "description": "可选的学期编号；支持字符串或整数，不传时由同济开放平台查询当前学期。"
      }
    }
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的学期成绩。"
      },
      "data": {
        "type": "object",
        "properties": {
          "actualCredit": {
            "type": [
              "string",
              "null"
            ],
            "description": "全部学期已修总学分。"
          },
          "failingCourseCount": {
            "type": [
              "string",
              "null"
            ],
            "description": "全部学期不及格课程总数量。"
          },
          "failingCredits": {
            "type": [
              "string",
              "null"
            ],
            "description": "全部学期不及格课程总学分。"
          },
          "totalGradePoint": {
            "type": [
              "string",
              "null"
            ],
            "description": "全部学期平均绩点。"
          },
          "term": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "averagePoint": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "本学期平均绩点。"
                },
                "calName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学期名称或编号。"
                },
                "creditInfo": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "courseCode": {
                        "type": [
                          "string",
                          "null"
                        ],
                        "description": "课程代码。"
                      },
                      "courseName": {
                        "type": [
                          "string",
                          "null"
                        ],
                        "description": "课程名称。"
                      },
                      "credit": {
                        "type": [
                          "number",
                          "null"
                        ],
                        "description": "课程学分。"
                      },
                      "gradePoint": {
                        "type": [
                          "number",
                          "null"
                        ],
                        "description": "课程绩点。"
                      },
                      "isPass": {
                        "type": [
                          "number",
                          "null"
                        ],
                        "description": "是否及格，1 表示及格。"
                      },
                      "isPassName": {
                        "type": [
                          "string",
                          "null"
                        ],
                        "description": "是否及格的文字说明。"
                      },
                      "publicCoursesName": {
                        "type": [
                          "string",
                          "null"
                        ],
                        "description": "课程类型，例如必修。"
                      },
                      "score": {
                        "type": [
                          "string",
                          "null"
                        ],
                        "description": "课程成绩等级。"
                      },
                      "scoreName": {
                        "type": [
                          "string",
                          "null"
                        ],
                        "description": "课程成绩名称。"
                      },
                      "updateTime": {
                        "type": [
                          "string",
                          "null"
                        ],
                        "description": "成绩记录更新时间。"
                      },
                      "year": {
                        "type": [
                          "string",
                          "null"
                        ],
                        "description": "成绩所属学年。"
                      }
                    },
                    "required": [
                      "courseCode",
                      "courseName",
                      "credit",
                      "gradePoint",
                      "isPass",
                      "isPassName",
                      "publicCoursesName",
                      "score",
                      "scoreName",
                      "updateTime",
                      "year"
                    ],
                    "additionalProperties": false
                  },
                  "description": "本学期课程成绩列表。"
                },
                "termName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学期完整名称。"
                },
                "termcode": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学期代码，可作为 calendarId 使用。"
                }
              },
              "required": [
                "averagePoint",
                "calName",
                "creditInfo",
                "termName",
                "termcode"
              ],
              "additionalProperties": false
            },
            "description": "按学期分组的成绩数据。"
          }
        },
        "required": [
          "actualCredit",
          "failingCourseCount",
          "failingCredits",
          "totalGradePoint",
          "term"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "成绩数据来源。"
      },
      "calendarId": {
        "type": "string",
        "description": "本次查询指定的学期编号。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 6. `tongji.student.term-calendar` — 查询学期日历

查询同济大学所有学期的日历信息，返回学期ID、年份、学期编号、起止日期、周数、学年分段名称、学期完整名称及当前/下一学期标识。学期编号可用于查询课表、成绩等其他接口。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的学期日历。"
      },
      "data": {
        "type": "object",
        "properties": {
          "terms": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "学期记录ID。"
                },
                "year": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "学年起始年份。"
                },
                "term": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "学期编号，1 表示第一学期，2 表示第二学期。"
                },
                "beginDay": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "学期开始日期（Unix 时间戳，毫秒）。"
                },
                "endDay": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "学期结束日期（Unix 时间戳，毫秒）。"
                },
                "weekNum": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "该学期包含的教学周数。"
                },
                "weekBenginDay": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "每周起始日（1=周日，2=周一）。"
                },
                "gradePartOne": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学年第一部分，例如 2021。"
                },
                "gradePartTwo": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学年第二部分，例如 2022。"
                },
                "fullName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学期完整名称，例如 2021-2022学年第2学期。"
                },
                "currentTermFlag": {
                  "type": [
                    "boolean",
                    "null"
                  ],
                  "description": "是否为当前学期标识，true 表示是。"
                },
                "nextTermFlag": {
                  "type": [
                    "boolean",
                    "null"
                  ],
                  "description": "是否为下一学期标识，false 表示否。"
                },
                "perTerm": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学期部分名称，例如 第2学期。"
                },
                "perYear": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学年部分名称，例如 2021-2022学年。"
                }
              },
              "required": [
                "id",
                "year",
                "term",
                "beginDay",
                "endDay",
                "weekNum",
                "weekBenginDay",
                "gradePartOne",
                "gradePartTwo",
                "fullName",
                "currentTermFlag",
                "nextTermFlag",
                "perTerm",
                "perYear"
              ],
              "additionalProperties": false
            },
            "description": "全部学期日历列表。"
          }
        },
        "required": [
          "terms"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "学期日历数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 7. `tongji.student.current-term-calendar` — 查询当前学期日历

查询同济大学当前学期的日历摘要，包含学年、学期、周数、当前所处教学周及学期描述。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的当前学期数据。"
      },
      "data": {
        "anyOf": [
          {
            "type": "object",
            "properties": {
              "calendarId": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "当前学期的 calendarId。"
              },
              "beginDay": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "当前学期开始日期的时间戳。"
              },
              "endDay": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "当前学期结束日期的时间戳。"
              },
              "examWeekEnd": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "考试周结束周次。"
              },
              "examWeekStart": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "考试周开始周次。"
              },
              "teachingWeekEnd": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "教学周结束周次。"
              },
              "teachingWeekStart": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "教学周开始周次。"
              },
              "year": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "学年年份。"
              },
              "term": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "学期序号，1 表示第一学期，2 表示第二学期。"
              },
              "weekNum": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "该学期包含的教学周数。"
              },
              "week": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "当前所处的教学周序号。"
              },
              "simpleName": {
                "type": [
                  "string",
                  "null"
                ],
                "description": "学期简称，例如 2021-2022学年度第2学期。"
              },
              "now": {
                "type": [
                  "string",
                  "null"
                ],
                "description": "当前日期所在的月份描述，例如 2022年5月。"
              },
              "name": {
                "type": [
                  "string",
                  "null"
                ],
                "description": "当前学期的完整描述，包含日期与周数。"
              }
            },
            "required": [
              "calendarId",
              "beginDay",
              "endDay",
              "examWeekEnd",
              "examWeekStart",
              "teachingWeekEnd",
              "teachingWeekStart",
              "year",
              "term",
              "weekNum",
              "week",
              "simpleName",
              "now",
              "name"
            ],
            "additionalProperties": false
          },
          {
            "type": "null"
          }
        ],
        "description": "当前学期日历数据，无数据时为 null。"
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "学期日历数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 8. `tongji.student.cet-score` — 查询四六级成绩

查询当前已授权学生的全国大学英语四六级考试成绩（CET-4 / CET-6），返回考试科目、准考证号、笔试成绩、口语成绩和考试时间。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的四六级成绩。"
      },
      "data": {
        "type": "object",
        "properties": {
          "records": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "studentId": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学生ID，已由上游做脱敏处理，不可用于身份验证。"
                },
                "studentName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学生姓名，已由上游做脱敏处理，不可用于身份验证。"
                },
                "competitionType": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "竞赛类型。"
                },
                "writtenSubjectName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "考试科目名称，例如（2）英语六级笔试。"
                },
                "cardNo": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "准考证号，已由上游做脱敏处理，不可用于身份验证。"
                },
                "score": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "笔试成绩。"
                },
                "scoreRank": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "分数排名。"
                },
                "oralScore": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "口语成绩。"
                },
                "examTime": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "考试时间。"
                },
                "cetType": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "CET 类型，1 表示四级，2 表示六级。"
                }
              },
              "required": [
                "studentId",
                "studentName",
                "competitionType",
                "writtenSubjectName",
                "cardNo",
                "score",
                "scoreRank",
                "oralScore",
                "examTime",
                "cetType"
              ],
              "additionalProperties": false
            },
            "description": "四六级考试成绩记录列表。"
          }
        },
        "required": [
          "records"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "四六级成绩数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 9. `tongji.student.book-lend-info` — 查询图书借阅信息

查询当前已授权学生的图书借阅记录，返回书名、作者、ISBN、借出日期、应还日期、馆藏地等信息。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的借阅记录。"
      },
      "data": {
        "type": "object",
        "properties": {
          "records": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "asbackDate": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "催还日期。"
                },
                "asbackTimes": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "催还次数。"
                },
                "author": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "责任者（作者）。"
                },
                "callNo": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "图书类别代码。"
                },
                "callNoName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "图书类别名称。"
                },
                "countryCode": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "书籍国别代码。"
                },
                "countryName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "书籍国别。"
                },
                "debtFlag": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "欠款状态标识。"
                },
                "deptCode": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "读者所属单位代码。"
                },
                "deptName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "读者所属单位名称。"
                },
                "docTypeCode": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "文献类型代码。"
                },
                "docTypeName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "文献类型名称。"
                },
                "isbn": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "ISBN 编号。"
                },
                "langCode": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "书籍语种代码。"
                },
                "langName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "书籍语种名称。"
                },
                "lendDate": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "借出日期。"
                },
                "locationCode": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "馆藏地代码。"
                },
                "locationName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "馆藏地名称。"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "读者姓名，注意该字段未做脱敏处理，不可在公开输出中直接引用。"
                },
                "propNo": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "财产号。"
                },
                "pubYear": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "出版年份。"
                },
                "publisher": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "出版社名称。"
                },
                "renewDate": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "续借日期。"
                },
                "renewTimes": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "续借次数。"
                },
                "retDate": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "实际还书时间。"
                },
                "title": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "题名（书名）。"
                },
                "totalLendQty": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "累计借书次数。"
                },
                "userId": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学工号，注意该字段未做脱敏处理，不可在公开输出中直接引用。"
                }
              },
              "required": [
                "asbackDate",
                "asbackTimes",
                "author",
                "callNo",
                "callNoName",
                "countryCode",
                "countryName",
                "debtFlag",
                "deptCode",
                "deptName",
                "docTypeCode",
                "docTypeName",
                "isbn",
                "langCode",
                "langName",
                "lendDate",
                "locationCode",
                "locationName",
                "name",
                "propNo",
                "pubYear",
                "publisher",
                "renewDate",
                "renewTimes",
                "retDate",
                "title",
                "totalLendQty",
                "userId"
              ],
              "additionalProperties": false
            },
            "description": "图书借阅记录列表。"
          }
        },
        "required": [
          "records"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "图书借阅数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 10. `tongji.student.statistics-info` — 查询个人统计数据

查询当前已授权学生的校园生活统计数据，包括图书馆使用、食堂消费、校车乘坐、超市购物、奖学金及校园卡使用等维度。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的个人统计数据。"
      },
      "data": {
        "type": "object",
        "properties": {
          "records": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "bookCategory": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "借阅最多的图书主题类别。"
                },
                "bookCoun": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "累计借阅图书数量。"
                },
                "bookFirst": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "借阅的第一本书的书名。"
                },
                "canteenAmount": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "食堂累计消费总金额。"
                },
                "canteenAmtPercentileRank": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "食堂总消费超过同济人的百分比。"
                },
                "canteenCoun": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "在食堂累计消费次数。"
                },
                "canteenOften": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "最常去的食堂名称。"
                },
                "canteenOftenPercentileRank": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "最常去食堂的消费占比百分比。"
                },
                "cardPelaceCoun": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "校园卡补卡次数。"
                },
                "college": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "所属学院，已由上游做脱敏处理。"
                },
                "consumMostAmount": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "单日最高消费金额。"
                },
                "consumMostTime": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "单笔最大消费的发生时间。"
                },
                "consumePlaceOften": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "最常光顾的消费场所名称。"
                },
                "consumeTotal": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "校园卡累计消费总金额。"
                },
                "consumeTotalPercentileRank": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "全部消费总金额超过同济人的百分比。"
                },
                "earlistTime": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "最早进入图书馆的时间。"
                },
                "entYear": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "入学年份。"
                },
                "entranceCoun": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "累计进入图书馆次数。"
                },
                "firstCardPlaceTime": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "第一次补卡的时间。"
                },
                "gender": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "性别，0 表示未知。"
                },
                "latestTime": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "最晚离开图书馆的时间。"
                },
                "major": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "专业名称，已由上游做脱敏处理。"
                },
                "marketAmount": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "在校园超市累计消费金额。"
                },
                "rechargeTimeSlot": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "最常进行校园卡充值的时段，以 2 小时为间隔。"
                },
                "rideCoun": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "乘坐校车在校区间往返的次数。"
                },
                "scholarshipCoun": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "获得奖学金的次数。"
                },
                "sname": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学生姓名，已由上游做脱敏处理，不可用于身份验证。"
                },
                "stayTime": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "在图书馆累计停留的小时数。"
                },
                "stayTimePercentileRank": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "图书馆在馆时长超过同济人的百分比。"
                },
                "stayYear": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "在本校就读的总年数（本研合计）。"
                },
                "stuLevel": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学历层次，0 表示本科，1 表示硕士，2 表示博士，9 表示教师。"
                },
                "userId": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学工号，已由上游做脱敏处理，不可用于身份验证。"
                }
              },
              "required": [
                "bookCategory",
                "bookCoun",
                "bookFirst",
                "canteenAmount",
                "canteenAmtPercentileRank",
                "canteenCoun",
                "canteenOften",
                "canteenOftenPercentileRank",
                "cardPelaceCoun",
                "college",
                "consumMostAmount",
                "consumMostTime",
                "consumePlaceOften",
                "consumeTotal",
                "consumeTotalPercentileRank",
                "earlistTime",
                "entYear",
                "entranceCoun",
                "firstCardPlaceTime",
                "gender",
                "latestTime",
                "major",
                "marketAmount",
                "rechargeTimeSlot",
                "rideCoun",
                "scholarshipCoun",
                "sname",
                "stayTime",
                "stayTimePercentileRank",
                "stayYear",
                "stuLevel",
                "userId"
              ],
              "additionalProperties": false
            },
            "description": "个人统计数据记录列表。"
          }
        },
        "required": [
          "records"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "统计数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 11. `tongji.student.stipend-info` — 查询助学金信息

查询当前已授权学生获得的助学金记录，返回助学金名称、金额、等级、评定学年及学期等信息。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的助学金记录。"
      },
      "data": {
        "type": "object",
        "properties": {
          "records": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "amount": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "助学金金额。"
                },
                "deptCode": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "所属学院代码。"
                },
                "deptName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "所属学院名称。"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "获得助学金学生姓名，已由上游做脱敏处理，不可用于身份验证。"
                },
                "rankName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "助学金等级名称。"
                },
                "ratingTerm": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "评定学期。"
                },
                "ratingYear": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "评定学年。"
                },
                "stipendName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "助学金名称。"
                },
                "unitAbbreviation": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "所属单位简称。"
                },
                "updateTime": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "记录更新时间。"
                },
                "userId": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "获得助学金学生学号，已由上游做脱敏处理，不可用于身份验证。"
                },
                "wid": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "助学金记录唯一标识。"
                }
              },
              "required": [
                "amount",
                "deptCode",
                "deptName",
                "name",
                "rankName",
                "ratingTerm",
                "ratingYear",
                "stipendName",
                "unitAbbreviation",
                "updateTime",
                "userId",
                "wid"
              ],
              "additionalProperties": false
            },
            "description": "助学金记录列表。"
          }
        },
        "required": [
          "records"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "助学金数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 12. `tongji.student.accommodation-info` — 查询住宿信息

查询当前已授权学生的住宿信息，返回宿舍楼、宿舍区、楼层、房间号及所属学院等信息。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的住宿记录。"
      },
      "data": {
        "type": "object",
        "properties": {
          "records": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "accomBuildingCode": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "宿舍楼代码。"
                },
                "accomBuildingName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "宿舍楼名称。"
                },
                "accomRegionCode": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "宿舍区代码。"
                },
                "accomRegionName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "宿舍区名称。"
                },
                "deptCode": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "所属部门/学院代码。"
                },
                "deptName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "所属部门/学院名称。"
                },
                "floor": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "楼层。"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学生姓名，已由上游做脱敏处理，不可用于身份验证。"
                },
                "roomNo": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "房间号。"
                },
                "userId": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学号，已由上游做脱敏处理，不可用于身份验证。"
                },
                "usertypeCode": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "人员类型代码。"
                },
                "usertypeName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "人员类型名称，例如硕士研究生。"
                }
              },
              "required": [
                "accomBuildingCode",
                "accomBuildingName",
                "accomRegionCode",
                "accomRegionName",
                "deptCode",
                "deptName",
                "floor",
                "name",
                "roomNo",
                "userId",
                "usertypeCode",
                "usertypeName"
              ],
              "additionalProperties": false
            },
            "description": "住宿记录列表。"
          }
        },
        "required": [
          "records"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "住宿数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 13. `tongji.student.competition_prize` — 查询本科生竞赛奖励记录

查询当前已授权本科生的竞赛获奖与奖励记录。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的竞赛奖励记录。"
      },
      "data": {
        "type": "object",
        "properties": {
          "list": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "awardCategory": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "奖励类别，例如竞赛获奖。"
                },
                "awardDate": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "获奖时间。"
                },
                "awardLevel": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "奖项等级，例如一等奖。"
                },
                "competitionLevel": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "比赛等级，例如校级。"
                },
                "competitionName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "比赛名称。"
                },
                "deptName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "获奖记录所属部门名称。"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "获奖人姓名，以上游返回内容为准。"
                },
                "schoolYear": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "获奖记录所属学年。"
                }
              },
              "required": [
                "awardCategory",
                "awardDate",
                "awardLevel",
                "competitionLevel",
                "competitionName",
                "deptName",
                "name",
                "schoolYear"
              ],
              "additionalProperties": false
            },
            "description": "当前授权本科生的竞赛奖励记录列表。"
          }
        },
        "required": [
          "list"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "竞赛奖励数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 14. `tongji.student.honorary_title` — 查询学生荣誉称号记录

查询当前已授权学生获得荣誉称号的情况信息。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的荣誉称号记录。"
      },
      "data": {
        "type": "object",
        "properties": {
          "list": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "deptName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "获奖人所属学院或部门名称。"
                },
                "honorTitle": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "荣誉称号或奖项名称。"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "获奖人姓名，以上游返回内容为准。"
                },
                "ratingYear": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "荣誉称号或奖项的评定年份。"
                }
              },
              "required": [
                "deptName",
                "honorTitle",
                "name",
                "ratingYear"
              ],
              "additionalProperties": false
            },
            "description": "当前授权学生的荣誉称号记录列表。"
          }
        },
        "required": [
          "list"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "荣誉称号数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 15. `tongji.student.scholarship_info` — 查询学生奖学金记录

查询当前已授权学生获得奖学金的情况信息。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的奖学金记录。"
      },
      "data": {
        "type": "object",
        "properties": {
          "count": {
            "type": [
              "number",
              "null"
            ],
            "description": "奖学金获奖数量。"
          },
          "list": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "deptName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "获奖学生所属学院名称。"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "获奖学生姓名，以上游返回内容为准。"
                },
                "rating": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "奖学金评级，例如校内。"
                },
                "ratingYear": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "奖学金评级年度。"
                },
                "scholarshipLevel": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "奖学金获奖等级。"
                },
                "scholarshipName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "奖学金奖项名称。"
                },
                "updateTime": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "奖学金记录更新时间。"
                }
              },
              "required": [
                "deptName",
                "name",
                "rating",
                "ratingYear",
                "scholarshipLevel",
                "scholarshipName",
                "updateTime"
              ],
              "additionalProperties": false
            },
            "description": "当前授权学生的奖学金记录列表。"
          }
        },
        "required": [
          "count",
          "list"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "奖学金数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 16. `tongji.student.school_access` — 查询校门通行记录

查询当前已授权学生在指定时间范围内的校门进出通行记录。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "portNum": {
        "type": "string",
        "enum": [
          "入门",
          "出门"
        ],
        "description": "可选的进出状态；不传时查询全部通行记录。"
      },
      "dataStartTime": {
        "type": "string",
        "minLength": 1,
        "description": "可选的开始时间，格式为 yyyy-MM-dd HH:mm:ss。"
      },
      "dataEndTime": {
        "type": "string",
        "minLength": 1,
        "description": "可选的结束时间，格式为 yyyy-MM-dd HH:mm:ss。"
      }
    }
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的校门通行记录。"
      },
      "data": {
        "type": "object",
        "properties": {
          "count": {
            "type": [
              "number",
              "null"
            ],
            "description": "校门通行记录次数。"
          },
          "userInfos": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "dataTime": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "校门通行时间。"
                },
                "deptName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "通行人所属学院名称。"
                },
                "equptName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "校门通行点或设备名称。"
                },
                "lctnName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "校门通行位置名称。"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "通行人姓名，以上游返回内容为准。"
                },
                "portNum": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "进出状态，例如入门或出门。"
                },
                "sex": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "通行人性别。"
                }
              },
              "required": [
                "dataTime",
                "deptName",
                "equptName",
                "lctnName",
                "name",
                "portNum",
                "sex"
              ],
              "additionalProperties": false
            },
            "description": "当前授权学生的校门通行记录列表。"
          }
        },
        "required": [
          "count",
          "userInfos"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "校门通行数据来源。"
      },
      "portNum": {
        "type": "string",
        "description": "本次查询指定的进出状态。"
      },
      "dataStartTime": {
        "type": "string",
        "description": "本次查询指定的开始时间。"
      },
      "dataEndTime": {
        "type": "string",
        "description": "本次查询指定的结束时间。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 17. `tongji.student.library_access` — 查询图书馆通行记录

查询当前已授权学生在指定时间范围内的图书馆闸机进出记录。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "direction": {
        "type": "string",
        "enum": [
          "1",
          "2"
        ],
        "description": "可选的进出方向；支持字符串或整数，1 表示进，2 表示出；不传时查询全部。"
      },
      "visitStartTime": {
        "type": "string",
        "minLength": 1,
        "description": "可选的开始时间，格式为 yyyy-MM-dd HH:mm:ss。"
      },
      "visitEndTime": {
        "type": "string",
        "minLength": 1,
        "description": "可选的结束时间，格式为 yyyy-MM-dd HH:mm:ss。"
      }
    }
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的图书馆通行记录。"
      },
      "data": {
        "type": "object",
        "properties": {
          "userInfos": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "deptName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "通行人所属学院名称。"
                },
                "direction": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "图书馆进出方向，1 表示进，2 表示出。"
                },
                "door": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "图书馆出入口名称。"
                },
                "libPlace": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "图书馆通行地点。"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "通行人姓名，以上游返回内容为准。"
                },
                "type": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "通行人身份类型。"
                },
                "visitTime": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "图书馆刷卡通行时间。"
                }
              },
              "required": [
                "deptName",
                "direction",
                "door",
                "libPlace",
                "name",
                "type",
                "visitTime"
              ],
              "additionalProperties": false
            },
            "description": "当前授权学生的图书馆通行记录列表。"
          }
        },
        "required": [
          "userInfos"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "图书馆通行数据来源。"
      },
      "direction": {
        "type": "string",
        "description": "本次查询指定的进出方向。"
      },
      "visitStartTime": {
        "type": "string",
        "description": "本次查询指定的开始时间。"
      },
      "visitEndTime": {
        "type": "string",
        "description": "本次查询指定的结束时间。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 18. `tongji.user.basic_info` — 查询人员基础信息

查询当前已授权用户可见的人员基础信息。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的人员基础信息。"
      },
      "data": {
        "type": "object",
        "properties": {
          "list": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "deptName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "人员所属学院或部门名称。"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "人员姓名，以上游返回内容为准。"
                },
                "statusName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学籍或账号状态，例如有效、毕业或冻结。"
                },
                "userTypeName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "人员或身份类型，例如本科生、硕士研究生或教职工。"
                }
              },
              "required": [
                "deptName",
                "name",
                "statusName",
                "userTypeName"
              ],
              "additionalProperties": false
            },
            "description": "当前授权用户可见的人员基础信息记录列表。"
          }
        },
        "required": [
          "list"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Tongji Open Platform",
        "description": "人员基础信息数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 19. `tongji.student.course-detail` — 查询课程详情

查询指定课程ID的详细信息，包含课程编码、名称、学分、开课院系、授课教师、综合评分、开设学期列表及学生评价。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "id": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "description": "课程ID，必填。"
      }
    },
    "required": [
      "id"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示未找到课程或课程数据为空。"
      },
      "data": {
        "anyOf": [
          {
            "type": "object",
            "properties": {
              "id": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "课程ID。"
              },
              "code": {
                "type": [
                  "string",
                  "null"
                ],
                "description": "课程编码。"
              },
              "name": {
                "type": [
                  "string",
                  "null"
                ],
                "description": "课程名称。"
              },
              "credit": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "学分值。"
              },
              "department": {
                "type": [
                  "string",
                  "null"
                ],
                "description": "开课院系或部门名称。"
              },
              "teacher_id": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "授课教师ID。"
              },
              "review_count": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "评价总数。"
              },
              "review_avg": {
                "type": [
                  "number",
                  "null"
                ],
                "description": "综合评分。"
              },
              "search_keywords": {
                "type": [
                  "string",
                  "null"
                ],
                "description": "用于搜索的关联关键词，包含课程编码、名称、院系及教师姓名。"
              },
              "teacher_name": {
                "type": [
                  "string",
                  "null"
                ],
                "description": "授课教师姓名。"
              },
              "semesters": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "该课程开设的学期列表。"
              },
              "reviews": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": [
                        "number",
                        "null"
                      ],
                      "description": "评价记录ID。"
                    },
                    "course_id": {
                      "type": [
                        "number",
                        "null"
                      ],
                      "description": "关联的课程ID。"
                    },
                    "semester": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "description": "评价对应的上课学期。"
                    },
                    "rating": {
                      "type": [
                        "number",
                        "null"
                      ],
                      "description": "学生给出的评分，范围为 1 至 5 分。"
                    },
                    "comment": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "description": "评价正文，通常包含考核方式与授课质量等信息。"
                    },
                    "score": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "description": "学生最终成绩。"
                    },
                    "created_at": {
                      "type": [
                        "number",
                        "null"
                      ],
                      "description": "评价创建时间（Unix 时间戳）。"
                    },
                    "approve_count": {
                      "type": [
                        "number",
                        "null"
                      ],
                      "description": "赞同数。"
                    },
                    "disapprove_count": {
                      "type": [
                        "number",
                        "null"
                      ],
                      "description": "反对数。"
                    },
                    "is_hidden": {
                      "type": [
                        "number",
                        "null"
                      ],
                      "description": "是否被隐藏，0 表示否，1 表示是。"
                    },
                    "reviewer_name": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "description": "评价人姓名，不可用于身份验证或在公开输出中直接引用。"
                    },
                    "like_count": {
                      "type": [
                        "number",
                        "null"
                      ],
                      "description": "点赞总数。"
                    }
                  },
                  "required": [
                    "id",
                    "course_id",
                    "semester",
                    "rating",
                    "comment",
                    "score",
                    "created_at",
                    "approve_count",
                    "disapprove_count",
                    "is_hidden",
                    "reviewer_name",
                    "like_count"
                  ],
                  "additionalProperties": false
                },
                "description": "学生评价列表。"
              }
            },
            "required": [
              "id",
              "code",
              "name",
              "credit",
              "department",
              "teacher_id",
              "review_count",
              "review_avg",
              "search_keywords",
              "teacher_name",
              "semesters",
              "reviews"
            ],
            "additionalProperties": false
          },
          {
            "type": "null"
          }
        ],
        "description": "课程详情数据，未找到时返回 null。"
      },
      "source": {
        "type": "string",
        "const": "YourTJ",
        "description": "课程数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 20. `tongji.student.course-related` — 查询课程关联

查询指定课程的关联信息，包括该教师教授的其他课程，以及同一门课程由其他教师授课的列表。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "id": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "description": "课程ID，必填。"
      }
    },
    "required": [
      "id"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有关联课程数据。"
      },
      "data": {
        "anyOf": [
          {
            "type": "object",
            "properties": {
              "teacherOtherCourses": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": [
                        "number",
                        "null"
                      ],
                      "description": "课程标识ID。"
                    },
                    "code": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "description": "课程编码。"
                    },
                    "name": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "description": "课程名称。"
                    },
                    "teacher_name": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "description": "授课教师姓名。"
                    },
                    "review_avg": {
                      "type": [
                        "number",
                        "null"
                      ],
                      "description": "该课程的综合评分。"
                    },
                    "review_count": {
                      "type": [
                        "number",
                        "null"
                      ],
                      "description": "该课程的评价总数。"
                    }
                  },
                  "required": [
                    "id",
                    "code",
                    "name",
                    "teacher_name",
                    "review_avg",
                    "review_count"
                  ],
                  "additionalProperties": false
                },
                "description": "该教师教授的其他课程列表。"
              },
              "sameCourseOtherTeachers": {
                "type": "array",
                "items": {
                  "$ref": "#/properties/data/anyOf/0/properties/teacherOtherCourses/items"
                },
                "description": "同一门课程由其他教师授课的列表。"
              }
            },
            "required": [
              "teacherOtherCourses",
              "sameCourseOtherTeachers"
            ],
            "additionalProperties": false
          },
          {
            "type": "null"
          }
        ],
        "description": "课程关联数据，无数据时返回 null。"
      },
      "source": {
        "type": "string",
        "const": "YourTJ",
        "description": "课程数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 21. `tongji.student.find-major-by-grade` — 按学期年级查询专业

根据学期编号和年级查询 YourTJ 上的专业列表，返回专业编码和名称。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "calendarId": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "description": "学期编号，必填。"
      },
      "grade": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "description": "年级，必填。"
      }
    },
    "required": [
      "calendarId",
      "grade"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的专业数据。"
      },
      "data": {
        "type": "object",
        "properties": {
          "records": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "code": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "专业编码。"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "专业名称。"
                }
              },
              "required": [
                "code",
                "name"
              ],
              "additionalProperties": false
            },
            "description": "专业信息列表。"
          }
        },
        "required": [
          "records"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "YourTJ",
        "description": "专业数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 22. `tongji.course.catalog` — 查询课程目录

查询 YourTJ 课程目录，支持按课程名称、课程代码或教师关键词检索。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "page": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "description": "可选的页码，从 1 开始。"
      },
      "limit": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "description": "可选的每页条数。"
      },
      "q": {
        "type": "string",
        "minLength": 1,
        "description": "可选的查询关键词；支持字符串或整数，适用于课程名称、课程代码或教师姓名。"
      }
    }
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的课程目录记录。"
      },
      "data": {
        "type": "object",
        "properties": {
          "list": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "课程 ID。"
                },
                "code": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "课程代码，例如 54011212。"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "课程名称。"
                },
                "rating": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "课程评分或评教得分，可按前端需要格式化展示。"
                },
                "review_count": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "课程评价人数或点评条数。"
                },
                "teacher_name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "授课教师姓名。"
                },
                "department": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "开课院系或开设学院名称。"
                },
                "credit": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "课程学分。"
                },
                "semesters": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "开课学期列表，适合用于筛选下拉框或标签展示。"
                }
              },
              "required": [
                "id",
                "code",
                "name",
                "rating",
                "review_count",
                "teacher_name",
                "department",
                "credit",
                "semesters"
              ],
              "additionalProperties": false
            },
            "description": "符合查询条件的课程目录列表。"
          }
        },
        "required": [
          "list"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "YourTJ",
        "description": "课程目录数据来源。"
      },
      "page": {
        "type": "number",
        "description": "本次查询指定的页码。"
      },
      "limit": {
        "type": "number",
        "description": "本次查询指定的每页条数。"
      },
      "q": {
        "type": "string",
        "description": "本次查询指定的课程检索关键词。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 23. `tongji.course.calendar_list` — 查询学期列表

查询 YourTJ 可用学期列表，用于课程、年级等筛选项。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的学期列表。"
      },
      "data": {
        "type": "object",
        "properties": {
          "list": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "calendarId": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "选中的学期 ID 或值，用作传递给后端的查询参数值。"
                },
                "calendarName": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "学期名称，通常作为下拉菜单展示给用户看的文本。"
                }
              },
              "required": [
                "calendarId",
                "calendarName"
              ],
              "additionalProperties": false
            },
            "description": "可供选择的学期列表。"
          }
        },
        "required": [
          "list"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "YourTJ",
        "description": "学期列表数据来源。"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  }
}
```

## 24. `tongji.course.grade_list` — 查询年级界别列表

根据 YourTJ 学期编号查询该学期可用的年级/界别筛选列表。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "calendarId": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "description": "必填的学期编号。"
      }
    },
    "required": [
      "calendarId"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "empty"
        ],
        "description": "查询状态，empty 表示没有可返回的年级/界别列表。"
      },
      "data": {
        "type": "object",
        "properties": {
          "gradeList": {
            "type": "array",
            "items": {
              "type": "number"
            },
            "description": "年级或界别列表，例如 2025、2024，常用于筛选下拉菜单。"
          }
        },
        "required": [
          "gradeList"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "YourTJ",
        "description": "年级/界别列表数据来源。"
      },
      "calendarId": {
        "type": "number",
        "description": "本次查询指定的学期编号。"
      }
    },
    "required": [
      "status",
      "data",
      "source",
      "calendarId"
    ],
    "additionalProperties": false
  }
}
```

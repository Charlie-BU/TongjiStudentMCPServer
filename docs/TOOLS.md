# Tongji Student MCP Tool Catalog

> 由服务内存实例执行 MCP `tools/list` 导出。服务：`tongji-student-mcp-server`，版本：`0.1.0`。
> 当前注册 **36** 个 Tool；以下 Schema 为客户端实际可见契约。

## 通用约定

- MCP 端点：`POST /mcp`；健康检查：`GET /health`。
- 个人数据工具使用调用上下文的 `X-Tongji-Access-Token`；YourTJ 公开课程和本地历史评价不需要账号凭据。
- 成功结果包含相同内容的 JSON 文本和 `structuredContent`。错误通过 `isError: true` 返回脱敏消息。
- 新 YourTJ 课程工具保留 `status/data/source` 包装，`data` 使用新的 camelCase 字段；可选字段缺失时不补 null。详情不再内嵌评价。
- 新 YourTJ 搜索使用 `keyword/page/size`，详情和关联使用 `courseId`；旧 `q/limit/id` 参数已移除。
- 课程迁移和 CAM 总结生成缺口说明见 [YourTJ 接入](YOURTJ.md)。

- 瑞幸登录与检查使用同济凭据识别用户，Token 保存在服务端；check 返回 valid 布尔值，见 [瑞幸登录](LUCKIN.md)。

## 工具目录

| # | Tool | 标题 | 数据源 |
| ---: | --- | --- | --- |
| 1 | `tongji.course.legacy-teacher-reviews` | 检索老师历史评价 | Local SQLite |
| 2 | `tongji.student.annual_bill` | 查询学生年度统计账单 | Tongji Open Platform |
| 3 | `tongji.student.card_spending_flow` | 查询一卡通消费流水 | Tongji Open Platform |
| 4 | `tongji.student.timetable` | 查询学生课表 | Tongji Open Platform |
| 5 | `tongji.student.detailed_info` | 查询学生详细学籍信息 | Tongji Open Platform |
| 6 | `tongji.student.score` | 查询本科生成绩 | Tongji Open Platform |
| 7 | `tongji.student.term-calendar` | 查询学期日历 | Tongji Open Platform |
| 8 | `tongji.student.current-term-calendar` | 查询当前学期日历 | Tongji Open Platform |
| 9 | `tongji.student.cet-score` | 查询四六级成绩 | Tongji Open Platform |
| 10 | `tongji.student.book-lend-info` | 查询图书借阅信息 | Tongji Open Platform |
| 11 | `tongji.student.statistics-info` | 查询个人统计数据 | Tongji Open Platform |
| 12 | `tongji.student.stipend-info` | 查询助学金信息 | Tongji Open Platform |
| 13 | `tongji.student.accommodation-info` | 查询住宿信息 | Tongji Open Platform |
| 14 | `tongji.student.competition_prize` | 查询本科生竞赛奖励记录 | Tongji Open Platform |
| 15 | `tongji.student.honorary_title` | 查询学生荣誉称号记录 | Tongji Open Platform |
| 16 | `tongji.student.scholarship_info` | 查询学生奖学金记录 | Tongji Open Platform |
| 17 | `tongji.student.school_access` | 查询校门通行记录 | Tongji Open Platform |
| 18 | `tongji.student.library_access` | 查询图书馆通行记录 | Tongji Open Platform |
| 19 | `tongji.user.basic_info` | 查询人员基础信息 | Tongji Open Platform |
| 20 | `tongji.course.course-detail` | 查询课程详情 | YourTJ |
| 21 | `tongji.course.course-related` | 查询课程关联 | YourTJ |
| 22 | `tongji.course.reviews` | 查询课程评价 | YourTJ |
| 23 | `tongji.course.summary` | 查询课程 AI 总结 | YourTJ |
| 24 | `tongji.course.search` | 查询课程目录 | YourTJ |
| 25 | `tongji.course.calendar_list` | 查询学期列表 | YourTJ |
| 26 | `luckin.auth.send_sms_code` | 发送瑞幸登录验证码 | Luckin Coffee |
| 27 | `luckin.auth.login` | 登录瑞幸并保存凭据 | Luckin Coffee |
| 28 | `luckin.auth.check` | 检查瑞幸登录状态 | Luckin Coffee |
| 29 | `luckin.shop.search` | 查询瑞幸门店 | Luckin Coffee |
| 30 | `luckin.product.search` | 搜索瑞幸商品 | Luckin Coffee |
| 31 | `luckin.product.detail` | 查询瑞幸商品详情 | Luckin Coffee |
| 32 | `luckin.product.switch` | 切换瑞幸商品规格 | Luckin Coffee |
| 33 | `luckin.order.preview` | 预览瑞幸订单 | Luckin Coffee |
| 34 | `luckin.order.create` | 创建瑞幸订单 | Luckin Coffee |
| 35 | `luckin.order.get` | 查询瑞幸订单 | Luckin Coffee |
| 36 | `luckin.order.cancel` | 取消瑞幸订单 | Luckin Coffee |

## 1. `tongji.course.legacy-teacher-reviews` — 检索老师历史评价

按至少两个字的老师姓名或姓名片段模糊检索评价，返回所有匹配老师的全部评价。保留课程和原始学期；属于历史学生主观评价，不一定代表当前情况。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "teacher": {
        "type": "string",
        "minLength": 2,
        "maxLength": 100,
        "description": "至少两个字的老师姓名或姓名片段（如“陈滨”），按连续子串匹配，自动去除首尾空白。"
      }
    },
    "required": [
      "teacher"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "content": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    },
    "required": [
      "content"
    ],
    "additionalProperties": false
  },
  "annotations": {
    "readOnlyHint": true,
    "destructiveHint": false,
    "idempotentHint": true,
    "openWorldHint": false
  }
}
```

## 2. `tongji.student.annual_bill` — 查询学生年度统计账单

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
                  "description": "年度单笔最高消费地点。"
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

## 3. `tongji.student.card_spending_flow` — 查询一卡通消费流水

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

## 4. `tongji.student.timetable` — 查询学生课表

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

## 5. `tongji.student.detailed_info` — 查询学生详细学籍信息

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

## 6. `tongji.student.score` — 查询本科生成绩

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

## 7. `tongji.student.term-calendar` — 查询学期日历

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

## 8. `tongji.student.current-term-calendar` — 查询当前学期日历

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

## 9. `tongji.student.cet-score` — 查询四六级成绩

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

## 10. `tongji.student.book-lend-info` — 查询图书借阅信息

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

## 11. `tongji.student.statistics-info` — 查询个人统计数据

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

## 12. `tongji.student.stipend-info` — 查询助学金信息

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

## 13. `tongji.student.accommodation-info` — 查询住宿信息

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

## 14. `tongji.student.competition_prize` — 查询本科生竞赛奖励记录

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

## 15. `tongji.student.honorary_title` — 查询学生荣誉称号记录

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

## 16. `tongji.student.scholarship_info` — 查询学生奖学金记录

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

## 17. `tongji.student.school_access` — 查询校门通行记录

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

## 18. `tongji.student.library_access` — 查询图书馆通行记录

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

## 19. `tongji.user.basic_info` — 查询人员基础信息

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

## 20. `tongji.course.course-detail` — 查询课程详情

查询课程基础信息、学分乘以 10 的 creditX10、开课记录和评分统计。此工具不含评价正文，需使用 tongji.course.reviews 查询评价。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "courseId": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "description": "课程记录 ID，来自课程搜索结果的 id。"
      }
    },
    "required": [
      "courseId"
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
        "description": "查询状态；empty 表示成功但当前没有可展示数据。"
      },
      "data": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "description": "课程记录 ID。"
          },
          "primaryCode": {
            "type": "string",
            "description": "主课程代码，保留前导零。"
          },
          "name": {
            "type": "string",
            "description": "课程名称。"
          },
          "department": {
            "type": "string",
            "description": "开课院系，可能为空字符串。"
          },
          "ratingAvg": {
            "type": "number",
            "description": "课程平均评分，无评分时可能省略。"
          },
          "reviewCount": {
            "type": "integer",
            "description": "评价数量，无评价时可能省略。"
          },
          "teacherName": {
            "type": "string",
            "description": "关联教师姓名，不代表全部开课教师。"
          },
          "creditX10": {
            "type": "integer",
            "description": "学分乘以 10，例如 50 表示 5 学分。"
          },
          "teacherId": {
            "type": "integer",
            "description": "关联教师 ID。"
          },
          "offerings": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "integer",
                  "description": "开课记录 ID，可作为评价查询的 offeringId。"
                },
                "termCode": {
                  "type": "string",
                  "description": "学期代码。"
                },
                "termName": {
                  "type": "string",
                  "description": "学期名称。"
                },
                "campus": {
                  "type": "string",
                  "description": "校区。"
                },
                "faculty": {
                  "type": "string",
                  "description": "开课院系。"
                },
                "classCode": {
                  "type": "string",
                  "description": "开课代码。"
                },
                "className": {
                  "type": "string",
                  "description": "班级名称。"
                },
                "instructors": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "该次开课的教师列表。"
                },
                "ratingAvg": {
                  "type": "number",
                  "description": "该次开课的平均评分。"
                },
                "reviewCount": {
                  "type": "integer",
                  "description": "该次开课的评价数。"
                }
              },
              "required": [
                "id"
              ],
              "additionalProperties": false
            },
            "description": "开课记录列表。"
          },
          "ratingDistribution": {
            "type": "array",
            "items": {
              "type": "integer"
            },
            "description": "评分分布，当前上游为 1 至 5 星对应数量。"
          },
          "reviewScope": {
            "type": "string",
            "description": "评价聚合范围，例如 teacher；保留开放枚举。"
          }
        },
        "required": [
          "id",
          "primaryCode",
          "name"
        ],
        "additionalProperties": false
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
  },
  "annotations": {
    "readOnlyHint": true,
    "destructiveHint": false,
    "idempotentHint": true,
    "openWorldHint": true
  }
}
```

## 21. `tongji.course.course-related` — 查询课程关联

查询教师的其他课程、同课程其他教师记录及课程关联信息。返回的新课程 id 可用于详情、评价和总结查询。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "courseId": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "description": "课程记录 ID，来自课程搜索结果的 id。"
      }
    },
    "required": [
      "courseId"
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
        "description": "查询状态；empty 表示成功但当前没有可展示数据。"
      },
      "data": {
        "type": "object",
        "properties": {
          "teacherOtherCourses": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "integer",
                  "description": "课程记录 ID。"
                },
                "primaryCode": {
                  "type": "string",
                  "description": "主课程代码，保留前导零。"
                },
                "name": {
                  "type": "string",
                  "description": "课程名称。"
                },
                "department": {
                  "type": "string",
                  "description": "开课院系，可能为空字符串。"
                },
                "ratingAvg": {
                  "type": "number",
                  "description": "课程平均评分，无评分时可能省略。"
                },
                "reviewCount": {
                  "type": "integer",
                  "description": "评价数量，无评价时可能省略。"
                },
                "teacherName": {
                  "type": "string",
                  "description": "关联教师姓名，不代表全部开课教师。"
                },
                "instructors": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "开课教师列表。"
                },
                "ratingCount": {
                  "type": "integer",
                  "description": "评分数量，与评价数量独立保留。"
                }
              },
              "required": [
                "id",
                "primaryCode",
                "name"
              ],
              "additionalProperties": false
            },
            "description": "相关教师的其他课程。"
          },
          "sameCourseOtherTeachers": {
            "type": "array",
            "items": {},
            "description": "同课程的其他教师记录，上游尚未声明元素结构。"
          },
          "lineage": {
            "type": "array",
            "items": {},
            "description": "课程关联信息，上游尚未声明元素结构。"
          }
        },
        "required": [
          "teacherOtherCourses"
        ],
        "additionalProperties": false
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
  },
  "annotations": {
    "readOnlyHint": true,
    "destructiveHint": false,
    "idempotentHint": true,
    "openWorldHint": true
  }
}
```

## 22. `tongji.course.reviews` — 查询课程评价

查询课程评价正文、评分和开课记录，可按 offeringId 筛选。使用 pageSize 和 cursor 分页，nextCursor 缺失或为空时结束；翻页时保持筛选条件不变。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "courseId": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "description": "课程记录 ID，来自课程搜索结果的 id。"
      },
      "offeringId": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "description": "开课记录 ID，来自课程详情 offerings；省略时查询课程全部评价。"
      },
      "cursor": {
        "type": "string",
        "description": "上一页的 nextCursor，原样传回；首页省略。"
      },
      "pageSize": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "default": 20,
        "description": "每页评价数，默认 20。"
      }
    },
    "required": [
      "courseId"
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
        "description": "查询状态；empty 表示成功但当前没有可展示数据。"
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
                  "type": "integer",
                  "description": "评价 ID，可用于去重。"
                },
                "offeringId": {
                  "type": "integer",
                  "description": "关联开课记录 ID。"
                },
                "rating": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 5,
                  "description": "评价星级，1 至 5。"
                },
                "content": {
                  "type": "string",
                  "description": "评价原文，可能包含换行和 Markdown。"
                },
                "contentHtml": {
                  "type": "string",
                  "description": "评价 HTML 正文，展示时按不可信 HTML 处理。"
                },
                "author": {
                  "type": "object",
                  "properties": {
                    "kind": {
                      "type": "string",
                      "description": "作者类型，例如 legacy；保留开放枚举。"
                    },
                    "label": {
                      "type": "string",
                      "description": "作者公开展示标签。"
                    }
                  },
                  "additionalProperties": false,
                  "description": "作者展示信息，仅返回已声明字段。"
                },
                "viewer": {
                  "type": "object",
                  "properties": {
                    "canEdit": {
                      "type": "boolean",
                      "description": "是否可编辑。"
                    },
                    "canDelete": {
                      "type": "boolean",
                      "description": "是否可删除。"
                    },
                    "isHelpful": {
                      "type": "boolean",
                      "description": "是否已标记有帮助。"
                    },
                    "isDisliked": {
                      "type": "boolean",
                      "description": "是否已点踩。"
                    }
                  },
                  "additionalProperties": false,
                  "description": "当前访问者的权限和交互状态。"
                },
                "helpfulCount": {
                  "type": "integer",
                  "description": "有帮助数量。"
                },
                "dislikeCount": {
                  "type": "integer",
                  "description": "点踩数量。"
                },
                "createdAt": {
                  "type": "string",
                  "description": "创建时间，ISO 8601 字符串。"
                },
                "updatedAt": {
                  "type": "string",
                  "description": "更新时间，ISO 8601 字符串。"
                }
              },
              "required": [
                "id",
                "rating",
                "content"
              ],
              "additionalProperties": false
            },
            "description": "当前批次评价列表。"
          },
          "total": {
            "type": "integer",
            "minimum": 0,
            "description": "评价总数。"
          },
          "nextCursor": {
            "type": "string",
            "description": "下一页游标，缺失或为空表示结束。"
          }
        },
        "required": [
          "list",
          "total"
        ],
        "additionalProperties": false
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
  },
  "annotations": {
    "readOnlyHint": true,
    "destructiveHint": false,
    "idempotentHint": true,
    "openWorldHint": true
  }
}
```

## 23. `tongji.course.summary` — 查询课程 AI 总结

查询已有 AI 课程总结、关键词、优缺点和生成时间。check 固定为 true；不触发生成或刷新。data.status 保留上游状态，总结缺失时请参考原始课评。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "courseId": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "description": "课程记录 ID，来自课程搜索结果的 id。"
      },
      "check": {
        "type": "boolean",
        "const": true,
        "default": true,
        "description": "固定为 true，仅查询已有总结，不触发刷新生成。"
      }
    },
    "required": [
      "courseId"
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
        "description": "查询状态；empty 表示成功但当前没有可展示数据。"
      },
      "data": {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "description": "总结状态，例如 cached；其他上游状态原样保留。"
          },
          "summary": {
            "anyOf": [
              {
                "type": "object",
                "properties": {
                  "consensus": {
                    "type": "string",
                    "description": "推荐倾向，例如 recommend；保留开放枚举。"
                  },
                  "keywords": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "评价关键词。"
                  },
                  "pros": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "总结出的优点。"
                  },
                  "cons": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "总结出的缺点或注意事项。"
                  },
                  "representativeReviews": {
                    "type": "array",
                    "items": {},
                    "description": "代表性评价；上游尚未声明元素结构。"
                  }
                },
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ],
            "description": "已有总结；不可用时可能缺失或为 null。"
          },
          "generatedAt": {
            "type": "string",
            "description": "生成时间，ISO 8601 字符串。"
          },
          "model": {
            "type": "string",
            "description": "生成模型标识。"
          }
        },
        "required": [
          "status"
        ],
        "additionalProperties": false
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
  },
  "annotations": {
    "readOnlyHint": true,
    "destructiveHint": false,
    "idempotentHint": true,
    "openWorldHint": true
  }
}
```

## 24. `tongji.course.search` — 查询课程目录

查询 YourTJ 课程，支持关键词、教师、院系、学期和校区筛选。使用 page/size 分页，hasNext 为 true 时继续下一页。结果中的 id 可用于详情、评价和总结查询。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "keyword": {
        "type": "string",
        "description": "课程名称、代码或教师搜索关键词。"
      },
      "instructor": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "教师筛选，支持多个名称。"
      },
      "department": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "院系筛选，支持多个院系。"
      },
      "term": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "学期筛选，例如 2026-2027-1。"
      },
      "campus": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "校区筛选，支持多个校区。"
      },
      "onlyWithReviews": {
        "type": "number",
        "const": 1,
        "description": "传 1 仅查询有评价的课程，不筛选时省略。"
      },
      "sortBy": {
        "type": "string",
        "const": "rating",
        "description": "按评分排序；省略时采用上游默认排序。"
      },
      "page": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "default": 1,
        "description": "页码，从 1 开始。"
      },
      "size": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "default": 20,
        "description": "每页条数，默认 20。"
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
        "description": "查询状态；empty 表示成功但当前没有可展示数据。"
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
                  "type": "integer",
                  "description": "课程记录 ID。"
                },
                "primaryCode": {
                  "type": "string",
                  "description": "主课程代码，保留前导零。"
                },
                "name": {
                  "type": "string",
                  "description": "课程名称。"
                },
                "department": {
                  "type": "string",
                  "description": "开课院系，可能为空字符串。"
                },
                "ratingAvg": {
                  "type": "number",
                  "description": "课程平均评分，无评分时可能省略。"
                },
                "reviewCount": {
                  "type": "integer",
                  "description": "评价数量，无评价时可能省略。"
                },
                "teacherName": {
                  "type": "string",
                  "description": "关联教师姓名，不代表全部开课教师。"
                },
                "creditX10": {
                  "type": "integer",
                  "description": "学分乘以 10，例如 50 表示 5 学分。"
                },
                "teacherId": {
                  "type": "integer",
                  "description": "关联教师 ID。"
                },
                "aliases": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "其他课程代码或别名。"
                },
                "instructors": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "关联开课教师列表。"
                },
                "recentTerms": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "最近开课学期列表。"
                }
              },
              "required": [
                "id",
                "primaryCode",
                "name"
              ],
              "additionalProperties": false
            },
            "description": "当前页课程列表。"
          },
          "page": {
            "type": "integer",
            "exclusiveMinimum": 0,
            "description": "当前页码。"
          },
          "size": {
            "type": "integer",
            "exclusiveMinimum": 0,
            "description": "当前每页条数。"
          },
          "total": {
            "type": "integer",
            "minimum": 0,
            "description": "符合筛选条件的课程总数。"
          },
          "hasNext": {
            "type": "boolean",
            "description": "是否存在下一页；为 true 时保持筛选条件并将 page 加一。"
          }
        },
        "required": [
          "list",
          "page",
          "size",
          "total",
          "hasNext"
        ],
        "additionalProperties": false
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
  },
  "annotations": {
    "readOnlyHint": true,
    "destructiveHint": false,
    "idempotentHint": true,
    "openWorldHint": true
  }
}
```

## 25. `tongji.course.calendar_list` — 查询学期列表

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

本地历史教师评价的数据来源和 HTTP 接口见 [历史教师评价](LEGACY_TEACHER_REVIEWS.md)。

## 26. `luckin.auth.send_sms_code` — 发送瑞幸登录验证码

向用户指定手机号发送瑞幸登录短信。仅在用户要求登录并同意发送验证码时调用，不能自动重试。不需要同济凭据或瑞幸登录 Cookie；CSRF 由服务端管理。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "mobile": {
        "type": "string",
        "pattern": "^\\d{5,15}$",
        "description": "接收瑞幸登录验证码的手机号，不含国家区号。"
      },
      "countryCode": {
        "type": "string",
        "pattern": "^[1-9]\\d{0,3}$",
        "default": "86",
        "description": "国家或地区电话区号，不含 +，默认 86；发送与登录时保持一致。"
      }
    },
    "required": [
      "mobile"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "const": "ok"
      },
      "data": {
        "type": "object",
        "properties": {
          "msg": {
            "type": "string",
            "description": "验证码发送结果。"
          },
          "remain": {
            "type": "integer",
            "minimum": 0,
            "description": "上游 remain 原值；时间单位尚未确认。"
          },
          "validate": {
            "type": "boolean",
            "description": "上游校验标志，不作为发送成功的判断条件。"
          }
        },
        "required": [
          "msg",
          "remain",
          "validate"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Luckin Coffee"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  },
  "annotations": {
    "readOnlyHint": false,
    "destructiveHint": false,
    "idempotentHint": false,
    "openWorldHint": true
  }
}
```

## 27. `luckin.auth.login` — 登录瑞幸并保存凭据

使用手机号和验证码登录瑞幸，获取 Token 并保存至当前同济用户。需要请求上下文中的同济 access_token；不返回 Token，失败不自动重试。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "mobile": {
        "type": "string",
        "pattern": "^\\d{5,15}$",
        "description": "接收瑞幸登录验证码的手机号，不含国家区号。"
      },
      "countryCode": {
        "type": "string",
        "pattern": "^[1-9]\\d{0,3}$",
        "default": "86",
        "description": "国家或地区电话区号，不含 +，默认 86；发送与登录时保持一致。"
      },
      "validateCode": {
        "type": "string",
        "pattern": "^\\d{1,16}$",
        "description": "用户收到的短信验证码，使用字符串保留前导零。"
      }
    },
    "required": [
      "mobile",
      "validateCode"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "const": "ok"
      },
      "data": {
        "type": "object",
        "properties": {
          "authenticated": {
            "type": "boolean",
            "const": true
          }
        },
        "required": [
          "authenticated"
        ],
        "additionalProperties": false
      },
      "source": {
        "type": "string",
        "const": "Luckin Coffee"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  },
  "annotations": {
    "readOnlyHint": false,
    "destructiveHint": false,
    "idempotentHint": false,
    "openWorldHint": true
  }
}
```

## 28. `luckin.auth.check` — 检查瑞幸登录状态

检查当前同济用户已保存的瑞幸 Token 是否有效。不接受参数；缺少凭据、身份无法识别、超时、限流和上游故障均返回 valid:false。false 不一定表示 Token 已失效。

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
      "valid": {
        "type": "boolean"
      }
    },
    "required": [
      "valid"
    ],
    "additionalProperties": false
  },
  "annotations": {
    "readOnlyHint": false,
    "destructiveHint": false,
    "idempotentHint": true,
    "openWorldHint": true
  }
}
```

## 29. `luckin.shop.search` — 查询瑞幸门店

按经纬度及可选门店名查询门店。经纬度必须来自用户提供或授权的位置。 使用当前同济用户已保存的瑞幸凭据，不接受 userId 或 Token。成功 data 保留上游 MCP content/structuredContent，业务 JSON 可能位于 content[].text。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "longitude": {
        "type": "number"
      },
      "latitude": {
        "type": "number"
      },
      "deptName": {
        "type": "string"
      }
    },
    "required": [
      "longitude",
      "latitude"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "const": "ok"
      },
      "data": {
        "type": "object",
        "properties": {
          "content": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string"
                },
                "text": {
                  "type": "string"
                }
              },
              "required": [
                "type"
              ],
              "additionalProperties": true
            }
          },
          "structuredContent": {
            "type": "object",
            "additionalProperties": {}
          },
          "isError": {
            "type": "boolean"
          }
        },
        "required": [
          "content"
        ],
        "additionalProperties": true
      },
      "source": {
        "type": "string",
        "const": "Luckin Coffee"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  },
  "annotations": {
    "readOnlyHint": true,
    "destructiveHint": false,
    "idempotentHint": true,
    "openWorldHint": true
  }
}
```

## 30. `luckin.product.search` — 搜索瑞幸商品

在用户选定的门店搜索商品。 使用当前同济用户已保存的瑞幸凭据，不接受 userId 或 Token。成功 data 保留上游 MCP content/structuredContent，业务 JSON 可能位于 content[].text。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "deptId": {
        "type": "integer",
        "minimum": -9007199254740991,
        "maximum": 9007199254740991
      },
      "query": {
        "type": "string"
      }
    },
    "required": [
      "deptId",
      "query"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "const": "ok"
      },
      "data": {
        "type": "object",
        "properties": {
          "content": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string"
                },
                "text": {
                  "type": "string"
                }
              },
              "required": [
                "type"
              ],
              "additionalProperties": true
            }
          },
          "structuredContent": {
            "type": "object",
            "additionalProperties": {}
          },
          "isError": {
            "type": "boolean"
          }
        },
        "required": [
          "content"
        ],
        "additionalProperties": true
      },
      "source": {
        "type": "string",
        "const": "Luckin Coffee"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  },
  "annotations": {
    "readOnlyHint": true,
    "destructiveHint": false,
    "idempotentHint": true,
    "openWorldHint": true
  }
}
```

## 31. `luckin.product.detail` — 查询瑞幸商品详情

获取选定商品的可选规格和属性，不猜测规格 ID。 使用当前同济用户已保存的瑞幸凭据，不接受 userId 或 Token。成功 data 保留上游 MCP content/structuredContent，业务 JSON 可能位于 content[].text。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "deptId": {
        "type": "integer",
        "minimum": -9007199254740991,
        "maximum": 9007199254740991
      },
      "productId": {
        "$ref": "#/properties/deptId"
      }
    },
    "required": [
      "deptId",
      "productId"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "const": "ok"
      },
      "data": {
        "type": "object",
        "properties": {
          "content": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string"
                },
                "text": {
                  "type": "string"
                }
              },
              "required": [
                "type"
              ],
              "additionalProperties": true
            }
          },
          "structuredContent": {
            "type": "object",
            "additionalProperties": {}
          },
          "isError": {
            "type": "boolean"
          }
        },
        "required": [
          "content"
        ],
        "additionalProperties": true
      },
      "source": {
        "type": "string",
        "const": "Luckin Coffee"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  },
  "annotations": {
    "readOnlyHint": true,
    "destructiveHint": false,
    "idempotentHint": true,
    "openWorldHint": true
  }
}
```

## 32. `luckin.product.switch` — 切换瑞幸商品规格

根据商品详情提供的属性切换目标 SKU。此操作不创建订单。 使用当前同济用户已保存的瑞幸凭据，不接受 userId 或 Token。成功 data 保留上游 MCP content/structuredContent，业务 JSON 可能位于 content[].text。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "deptId": {
        "type": "integer",
        "minimum": -9007199254740991,
        "maximum": 9007199254740991
      },
      "productId": {
        "$ref": "#/properties/deptId"
      },
      "skuCode": {
        "type": "string"
      },
      "amount": {
        "$ref": "#/properties/deptId"
      },
      "attrOperationParam": {
        "type": "object",
        "properties": {
          "attributeId": {
            "$ref": "#/properties/deptId"
          },
          "subAttr": {
            "type": "object",
            "properties": {
              "attributeId": {
                "$ref": "#/properties/deptId"
              },
              "operation": {
                "$ref": "#/properties/deptId"
              }
            },
            "required": [
              "attributeId",
              "operation"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "attributeId",
          "subAttr"
        ],
        "additionalProperties": false
      }
    },
    "required": [
      "deptId",
      "productId",
      "skuCode",
      "amount",
      "attrOperationParam"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "const": "ok"
      },
      "data": {
        "type": "object",
        "properties": {
          "content": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string"
                },
                "text": {
                  "type": "string"
                }
              },
              "required": [
                "type"
              ],
              "additionalProperties": true
            }
          },
          "structuredContent": {
            "type": "object",
            "additionalProperties": {}
          },
          "isError": {
            "type": "boolean"
          }
        },
        "required": [
          "content"
        ],
        "additionalProperties": true
      },
      "source": {
        "type": "string",
        "const": "Luckin Coffee"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  },
  "annotations": {
    "readOnlyHint": true,
    "destructiveHint": false,
    "idempotentHint": true,
    "openWorldHint": true
  }
}
```

## 33. `luckin.order.preview` — 预览瑞幸订单

预览指定门店商品的价格和优惠。创建前必须预览，保留返回的 couponCodeList。 使用当前同济用户已保存的瑞幸凭据，不接受 userId 或 Token。成功 data 保留上游 MCP content/structuredContent，业务 JSON 可能位于 content[].text。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "deptId": {
        "type": "integer",
        "minimum": -9007199254740991,
        "maximum": 9007199254740991
      },
      "productList": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "amount": {
              "$ref": "#/properties/deptId"
            },
            "productId": {
              "$ref": "#/properties/deptId"
            },
            "skuCode": {
              "type": "string"
            }
          },
          "required": [
            "amount",
            "productId",
            "skuCode"
          ],
          "additionalProperties": false
        }
      }
    },
    "required": [
      "deptId",
      "productList"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "const": "ok"
      },
      "data": {
        "type": "object",
        "properties": {
          "content": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string"
                },
                "text": {
                  "type": "string"
                }
              },
              "required": [
                "type"
              ],
              "additionalProperties": true
            }
          },
          "structuredContent": {
            "type": "object",
            "additionalProperties": {}
          },
          "isError": {
            "type": "boolean"
          }
        },
        "required": [
          "content"
        ],
        "additionalProperties": true
      },
      "source": {
        "type": "string",
        "const": "Luckin Coffee"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  },
  "annotations": {
    "readOnlyHint": true,
    "destructiveHint": false,
    "idempotentHint": true,
    "openWorldHint": true
  }
}
```

## 34. `luckin.order.create` — 创建瑞幸订单

创建真实订单。仅在用户确认门店、规格、数量及价格条件且订单预览通过后调用；非空优惠券列表原样传入。超时不得自动重试。仅展示支付二维码 payOrderQrCodeUrl，订单号优先使用字符串 orderIdStr。 使用当前同济用户已保存的瑞幸凭据，不接受 userId 或 Token。成功 data 保留上游 MCP content/structuredContent，业务 JSON 可能位于 content[].text。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "deptId": {
        "type": "integer",
        "minimum": -9007199254740991,
        "maximum": 9007199254740991
      },
      "productList": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "amount": {
              "$ref": "#/properties/deptId"
            },
            "productId": {
              "$ref": "#/properties/deptId"
            },
            "skuCode": {
              "type": "string"
            }
          },
          "required": [
            "amount",
            "productId",
            "skuCode"
          ],
          "additionalProperties": false
        }
      },
      "longitude": {
        "type": "number"
      },
      "latitude": {
        "type": "number"
      },
      "couponCodeList": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "remark": {
        "type": "string"
      }
    },
    "required": [
      "deptId",
      "productList",
      "longitude",
      "latitude"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "const": "ok"
      },
      "data": {
        "type": "object",
        "properties": {
          "content": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string"
                },
                "text": {
                  "type": "string"
                }
              },
              "required": [
                "type"
              ],
              "additionalProperties": true
            }
          },
          "structuredContent": {
            "type": "object",
            "additionalProperties": {}
          },
          "isError": {
            "type": "boolean"
          }
        },
        "required": [
          "content"
        ],
        "additionalProperties": true
      },
      "source": {
        "type": "string",
        "const": "Luckin Coffee"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  },
  "annotations": {
    "readOnlyHint": false,
    "destructiveHint": true,
    "idempotentHint": false,
    "openWorldHint": true
  }
}
```

## 35. `luckin.order.get` — 查询瑞幸订单

查询用户指定订单的支付状态与取餐信息。orderId 必须为字符串，只有查询确认已支付后才展示取餐码。 使用当前同济用户已保存的瑞幸凭据，不接受 userId 或 Token。成功 data 保留上游 MCP content/structuredContent，业务 JSON 可能位于 content[].text。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "orderId": {
        "type": "string"
      }
    },
    "required": [
      "orderId"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "const": "ok"
      },
      "data": {
        "type": "object",
        "properties": {
          "content": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string"
                },
                "text": {
                  "type": "string"
                }
              },
              "required": [
                "type"
              ],
              "additionalProperties": true
            }
          },
          "structuredContent": {
            "type": "object",
            "additionalProperties": {}
          },
          "isError": {
            "type": "boolean"
          }
        },
        "required": [
          "content"
        ],
        "additionalProperties": true
      },
      "source": {
        "type": "string",
        "const": "Luckin Coffee"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  },
  "annotations": {
    "readOnlyHint": true,
    "destructiveHint": false,
    "idempotentHint": true,
    "openWorldHint": true
  }
}
```

## 36. `luckin.order.cancel` — 取消瑞幸订单

取消用户明确要求取消的订单，orderId 必须为字符串。操作结果不明时先查单，不直接重复取消。 使用当前同济用户已保存的瑞幸凭据，不接受 userId 或 Token。成功 data 保留上游 MCP content/structuredContent，业务 JSON 可能位于 content[].text。

### Schema

```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "orderId": {
        "type": "string"
      }
    },
    "required": [
      "orderId"
    ]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "const": "ok"
      },
      "data": {
        "type": "object",
        "properties": {
          "content": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string"
                },
                "text": {
                  "type": "string"
                }
              },
              "required": [
                "type"
              ],
              "additionalProperties": true
            }
          },
          "structuredContent": {
            "type": "object",
            "additionalProperties": {}
          },
          "isError": {
            "type": "boolean"
          }
        },
        "required": [
          "content"
        ],
        "additionalProperties": true
      },
      "source": {
        "type": "string",
        "const": "Luckin Coffee"
      }
    },
    "required": [
      "status",
      "data",
      "source"
    ],
    "additionalProperties": false
  },
  "annotations": {
    "readOnlyHint": false,
    "destructiveHint": true,
    "idempotentHint": false,
    "openWorldHint": true
  }
}
```

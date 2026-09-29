/**
 * GLaDOS Auto Check-in for Quantumult X
 * Version: 2.0.0
 *
 * Based on:
 * https://github.com/Walvez/glados-auto-checkin
 *
 * Original project:
 * Copyright (c) 2026 Walvez
 * Licensed under the MIT License.
 *
 * Modified for personal Quantumult X usage.
 *
 * 功能：
 * 1. Safari 登录 GLaDOS 时自动保存 Cookie / Authorization
 * 2. 定时 / 手动自动签到
 * 3. 查询实时积分、账户和剩余天数
 * 4. 当天成功后避免重复签到
 * 5. 详细 Quantumult X Console 日志
 * 6. 网络异常 / 429 / 5xx 自动重试一次
 *
 * 安全：
 * - Cookie / Authorization 仅保存在 Quantumult X $prefs
 * - 日志绝不输出 Cookie / Authorization 原文
 * - 请求仅允许发送到 GLaDOS 白名单域名
 * - 不包含第三方统计、Webhook、远程动态代码
 */

const SCRIPT_NAME = "GLaDOS";
const SCRIPT_VERSION = "2.0.0";

const COOKIE_KEY = "glados_cookie";
const AUTH_KEY = "glados_authorization";
const ORIGIN_KEY = "glados_origin";
const LAST_CHECKIN_KEY = "glados_last_checkin";
const LAST_SUCCESS_TIME_KEY = "glados_last_success_time";

const DEFAULT_ORIGIN = "https://glados.rocks";

const ALLOWED_ORIGINS = [
  "https://glados.network",
  "https://glados.rocks",
  "https://glados.one",
  "https://glados.space",
  "https://glados.cloud",
  "https://glados.vip",
  "https://glados-facility.com"
];

const MAX_REQUEST_ATTEMPTS = 2;
const RETRY_DELAY = 1500;

let finished = false;

/* =========================================================
 * 日志
 * ========================================================= */

function log(message = "") {
  console.log(message);
}

function info(message) {
  log(`[INFO] ${message}`);
}

function success(message) {
  log(`[OK] ${message}`);
}

function warn(message) {
  log(`[WARN] ${message}`);
}

function errorLog(message) {
  log(`[ERROR] ${message}`);
}

function separator() {
  log("========================================");
}

function startLog(mode) {
  separator();
  log(`       ${SCRIPT_NAME} 自动签到`);
  separator();
  info(`脚本版本：${SCRIPT_VERSION}`);
  info(`运行模式：${mode}`);
  info(`当前时间：${formatDateTime(new Date())}`);
}

function endLog() {
  separator();
  log("              执行结束");
  separator();
}

/* =========================================================
 * QX 基础方法
 * ========================================================= */

function done(value) {
  if (finished) return;

  finished = true;
  endLog();
  $done(value);
}

function notify(subtitle, message) {
  $notify(
    SCRIPT_NAME,
    subtitle || "",
    message || ""
  );
}

function get(key) {
  return $prefs.valueForKey(key);
}

function set(value, key) {
  return $prefs.setValueForKey(value, key);
}

function getHeader(headers, name) {
  const target = name.toLowerCase();

  const key = Object.keys(headers || {}).find(
    item => item.toLowerCase() === target
  );

  return key ? headers[key] : "";
}

/* =========================================================
 * 时间
 * ========================================================= */

function pad(value) {
  return String(value).padStart(2, "0");
}

function today() {
  const date = new Date();

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-");
}

function formatDateTime(date) {
  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())} ` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}:` +
    `${pad(date.getSeconds())}`
  );
}

/* =========================================================
 * Origin 安全检查
 * ========================================================= */

function getOrigin(url) {
  try {
    const match = String(url || "").match(
      /^https:\/\/(glados\.(?:network|rocks|one|space|cloud|vip)|glados-facility\.com)(?:\/|$)/i
    );

    if (!match) {
      return "";
    }

    const origin = `https://${match[1].toLowerCase()}`;

    return ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "";

  } catch (_) {
    return "";
  }
}

function getStoredOrigin() {
  const origin = get(ORIGIN_KEY);

  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }

  warn(
    origin
      ? `保存的域名不在白名单，回退到 ${DEFAULT_ORIGIN}`
      : `未保存域名，使用默认域名 ${DEFAULT_ORIGIN}`
  );

  return DEFAULT_ORIGIN;
}

/* =========================================================
 * 数据处理
 * ========================================================= */

function maskEmail(email) {
  const text = String(email || "");

  const index = text.lastIndexOf("@");

  if (index <= 0) {
    return text || "未知账户";
  }

  const name = text.slice(0, index);
  const domain = text.slice(index + 1);

  if (name.length <= 2) {
    return `***@${domain}`;
  }

  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}

function formatPoints(value) {
  return String(value)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "");
}

function parseJson(body) {
  try {
    const result = JSON.parse(body || "");

    if (
      !result ||
      typeof result !== "object" ||
      Array.isArray(result)
    ) {
      throw new Error();
    }

    return result;

  } catch (_) {
    throw new Error("服务器返回数据无法解析");
  }
}

/* =========================================================
 * 网络请求 + 重试
 * ========================================================= */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(options, name, retry = true) {
  const maxAttempts = retry
    ? MAX_REQUEST_ATTEMPTS
    : 1;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      info(
        `${name}：${options.method || "GET"} ${options.url}`
      );

      if (attempt > 1) {
        info(`第 ${attempt} 次尝试`);
      }

      const response =
        await $task.fetch(options);

      const status =
        Number(
          response.statusCode ||
          response.status
        ) || 0;

      info(`${name} HTTP 状态：${status}`);

      if (
        status === 401 ||
        status === 403
      ) {
        const err =
          new Error("登录凭据已失效");

        err.status = status;

        throw err;
      }

      if (
        status === 429
      ) {
        const err =
          new Error("请求过于频繁（HTTP 429）");

        err.status = status;

        throw err;
      }

      if (
        status >= 500
      ) {
        const err =
          new Error(
            `GLaDOS 服务暂时异常（HTTP ${status}）`
          );

        err.status = status;

        throw err;
      }

      if (
        status < 200 ||
        status >= 300
      ) {
        const err =
          new Error(`HTTP ${status}`);

        err.status = status;

        throw err;
      }

      const result =
        parseJson(response.body);

      success(`${name}请求成功`);

      return result;

    } catch (err) {
      const status =
        Number(err.status) || 0;

      const canRetry =
        attempt < maxAttempts &&
        (
          !status ||
          status === 429 ||
          status >= 500
        );

      if (!canRetry) {
        throw err;
      }

      warn(
        `${name}失败：${err.message || err}`
      );

      warn(
        `${RETRY_DELAY / 1000} 秒后重试`
      );

      await sleep(RETRY_DELAY);
    }
  }

  throw new Error(`${name}请求失败`);
}

/* =========================================================
 * 捕获登录凭据
 * ========================================================= */

function captureCredentials() {
  startLog("登录凭据捕获");

  if (
    !$request ||
    $request.method === "OPTIONS"
  ) {
    info("忽略 OPTIONS 请求");
    return done();
  }

  const origin =
    getOrigin($request.url);

  if (!origin) {
    warn("当前请求不属于 GLaDOS 白名单");
    return done();
  }

  info(`来源域名：${origin}`);

  const cookie =
    getHeader(
      $request.headers,
      "Cookie"
    );

  const authorization =
    getHeader(
      $request.headers,
      "Authorization"
    );

  /*
   * 只记录“是否存在”，
   * 永远不要输出凭据原文。
   */
  info(
    `Cookie：${cookie ? "已检测到 ✓" : "未检测到 ✗"}`
  );

  info(
    `Authorization：${
      authorization
        ? "已检测到 ✓"
        : "未检测到 ✗"
    }`
  );

  if (
    !cookie &&
    !authorization
  ) {
    warn("当前请求没有可保存的登录凭据");
    return done();
  }

  const oldCookie =
    get(COOKIE_KEY);

  const oldAuthorization =
    get(AUTH_KEY);

  let changed = false;

  if (cookie) {
    set(
      cookie,
      COOKIE_KEY
    );

    if (
      cookie !== oldCookie
    ) {
      changed = true;
    }
  }

  if (authorization) {
    set(
      authorization,
      AUTH_KEY
    );

    if (
      authorization !==
      oldAuthorization
    ) {
      changed = true;
    }
  }

  set(
    origin,
    ORIGIN_KEY
  );

  success("登录凭据已保存到 Quantumult X 本地");
  success(`登录域名：${origin}`);

  if (changed) {
    notify(
      "登录凭据更新成功",
      [
        `域名：${origin.replace("https://", "")}`,
        `Cookie：${cookie ? "✓" : "未获取"}`,
        `Authorization：${authorization ? "✓" : "未获取"}`,
        "",
        "凭据仅保存在 Quantumult X 本地"
      ].join("\n")
    );
  } else {
    info("凭据与本地保存内容一致，无需通知");
  }

  done();
}

/* =========================================================
 * 签到结果识别
 * ========================================================= */

function isLoginError(result) {
  const message =
    String(
      result &&
      result.message
        ? result.message
        : ""
    ).toLowerCase();

  const code =
    Number(
      result &&
      result.code
    );

  return (
    !result ||
    code === -2 ||
    message.includes("token error") ||
    message.includes("not login") ||
    message.includes("not logged") ||
    message.includes("未登录")
  );
}

function isAlreadyCheckedIn(result) {
  const message =
    String(
      result &&
      result.message
        ? result.message
        : ""
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const code =
    Number(
      result &&
      result.code
    );

  return (
    code === 1 ||
    message.includes("please try tomorrow") ||
    message.includes("today's observation logged") ||
    message.includes("return tomorrow") ||
    message.includes("already check") ||
    message.includes("今日已签到") ||
    message.includes("已经签到") ||
    message.includes("明天再试")
  );
}

function findCheckinRecord(result) {
  const records =
    Array.isArray(
      result &&
      result.list
    )
      ? result.list.filter(
          item =>
            item &&
            typeof item === "object"
        )
      : [];

  const checkinRecords =
    records.filter(
      item =>
        item.business ===
        "system:checkin"
    );

  if (
    checkinRecords.length > 0
  ) {
    return (
      checkinRecords.find(
        item =>
          item.detail === today()
      ) ||
      checkinRecords[0]
    );
  }

  /*
   * 旧接口兼容：
   * 如果所有记录都没有 business，
   * 才允许回退第一条。
   *
   * 避免把兑换积分记录误认为签到。
   */
  const hasTypedRecord =
    records.some(
      item => item.business
    );

  return hasTypedRecord
    ? undefined
    : records[0];
}

function classifyCheckin(result) {
  if (isLoginError(result)) {
    return {
      kind: "login_expired",
      message:
        result.message ||
        "登录状态已失效"
    };
  }

  const record =
    findCheckinRecord(result);

  if (
    isAlreadyCheckedIn(result)
  ) {
    return {
      kind: "already",
      record
    };
  }

  if (
    record &&
    record.change !== undefined
  ) {
    return {
      kind: "success",
      record
    };
  }

  const code =
    Number(result.code);

  const message =
    String(
      result.message || ""
    ).trim();

  if (
    code === 0 &&
    /success|成功/i.test(message)
  ) {
    return {
      kind: "success",
      record
    };
  }

  throw new Error(
    `签到接口返回异常${
      message
        ? `：${message}`
        : ""
    }`
  );
}

/* =========================================================
 * 查询实时积分
 * ========================================================= */

async function fetchPoints(
  origin,
  headers
) {
  log("");
  log("[2/3] 查询实时积分");

  try {
    const result =
      await request(
        {
          url:
            `${origin}/api/user/points`,
          method: "GET",
          headers
        },
        "积分查询",
        false
      );

    if (
      Number(result.code) === 0 &&
      result.points !== undefined
    ) {
      const points =
        formatPoints(
          result.points
        );

      success(
        `当前积分：${points}`
      );

      return points;
    }

    warn("积分接口未返回有效积分");

  } catch (err) {
    warn(
      `积分查询失败：${err.message || err}`
    );
  }

  return null;
}

/* =========================================================
 * 查询账户状态
 * ========================================================= */

async function fetchStatus(
  origin,
  headers
) {
  log("");
  log("[3/3] 查询账户状态");

  try {
    const result =
      await request(
        {
          url:
            `${origin}/api/user/status`,
          method: "GET",
          headers
        },
        "账户状态",
        false
      );

    if (
      Number(result.code) !== 0 ||
      !result.data
    ) {
      warn(
        `账户状态无有效数据${
          result.message
            ? `：${result.message}`
            : ""
        }`
      );

      return {};
    }

    const email =
      result.data.email
        ? maskEmail(
            result.data.email
          )
        : null;

    const days =
      Number.parseInt(
        result.data.leftDays,
        10
      );

    if (email) {
      success(
        `账户：${email}`
      );
    }

    if (
      Number.isFinite(days)
    ) {
      success(
        `剩余天数：${days} 天`
      );
    }

    return {
      email,
      days:
        Number.isFinite(days)
          ? days
          : null
    };

  } catch (err) {
    warn(
      `账户状态查询失败：${err.message || err}`
    );

    return {};
  }
}

/* =========================================================
 * 自动签到
 * ========================================================= */

async function checkin() {
  startLog("定时 / 手动签到");

  const date = today();

  info(`签到日期：${date}`);

  /*
   * 本地防重复
   */
  const lastCheckin =
    get(LAST_CHECKIN_KEY);

  if (
    lastCheckin === date
  ) {
    const lastSuccessTime =
      get(
        LAST_SUCCESS_TIME_KEY
      );

    success("检测到今天已经签到成功");

    if (lastSuccessTime) {
      info(
        `上次成功时间：${lastSuccessTime}`
      );
    }

    notify(
      "今日已完成",
      [
        "今日已经签到，无需重复执行",
        lastSuccessTime
          ? `上次成功：${lastSuccessTime}`
          : ""
      ]
        .filter(Boolean)
        .join("\n")
    );

    return done({
      status: "skipped",
      reason:
        "already_succeeded_today",
      version:
        SCRIPT_VERSION
    });
  }

  /*
   * 获取本地凭据
   */
  log("");
  info("开始检查本地登录凭据");

  const cookie =
    get(COOKIE_KEY);

  const authorization =
    get(AUTH_KEY);

  const origin =
    getStoredOrigin();

  info(
    `Cookie：${cookie ? "已保存 ✓" : "不存在 ✗"}`
  );

  info(
    `Authorization：${
      authorization
        ? "已保存 ✓"
        : "不存在 ✗"
    }`
  );

  info(
    `使用域名：${origin}`
  );

  if (
    !cookie &&
    !authorization
  ) {
    errorLog("没有找到任何登录凭据");

    notify(
      "需要重新登录",
      [
        "没有找到 GLaDOS 登录凭据",
        "",
        "请在 Safari 登录 GLaDOS",
        "并刷新一次页面后重新执行"
      ].join("\n")
    );

    return done({
      status: "needs_cookie",
      version: SCRIPT_VERSION
    });
  }

  const headers = {
    Accept:
      "application/json, text/plain, */*",

    Origin:
      origin,

    Cookie:
      cookie || "",

    Authorization:
      authorization || "",

    "Content-Type":
      "application/json;charset=utf-8",

    "User-Agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
  };

  try {
    /*
     * 1/3 签到
     */
    log("");
    log("[1/3] 执行 GLaDOS 签到");

    const result =
      await request(
        {
          url:
            `${origin}/api/user/checkin`,

          method: "POST",

          headers,

          body:
            JSON.stringify({
              token:
                origin.replace(
                  "https://",
                  ""
                )
            })
        },
        "签到"
      );

    info(
      `API code：${result.code}`
    );

    if (result.message) {
      info(
        `API message：${result.message}`
      );
    }

    const classified =
      classifyCheckin(result);

    if (
      classified.kind ===
      "login_expired"
    ) {
      throw new Error(
        "登录凭据已失效，请重新登录 GLaDOS"
      );
    }

    const already =
      classified.kind ===
      "already";

    if (already) {
      success("服务器确认：今日已经签到");
    } else {
      success("服务器确认：签到成功");
    }

    let earned = null;

    if (
      classified.record &&
      classified.record.change !== undefined
    ) {
      earned =
        formatPoints(
          classified.record.change
        );

      info(
        `本次签到积分：${earned}`
      );
    }

    /*
     * 2/3 实时积分
     */
    const points =
      await fetchPoints(
        origin,
        headers
      );

    /*
     * 3/3 账户状态
     */
    const account =
      await fetchStatus(
        origin,
        headers
      );

    /*
     * 三个步骤结束后再写成功日期。
     *
     * 注意：
     * 即使积分/状态查询失败，
     * 只要签到已经被服务器确认，
     * 仍然属于签到成功。
     */
    const successTime =
      formatDateTime(
        new Date()
      );

    set(
      date,
      LAST_CHECKIN_KEY
    );

    set(
      successTime,
      LAST_SUCCESS_TIME_KEY
    );

    success(
      `本地成功状态已记录：${date}`
    );

    /*
     * 最终通知
     */
    const body = [];

    body.push(
      already
        ? "今日已签到 ✓"
        : "签到成功 ✓"
    );

    if (
      earned !== null
    ) {
      body.push(
        `本次获得：${earned} 积分`
      );
    }

    if (
      points !== null
    ) {
      body.push(
        `当前积分：${points}`
      );
    }

    if (
      account.days !== null &&
      account.days !== undefined
    ) {
      body.push(
        `剩余时间：${account.days} 天`
      );
    }

    body.push(
      `节点：${origin.replace("https://", "")}`
    );

    notify(
      account.email
        ? `账户：${account.email}`
        : (
            already
              ? "今日已签到"
              : "签到成功"
          ),
      body.join("\n")
    );

    success("签到流程全部完成");

    return done({
      status:
        already
          ? "already_checked"
          : "ok",

      version:
        SCRIPT_VERSION,

      points,

      remainingDays:
        account.days ??
        null
    });

  } catch (err) {
    const message =
      err.message ||
      String(err);

    errorLog(
      `签到失败：${message}`
    );

    /*
     * 登录失效时给出明确操作提示。
     */
    if (
      message.includes(
        "登录凭据已失效"
      )
    ) {
      notify(
        "登录凭据已失效",
        [
          "GLaDOS Cookie / Authorization 已失效",
          "",
          "请执行：",
          "1. 打开 Safari",
          "2. 重新登录 GLaDOS",
          "3. 刷新页面",
          "4. 收到“登录凭据更新成功”后重新签到"
        ].join("\n")
      );

      return done({
        status:
          "needs_cookie",

        version:
          SCRIPT_VERSION
      });
    }

    notify(
      "签到失败",
      [
        `原因：${message}`,
        "",
        "可稍后手动重新执行 GLaDOS 签到"
      ].join("\n")
    );

    return done({
      status:
        "checkin_error",

      error:
        message,

      version:
        SCRIPT_VERSION
    });
  }
}

/* =========================================================
 * QX 执行入口
 * ========================================================= */

if (
  typeof $request !==
  "undefined"
) {
  captureCredentials();
} else {
  checkin();
}

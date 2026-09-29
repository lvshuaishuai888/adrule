/**
 * GLaDOS Auto Check-in for Quantumult X
 * QX 专用精简版
 *
 * 功能：
 * 1. Safari 登录 GLaDOS 时自动保存 Cookie / Authorization
 * 2. 定时自动签到
 * 3. 查询积分和剩余天数
 * 4. 当天签到成功后不重复签到
 *
 * 安全：
 * - 凭据仅保存在 Quantumult X $prefs
 * - 网络请求仅允许发送到下方 GLaDOS 白名单域名
 * - 不包含第三方统计、通知、Webhook
 * - 不动态加载任何远程代码
 */

const COOKIE_KEY = "glados_cookie";
const AUTH_KEY = "glados_authorization";
const ORIGIN_KEY = "glados_origin";
const LAST_CHECKIN_KEY = "glados_last_checkin";

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

function notify(subtitle, message) {
  $notify("GLaDOS", subtitle || "", message || "");
}

function get(key) {
  return $prefs.valueForKey(key);
}

function set(value, key) {
  return $prefs.setValueForKey(value, key);
}

function getHeader(headers, name) {
  const key = Object.keys(headers || {}).find(
    k => k.toLowerCase() === name.toLowerCase()
  );

  return key ? headers[key] : "";
}

function getOrigin(url) {
  try {
    const match = String(url).match(
      /^https:\/\/(glados\.(?:network|rocks|one|space|cloud|vip)|glados-facility\.com)(?:\/|$)/i
    );

    if (!match) return "";

    const origin = `https://${match[1].toLowerCase()}`;

    return ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "";

  } catch (_) {
    return "";
  }
}

function today() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function maskEmail(email) {
  if (!email || !email.includes("@")) {
    return email || "未知账户";
  }

  const [name, domain] = email.split("@");

  if (name.length <= 2) {
    return `***@${domain}`;
  }

  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}

function request(options) {
  return $task.fetch(options).then(response => {

    if (response.statusCode === 401 ||
        response.statusCode === 403) {
      throw new Error("登录凭据已失效");
    }

    if (response.statusCode < 200 ||
        response.statusCode >= 300) {
      throw new Error(`HTTP ${response.statusCode}`);
    }

    try {
      return JSON.parse(response.body);
    } catch (_) {
      throw new Error("服务器返回数据无法解析");
    }
  });
}

/* =========================
   获取登录凭据
   ========================= */

function captureCredentials() {

  if (!$request || $request.method === "OPTIONS") {
    return $done();
  }

  const cookie =
    getHeader($request.headers, "Cookie");

  const authorization =
    getHeader($request.headers, "Authorization");

  const origin =
    getOrigin($request.url);

  if (!origin) {
    return $done();
  }

  const oldCookie = get(COOKIE_KEY);
  const oldAuth = get(AUTH_KEY);

  if (cookie) {
    set(cookie, COOKIE_KEY);
  }

  if (authorization) {
    set(authorization, AUTH_KEY);
  }

  if (cookie || authorization) {
    set(origin, ORIGIN_KEY);
  }

  if (
    (cookie && cookie !== oldCookie) ||
    (authorization && authorization !== oldAuth)
  ) {
    notify("", "登录凭据获取成功");
  }

  $done();
}

/* =========================
   自动签到
   ========================= */

async function checkin() {

  const date = today();

  /*
   * 今天已经成功执行过签到，
   * 直接退出，避免重复请求。
   */
  if (get(LAST_CHECKIN_KEY) === date) {
    return $done();
  }

  const cookie = get(COOKIE_KEY);
  const authorization = get(AUTH_KEY);

  let origin = get(ORIGIN_KEY);

  if (!ALLOWED_ORIGINS.includes(origin)) {
    origin = DEFAULT_ORIGIN;
  }

  if (!cookie && !authorization) {

    notify(
      "",
      "没有找到登录凭据，请先在 Safari 登录 GLaDOS 并刷新页面"
    );

    return $done();
  }

  const headers = {
    Accept: "application/json, text/plain, */*",
    Origin: origin,
    Cookie: cookie || "",
    Authorization: authorization || "",
    "Content-Type": "application/json;charset=utf-8"
  };

  try {

    /* ---------- 签到 ---------- */

    const result = await request({
      url: `${origin}/api/user/checkin`,
      method: "POST",
      headers,
      body: JSON.stringify({
        token: origin.replace("https://", "")
      })
    });

    const message =
      String(result.message || "").toLowerCase();

    /*
     * 登录失效
     */
    if (
      Number(result.code) === -2 ||
      message.includes("token error") ||
      message.includes("not login")
    ) {
      throw new Error(
        "登录凭据已失效，请重新登录 GLaDOS"
      );
    }

    /*
     * 判断是否签到成功 / 今日已经签到
     */
    const success =
      Number(result.code) === 0 ||
      Number(result.code) === 1 ||
      message.includes("success") ||
      message.includes("tomorrow") ||
      message.includes("already");

    if (!success) {
      throw new Error(
        result.message || "签到接口返回异常"
      );
    }

    /*
     * 签到确认成功后记录日期
     */
    set(date, LAST_CHECKIN_KEY);


    /* ---------- 查询积分 ---------- */

    let pointsText = "";

    try {

      const points = await request({
        url: `${origin}/api/user/points`,
        method: "GET",
        headers
      });

      if (
        Number(points.code) === 0 &&
        points.points !== undefined
      ) {
        pointsText =
          `\n当前积分：${points.points}`;
      }

    } catch (_) {
      // 积分查询失败不影响签到结果
    }


    /* ---------- 查询账户 ---------- */

    let accountText = "";
    let daysText = "";

    try {

      const status = await request({
        url: `${origin}/api/user/status`,
        method: "GET",
        headers
      });

      if (
        Number(status.code) === 0 &&
        status.data
      ) {

        if (status.data.email) {
          accountText =
            `账户：${maskEmail(status.data.email)}`;
        }

        const days =
          Number.parseInt(
            status.data.leftDays,
            10
          );

        if (Number.isFinite(days)) {
          daysText =
            `\n剩余：${days} 天`;
        }
      }

    } catch (_) {
      // 状态查询失败不影响签到结果
    }


    /* ---------- 通知 ---------- */

    const already =
      Number(result.code) === 1 ||
      message.includes("tomorrow") ||
      message.includes("already");

    notify(
      accountText,
      `${already ? "今日已签到" : "签到成功"}${pointsText}${daysText}`
    );

  } catch (error) {

    notify(
      "",
      `签到失败：${error.message || error}`
    );
  }

  $done();
}


/* =========================
   QX 执行入口
   ========================= */

if (typeof $request !== "undefined") {
  captureCredentials();
} else {
  checkin();
}

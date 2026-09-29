# GLaDOS Auto Check-in for Quantumult X

个人使用的 **GLaDOS Quantumult X 自动签到脚本**。

支持登录凭据自动获取、定时签到、手动签到、积分及剩余天数查询、详细日志和
Quantumult X 通知。

> 本目录中的脚本基于开源项目 `Walvez/glados-auto-checkin`
> 修改，并针对个人 Quantumult X 使用场景进行了调整。

------------------------------------------------------------------------

## 📁 文件说明

``` text
glados/
├── README.md
├── LICENSE
├── glados.snippet
└── glados-checkin.js
```

  文件                  说明
  --------------------- ----------------------------------
  `README.md`           安装及使用说明
  `LICENSE`             原项目 MIT License
  `glados.snippet`      Quantumult X Rewrite / MitM 配置
  `glados-checkin.js`   GLaDOS 自动签到脚本

------------------------------------------------------------------------

## ✨ 功能

-   Safari 登录 GLaDOS 时自动获取登录凭据
-   自动保存 Cookie / Authorization
-   凭据仅保存在 Quantumult X 本地 `$prefs`
-   支持 Quantumult X 定时签到
-   支持手动执行签到
-   查询签到结果
-   查询当前积分
-   查询账户剩余天数
-   账户邮箱脱敏显示
-   当天成功后避免重复签到
-   网络异常、HTTP 429 / 5xx 自动重试
-   提供 Quantumult X 通知
-   提供详细运行日志
-   限制请求目标为 GLaDOS 白名单域名

------------------------------------------------------------------------

## 🔐 安全说明

Cookie / Authorization 等登录凭据：

-   仅保存在 Quantumult X `$prefs`
-   不写入 GitHub
-   日志不会输出完整 Cookie
-   日志不会输出完整 Authorization
-   不使用第三方 Webhook
-   不包含第三方统计
-   不动态加载远程 JavaScript
-   API 请求仅发送至脚本允许的 GLaDOS 域名

> **请勿将自己的
> Cookie、Authorization、完整请求头或其他个人凭据提交到公开仓库、Issue
> 或截图中。**

------------------------------------------------------------------------

## 🔧 安装配置

### 1. 添加 Rewrite 资源

在 Quantumult X 中进入：

``` text
设置 → 重写 → 引用
```

添加：

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/glados/glados.snippet
```

添加后启用该资源，并确保 Quantumult X 的 **Rewrite 与 MitM**
功能正常工作。

------------------------------------------------------------------------

### 2. 获取登录凭据

打开 Quantumult X 后，使用 Safari 登录 GLaDOS，例如：

``` text
https://glados.rocks
```

登录成功后刷新页面。

脚本会从 GLaDOS 请求中获取并保存可用的：

``` text
Cookie
Authorization
Origin
```

成功获取或更新凭据后，会收到 Quantumult X 通知。

凭据只保存在 Quantumult X 本地，不会上传到本仓库。

------------------------------------------------------------------------

### 3. 添加定时任务

在 Quantumult X 配置的 `[task_local]` 中添加：

``` ini
15 7 * * * https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/glados/glados-checkin.js, tag=GLaDOS签到, img-url=checkmark.circle.fill.system, enabled=true
```

该 Cron 表达式表示：

``` text
每天 07:15 执行 GLaDOS 签到
```

Quantumult X 需要保持相关功能正常运行。

------------------------------------------------------------------------

## ▶️ 手动执行

### 方法一：定时任务列表

在 Quantumult X 的定时任务页面找到：

``` text
GLaDOS签到
```

右滑对应任务后手动执行。

### 方法二：脚本页面

打开 `glados-checkin.js`，点击脚本查看页面右上角的：

``` text
▶︎
```

即可直接运行。

------------------------------------------------------------------------

## 📋 运行日志

脚本提供详细日志，手动运行时可以查看完整执行过程。

示例：

``` text
========================================
       GLaDOS 自动签到
========================================
[INFO] 脚本版本：...
[INFO] 运行模式：定时 / 手动签到
[INFO] 当前时间：...
[INFO] 开始检查本地登录凭据
[INFO] Cookie：已保存 ✓
[INFO] Authorization：已保存 ✓
[INFO] 使用域名：https://glados.rocks

[1/3] 执行 GLaDOS 签到
[OK] 签到请求成功

[2/3] 查询实时积分
[OK] 当前积分：...

[3/3] 查询账户状态
[OK] 账户：xx***x@example.com
[OK] 剩余天数：... 天

========================================
              执行结束
========================================
```

日志只会显示凭据是否存在，不会输出 Cookie / Authorization 原文。

------------------------------------------------------------------------

## 🔔 通知说明

签到完成后，Quantumult X 通知会根据接口返回情况展示：

``` text
签到状态
脱敏账户
本次签到积分
当前积分
剩余天数
当前 GLaDOS 域名
```

当天已经成功签到后再次手动执行时，脚本会提示今日已完成，避免重复请求签到接口。

如果 Cookie / Authorization 失效，则会提示重新登录 GLaDOS 获取凭据。

------------------------------------------------------------------------

## 🔄 凭据失效

如果出现登录凭据失效提示：

1.  确认 Quantumult X、Rewrite 和 MitM 正常启用。
2.  使用 Safari 重新打开 GLaDOS。
3.  重新登录账号。
4.  登录成功后刷新页面。
5.  等待 Quantumult X 提示凭据获取或更新成功。
6.  再次手动执行签到脚本。

无需把 Cookie 手动填写到 JavaScript 文件中。

------------------------------------------------------------------------

## 🧩 Raw 地址

### Rewrite / MitM 配置

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/glados/glados.snippet
```

### 自动签到脚本

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/glados/glados-checkin.js
```

------------------------------------------------------------------------

## ❓常见问题

### 为什么点击 ▶︎ 后显示 Logs？

这是 Quantumult X 的脚本手动执行/调试结果页面。

脚本中的 `console.log()` 内容会显示在 `Logs`
中，用于查看签到过程及排查问题。

### 为什么当天再次运行没有重复签到？

脚本会记录当天已经成功完成签到的状态。

当天再次执行时会直接提示今日已完成，从而避免重复请求签到接口。

### 为什么重新登录后才能继续签到？

GLaDOS 的 Cookie / Authorization 可能过期。

重新使用 Safari 登录并刷新页面后，Rewrite 脚本会重新捕获有效凭据并保存在
Quantumult X `$prefs` 中。

### GitHub 会保存我的 Cookie 吗？

不会。

正常使用时，Cookie / Authorization 存储在 Quantumult X 本地 `$prefs`
中，不会因为运行该脚本自动提交到 GitHub。

------------------------------------------------------------------------

## 📄 致谢与许可

GLaDOS 自动签到功能基于以下开源项目修改：

-   [Walvez /
    glados-auto-checkin](https://github.com/Walvez/glados-auto-checkin)

原项目基于 **MIT License** 开源。

``` text
Copyright (c) 2026 Walvez
```

本版本针对个人 Quantumult X
使用场景进行了调整，包括日志输出、通知信息、异常处理及相关配置优化。

原项目版权及许可声明予以保留。

完整 MIT License 请查看：

👉 **[LICENSE](./LICENSE)**

------------------------------------------------------------------------

## ⚠️ 注意事项

-   本脚本主要用于个人自用。
-   GLaDOS 接口、域名或页面结构发生变化时，脚本可能需要同步调整。
-   Quantumult X Rewrite / MitM 需要正确安装、配置并信任相关 CA 证书。
-   修改 GitHub 脚本后，Quantumult X
    可能仍存在远程资源缓存，可手动更新。
-   请勿公开自己的 Cookie / Authorization。
-   自动化脚本仅用于减少个人重复操作，请自行确认所使用服务的规则及要求。

------------------------------------------------------------------------

## Disclaimer

本脚本仅用于个人学习及自用。

使用脚本产生的相关影响请自行判断并承担相应责任。

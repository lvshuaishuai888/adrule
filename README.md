# AdRule

个人自用的 **Quantumult X / AdBlock 规则与自动化脚本仓库**。

用于集中维护日常使用的广告拦截规则、直连白名单以及 Quantumult X
自动化脚本，方便统一更新和订阅。

> \[!NOTE\]
> 本项目主要用于个人自用，规则和脚本会根据实际使用情况随时调整，不保证适用于其他网络环境或设备。

------------------------------------------------------------------------

## 📁 项目结构

``` text
adrule/
├── ad.txt
├── qx.conf
├── whitelist.list
└── glados/
    ├── glados.snippet
    └── glados-checkin.js
```

  文件                         说明
  ---------------------------- -----------------------------------------
  `ad.txt`                     AdBlock / ABP 格式广告拦截规则
  `qx.conf`                    Quantumult X Rewrite 自定义规则
  `whitelist.list`             Quantumult X 直连白名单
  `glados/glados.snippet`      GLaDOS Quantumult X Rewrite / MitM 配置
  `glados/glados-checkin.js`   GLaDOS 自动签到脚本

------------------------------------------------------------------------

## 🚫 自定义广告规则

用于维护个人使用过程中遇到的广告、弹窗及相关资源拦截规则。

### Quantumult X

远程资源地址：

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/qx.conf
```

可在 Quantumult X 的 Rewrite 远程资源中引用。

### AdBlock / ABP

订阅地址：

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/ad.txt
```

适用于支持 AdBlock / ABP 规则语法的客户端。

------------------------------------------------------------------------

## ✅ 直连白名单

用于处理被代理、去广告规则或其他规则误匹配的正常域名。

订阅地址：

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/whitelist.list
```

白名单内容根据个人实际使用情况维护。

------------------------------------------------------------------------

## 🤖 GLaDOS 自动签到

`glados` 目录用于 Quantumult X 下的 GLaDOS 自动签到。

### 功能

-   Safari 登录 GLaDOS 时自动获取登录凭据
-   自动保存 Cookie / Authorization
-   凭据仅保存在 Quantumult X 本地 `$prefs`
-   支持定时自动签到
-   支持手动执行签到
-   查询签到结果
-   查询当前积分
-   查询账户剩余天数
-   账户邮箱脱敏显示
-   当天成功后避免重复签到
-   网络异常、HTTP 429 / 5xx 自动重试
-   提供 Quantumult X 通知
-   提供详细运行日志，方便排查问题
-   限制请求目标为 GLaDOS 白名单域名

### 安全说明

脚本不会主动将登录凭据发送到第三方服务。

Cookie / Authorization：

-   仅保存在 Quantumult X `$prefs`
-   日志中不会输出完整 Cookie
-   日志中不会输出完整 Authorization
-   不使用第三方 Webhook
-   不包含第三方统计
-   不动态加载远程 JavaScript
-   API 请求仅发送至脚本允许的 GLaDOS 域名

> \[!IMPORTANT\] GitHub 中只保存脚本代码，不保存个人
> Cookie、Authorization 等登录信息。

------------------------------------------------------------------------

## 🔧 GLaDOS 配置

### 1. 添加 Rewrite 资源

在 Quantumult X 中进入：

``` text
设置 → 重写 → 引用
```

添加：

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/glados/glados.snippet
```

添加后启用该资源，并确保 Quantumult X 的 Rewrite 与 MitM 功能正常工作。

------------------------------------------------------------------------

### 2. 获取登录凭据

打开 Quantumult X 后，使用 Safari 登录 GLaDOS。

例如：

``` text
https://glados.rocks
```

登录成功后刷新页面。

脚本会从 GLaDOS 请求中读取并保存可用的：

``` text
Cookie
Authorization
Origin
```

凭据保存在 Quantumult X 本地，不会写入 GitHub。

成功获取或更新凭据后，会收到 Quantumult X 通知。

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

如果只希望工作日执行，可自行调整 Cron 表达式。

------------------------------------------------------------------------

### 4. 手动执行

可以在 Quantumult X 的定时任务页面找到：

``` text
GLaDOS签到
```

右滑任务后手动执行。

也可以打开 `glados-checkin.js` 脚本，在脚本查看页面点击右上角：

``` text
▶︎
```

直接运行。

------------------------------------------------------------------------

## 📋 GLaDOS 运行日志

脚本提供详细日志，手动运行时可以直接查看执行过程。

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

日志只会显示凭据是否存在，不会打印 Cookie / Authorization 原文。

------------------------------------------------------------------------

## 🔔 GLaDOS 通知

正常签到后，Quantumult X 会显示签到结果，包括可获取到的：

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

## 🔗 Raw 地址汇总

### Quantumult X 自定义规则

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/qx.conf
```

### AdBlock / ABP

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/ad.txt
```

### Quantumult X 直连白名单

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/whitelist.list
```

### GLaDOS Rewrite

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/glados/glados.snippet
```

### GLaDOS 自动签到脚本

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/glados/glados-checkin.js
```

------------------------------------------------------------------------

## ⚠️ 注意事项

1.  本仓库以个人自用为主，不保证规则适用于所有用户。
2.  Quantumult X Rewrite / MitM 相关功能需要正确安装并信任 CA 证书。
3.  修改 GitHub 文件后，Quantumult X
    可能仍使用本地缓存，可手动更新对应远程资源。
4.  GLaDOS 登录凭据存在有效期，失效后需要重新使用 Safari
    登录并刷新页面。
5.  不要在 Issue、截图、日志或公开仓库中提交自己的 Cookie /
    Authorization。
6.  第三方服务接口、域名或页面结构发生变化时，相关脚本可能需要同步调整。
7.  自动化脚本仅用于减少个人重复操作，请自行确认所使用服务的规则及要求。

------------------------------------------------------------------------

## 📝 维护说明

本仓库根据个人使用情况不定期更新，主要包括：

-   增加或调整广告拦截规则
-   修复误拦截
-   增加直连白名单
-   调整 Quantumult X 配置
-   优化 GLaDOS 自动签到
-   增加日志和异常处理

不设置固定更新周期。

------------------------------------------------------------------------

## 📌 仓库定位

这是一个 **个人配置仓库**，不是通用规则项目。

主要目标：

> 自己用得顺手、配置集中、方便更新、出现问题容易排查。

------------------------------------------------------------------------

## Disclaimer

本项目仅用于个人学习、配置备份及自用。

使用本仓库中的规则或脚本所产生的任何影响，请自行判断并承担相应责任。

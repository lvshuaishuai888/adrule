# AdRule

个人自用的 **Quantumult X / AdBlock 规则与自动化脚本仓库**。

主要用于集中维护日常使用的广告拦截规则、直连白名单及 Quantumult X
自动化脚本，方便统一更新、订阅和备份。

> 本项目主要用于个人自用，规则和脚本会根据实际使用情况随时调整，不保证适用于其他网络环境或设备。

------------------------------------------------------------------------

## 📁 项目结构

``` text
adrule/
├── README.md
├── ad.txt
├── qx.conf
├── whitelist.list
└── glados/
    ├── README.md
    ├── LICENSE
    ├── glados.snippet
    └── glados-checkin.js
```

  文件               说明

------------------ --------------------------------------

  `ad.txt`           AdBlock / ABP 格式广告拦截规则
  `qx.conf`          Quantumult X Rewrite 自定义规则
  `whitelist.list`   Quantumult X 直连白名单
  `glados/`          GLaDOS Quantumult X 自动签到相关文件

------------------------------------------------------------------------

## 🚫 自定义广告规则

用于维护个人使用过程中遇到的广告、弹窗及相关资源拦截规则。

### Quantumult X

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/qx.conf
```

### AdBlock / ABP

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/ad.txt
```

------------------------------------------------------------------------

## ✅ 直连白名单

用于处理被代理、广告拦截规则或其他规则误匹配的正常域名。

``` text
https://raw.githubusercontent.com/lvshuaishuai888/adrule/main/whitelist.list
```

白名单内容根据个人实际使用情况维护。

------------------------------------------------------------------------

## 🤖 GLaDOS 自动签到

`glados/` 目录提供 Quantumult X 下的 GLaDOS 自动签到功能。

主要支持：

-   Safari 登录时自动获取 Cookie / Authorization
-   登录凭据保存在 Quantumult X 本地
-   定时自动签到
-   手动执行签到
-   查询积分及剩余天数
-   详细运行日志及通知
-   当天成功后避免重复签到
-   网络异常及部分 HTTP 错误自动重试
-   GLaDOS 请求域名白名单限制

详细安装、配置、安全说明及使用方法：

👉 **[GLaDOS 自动签到使用说明](./glados/README.md)**

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

-   本仓库以个人自用为主，不保证规则适用于所有用户。
-   修改 GitHub
    文件后，客户端可能仍使用本地缓存，可手动更新对应远程资源。
-   Quantumult X Rewrite / MitM 功能需要正确配置。
-   不要将 Cookie、Authorization 等个人登录凭据提交到公开仓库。
-   第三方服务接口、域名或页面结构发生变化时，相关脚本可能需要同步调整。

------------------------------------------------------------------------

## 📝 维护说明

本仓库根据个人实际使用情况不定期更新，主要包括：

-   增加或调整广告拦截规则
-   修复误拦截
-   增加直连白名单
-   调整 Quantumult X 配置
-   维护个人自动化脚本

------------------------------------------------------------------------

## 📌 仓库定位

这是一个 **个人配置仓库**，不是通用规则项目。

> 自己用得顺手、配置集中、方便更新、出现问题容易排查。

------------------------------------------------------------------------

## Disclaimer

本项目仅用于个人学习、配置备份及自用。

使用本仓库中的规则或脚本所产生的任何影响，请自行判断并承担相应责任。

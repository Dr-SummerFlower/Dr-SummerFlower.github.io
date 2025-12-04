---
title: vscode用snippets设置自定义代码头部注释（无插件）
published: 2023-03-13
description: 介绍如何在VSCode中利用Snippets功能自定义代码头部注释，无需安装插件，提供配置示例与基本使用指南。
image: ../assets/images/20230313/IMG-C695BD726D761D3362BA811B1EC81782.png
tags:
  - 日常
  - vscode
category: 日常杂谈
draft: false
lang: zh-CN
---
vscode的代码块虽然简陋了点，但是我觉得对于要求不高的人来说已经够用了

相比koroFileheader这种高级玩法，我觉得还是这种代码块简便一点，（虽然功能也简单了一点）

刚开始也去下载了koroFileheader插件，但是那个配置项我是死活看不懂，而且也不知道能不能设置成中文的，相比之下，这种代码块就简单得多，也很省心>-<

```json
"Header Comment": {
        "prefix": "header",//自定义响应字段
        "body": [//添加自定义字段
          "${BLOCK_COMMENT_START}",//变量,添加注释头部
          " * @文件名： ${TM_FILENAME_BASE}",
          " * @创建者： 夏花",//自定义字段，添加创建者
          " * @创建时间：${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}",//变量，添加时间，格式为：年-月-日
          "${BLOCK_COMMENT_END}",//变量,添加注释尾部
          ""
        ],
        "description": "添加代码头部注释"//用法说明
    }
```

还想添加其他自定义项之类的可以去看看官方的文档，这里贴出地址[visualstudio code](https://code.visualstudio.com/docs/editor/userdefinedsnippets)

另外一说，这个snippets本来的作用是用来添加自定义代码的，比如html文件输入"!"生成基础代码，js里输入"log"生成"console.log"这些都是vscode内置的代码模块
---
title: npm sqlite安装教程，sqlite安装失败解决办法，No module named 'distutils'
published: 2024-05-05
description: 在Windows系统上使用npm安装sqlite3，解决因Python版本过高导致的'No module named distutils'错误，包含VS2019、Python和node-gyp的完整配置步骤。
image: ../assets/images/20240505/IMG-9D56827767081FA6A032C7F7797EDAAE.jpg
tags:
  - nodejs
  - 日常
  - 错误解决
category: 日常杂谈
draft: false
lang: zh-CN
---
# npm sqlite安装教程  

| 依赖            | 版本      | 备注                                                                                                                                            |  
|---------------|---------|-----------------------------------------------------------------------------------------------------------------------------------------------|  
| Visual Studio | 2019    | 我使用的版本为2019，暂时没有测试过VC版本是否对此有影响                                                                                                                |  
| python        | <=3.9   | python在3.10版本废弃了标准库**distutils**，官方文档说明：`根据PEP 632，distutils在3.10中被标记为废弃，在 3.12中将不再是标准库的一部分。`如果你安装的版本大于3.12，则会报错`No module named 'distutils'` |  
| node-gyp      | @latest | 只需要保持最新就可以，如果出现问题，也可以尝试降低一个大版本号安装试试，目前我使用的时候是没有问题的                                                                                            |  
  
### 安装依赖  
  
###### 安装vs2019  
  
这里我选择使用chocolatey安装，过程简单，不需要操心各种缺失依赖和动态库等问题  
  
首先安装chocolatey  
```bash  
#cmd:  
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"#powershell:  
Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))  
```  
然后使用choco命令安装VS2019以及Desktop Development with C++/使用C++桌面开发  
```bash  
choco install visualstudio2019buildtoolschoco install visualstudio2019-workload-vctools```  
请注意，这里安装的是生成工具不是桌面开发环境，如果你需要使用VS的开发IDE环境，执行  
```bash  
choco install visualstudio2019communitychoco install visualstudio2019-workload-nativedesktop```  
  
###### 安装python  
  
python安装不使用chocolatey，直接使用官网下载安装包安装即可，下载速度慢也可以使用镜像站下载，这里提供华为镜像站下载地址：<https://mirrors.huaweicloud.com/python/>  
  
安装时记得勾选`Add python 3.9 to PATH`，这样安装完之后，python会自动添加到环境变量中  
  
或者也可以手动添加环境变量，将`%LOCALAPPDATA%\Programs\Python\Python39`以及`%LOCALAPPDATA%\Programs\Python\Python39\Scripts`  
添加到环境变量中，完成后，重启电脑使环境变量生效，尝试运行`python -V`和`pip -V`命令，如果出现版本号，则说明安装成功  
  
如果出现已经安装完成并设置了环境变量，但是无法打印版本号的情况，可以检查环境变量中`C:\Users\17218\AppData\Local\Microsoft\WindowsApps`这个变量是否在python环境变量的上方，这个变量为微软应用商店的程序环境变量，它会干扰python相关的命令的生效，并跳转到微软应用商店的python程序，需要将其移到python环境变量的下方  
  
###### 安装node-gyp  
  
node-gyp安装使用npm安装即可，直接执行`npm install -g node-gyp`即可  
或者使用yarn安装`yarn global add node-gyp`  
  
### 安装sqlite  
  
安装完上述的依赖之后，就可以正常安装sqlite了  
使用`npm install sqlite3`
---
layout: post
title: "自动化部署平台"
subtitle: "基于Gitlab Jenkins Docker集群 微服务搭建自动化部署平台"
tags:
date: 2016-11-09 16:15:55 +0800
categories: deploy
  - 
---

###背景
随着公司应用系统的不断增多，原有手工部署流程越来越不满足上线的需求。为了各个系统能快速迭代与测试，减少上线流程时间和人为出错，迫切需要一套自动化部署系统。

###目标
* 快速迭代，方便的功能更新
* 代码版本管理，方便的管理、审核
* 快速打包部署与测试，自动化测试
* 应用集群管理
* 快速部署线上环境，快速发布、回滚、重启、停止。

为了达到目标提出下面概念
* 微服务 - micro service 
* 代码仓库 - gitlab
* 持续集成部署工具 - jenkins / circleci / ThoughtWorks  Go
* 虚拟化技术 - docker集群 (swarm/kubernetes)

###微服务
一个简单的应用会随着时间推移逐渐变大。在每次的sprint中，开发团队都会面对新“故事”，然后开发许多新代码。我很确信这个代码正是很多开发者经过多年努力开发出来的一个怪物。单体式应用也会降低开发速度。应用越大，启动时间会越长。单体式应用在不同模块发生资源冲突时，扩展将会非常困难。试想下其中一个功能出错导致服务cash，整个应用都无法使用。micro service 就是解决这样的问题。微服务根据业务适当的拆分。微服务具有更敏捷的迭代，更快速方便的上线。

* 服务之间的是完全解耦的。
* 服务通讯是重点，制定统一标准。
* 分布式事务
* 版本控制
* 动态扩容

####代理微服务设计模式

![Alt text](http://ww3.sinaimg.cn/mw690/0065glrAgw1f9lyi1cn81j30sg0elq5z.jpg "micro porxy service")

####异步消息传递微服务设计模式

![Alt text](http://ww1.sinaimg.cn/mw690/0065glrAgw1f9lyi22shhj30sg0hsq69.jpg "micro service")

###代码仓库
Gitlab是一个用Ruby on Rails开发的开源项目管理程序，Git Flow管理开发流程实现代码提交和审核。
流程如下：

![Alt text](http://ww4.sinaimg.cn/mw690/0065glrAgw1f9lyhzlkq1j30i10cl3zj.jpg "git flow")

###持续集成部署工具
持续集成的目的，就是让产品可以快速迭代，同时还能保持高质量。持续交付（Continuous delivery）指的是，频繁地将软件的新版本，交付给质量团队或者用户，以供评审。持续部署（continuous deployment）是持续交付的下一步，指的是代码通过评审以后，自动部署到生产环境。

持续集成它的好处主要有两个：
1. 快速发现错误。每完成一点更新，就集成到主干，可以快速发现错误，定位错误也比较容易。
2. 防止分支大幅偏离主干。如果不是经常集成，主干又在不断更新，会导致以后集成的难度变大，甚至难以集成。

![Alt text](http://ww4.sinaimg.cn/mw690/0065glrAgw1f9lyi06wrfj30m5098t9z.jpg "deploy")

####Jenkins
是开源的持续集成工具。自动化的build、打包、构建、测试。可定制的众多插件实现持续部署。

####Circleci  
是一个强大的持续集成与部署服务, 支持多种语言。配置简单，需要付费。

####ThoughtWorks Go
GO是一款开源的持续集成和发布的系统，旨在使软件开发企业和团队在构建-测试-发布软件产品的流程自动化，并且能持续地发布软件产品。技术支持，需要付费。

###虚拟化技术docker 集群
Docker 项目的目标是实现轻量级的操作系统虚拟化解决方案。 Docker 的基础是 Linux 容器（LXC）等技术。 基于docker的集群工具有swarm(官方)和kubernetes(google)。
1. 文件系统隔离：每个进程容器运行在完全独立的根文件系统里。
2. 资源隔离：可以使用cgroup为每个进程容器分配不同的系统资源，例如CPU和内存。
3. 网络隔离：每个进程容器运行在自己的网络命名空间里，拥有自己的虚拟接口和IP地址。
4. 写时复制：采用写时复制方式创建根文件系统，这让部署变得极其快捷，并且节省内存和硬盘空间。
5. 日志记录：Docker将会收集和记录每个进程容器的标准流（stdout/stderr/stdin），用于实时检索或批量检索。
6. 变更管理：容器文件系统的变更可以提交到新的映像中，并可重复使用以创建更多的容器。无需使用模板或手动配置。
7. 交互式Shell

####Swarm架构

![Alt text](http://ww4.sinaimg.cn/mw690/0065glrAgw1f9lyi2sx34j30ex0d9abw.jpg "deploy")

####kubernetes架构

![Alt text](http://ww4.sinaimg.cn/mw690/0065glrAgw1f9lyi0nhpwj31kw1au46t.jpg "deploy")

###自动化部署 - gitlab

![Alt text](http://ww3.sinaimg.cn/mw690/0065glrAgw1f9lyz59iybj30go0cgab8.jpg "deploy")

1. 开发者fork正式repo代码
2. 开发者克隆代码到本地，git branch特性分支开始开发
3. 开发完成开发者创建pull request 将代码提交正式repo dev分支
4. 合并请求触发gitlab webhook或者 jenkins 定时拉取代码后。jenkins开始 编译、打包、单元测试。jenkins插件完成持续部署到测试环境并进行自动化测试。
5. 测试完成开发者创建pull request 将代码提交正式repo master分支
6. 合并请求触发gitlab webhook或者 jenkins 定时拉取代码后。通过发布系统将应用部署到生产环境

###自动化部署 - jenkins

![Alt text](http://ww1.sinaimg.cn/mw690/0065glrAgw1f9lyz5xghdj30jj0i2mzp.jpg "deploy")

1. 合并请求触发gitlab webhook或者 jenkins 定时拉取代码
2. jenkins 编译。
3. jenkins 单元测试。
4. jenkins 打包、构建
5. jenkins 插件 docker镜像并上传
6. jenkins 部署脚本（基于doker swarm/kubernetes）
7. 部署成功，自动化测试或通知测试人员测试
8. 测试通过

####jenkins 插件

* Publish Over SSH Plugin/SSH Agent Plugin
* Docker Plugin

###自动化部署 - 部署流程

####jenkins部署应用
![Alt text](http://ww2.sinaimg.cn/mw690/0065glrAgw1f9lyz6d3edj30iq0c1myn.jpg "deploy")

1. 合并请求触发gitlab webhook或者 jenkins 定时拉取代码
2. 编译代码二次验证
3.  jenkins 部署脚本
4. 生产环境更新应用
  * docker pull image
  *  docker run
5. 重启应用

####存在的问题
1. 不支持热部署
2. 不支持回滚、重启、停止
3. 不支持统一管理

###发布系统
为了解决发布流程中的问题，需要管理应用的发布系统。发布系统要做到热部署，动态扩容发布，定位应用状态，友好用户界面和接口，统一的配置中心。

正确的发布应用的流程如下：

1. 检查应用
2. 禁止业务流量
3. 停止应用
4. 更新应用
5. 启动应用
6. 开启业务流量

![Alt text](http://ww2.sinaimg.cn/mw690/0065glrAgw1f9lyz6qlvyj30ki0gvwhp.jpg "deploy")

###总结
自动化部署是从提交代码后，实现代码自动编译、打包、测试到线上部署的整套流程，能解决人工部署带来的无法快速上线、应用版本众多无法管理的问题。自动化部署平台不仅是部署应用，它还涉及到开发流程管理、代码托放管理、持续集成、持续部署、版本管理以及系统架构。自动化部署平台具有快速迭代，快速的代码管理、审核，快速的打包部署和测试，快速的发布、回滚、重启、停止应用的特点，同时还支持自由控制的弹性策略。

####自动化部署平台场景
* 标准的敏捷开发流程
* 完善的自动化测试
* 统一安装、配置应用
* 应用定期检测是否运行
* 支持自由控制的弹性策略
* 应用部署的安全管理

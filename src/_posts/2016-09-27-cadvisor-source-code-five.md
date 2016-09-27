---
layout: post
title: "Cadvisor源码分析（五）"
subtitle: "Docker监控数据采集Cadvisor源码分析总结篇" 
tags: "docker cadvisor 监控"
date: 2016-09-27 18:48:14 +0800
categories: docker
  - 
---

这一部分主要是对与cadvisor项目一些实现的整理和体会，逐步完善中。

###关于Watch部分

这一部分有一点技巧性，还是回到start函数上，主要是用来watch新启动的容器。

首先是检验root container是否存在，就是Name为“/”的容器。 生成eventchannel，channel中传递数据的类型是`container.SubcontainerEvent`类型。 执行root container的WatchSubcontainers方法，把之前生成的eventchannel传入。 之后使用for+select操作，一直进行如下循环：如果eventchannel传来的是event实例，则进行进一步判断，若event的原因是add，则自动执行createContainer的操作，若是delete，则执行destroyContainer的操作。如果传递进来的是quit信号，执行StopWatchingSubcontainers的操作。

大致流程还是比较清晰的，再看下具体watchsubcontainer的实现，所有类似watch的核心思想都是：只要有变化，就收到相关的通知。

首先要补充下inotify的相关内容：inotify是内核提供的用于文件系统监控的一套机制，具体网上的参考资料也比较多，这里只要熟悉在golang中对其的封装即可。[这里](https://godoc.org/golang.org/x/exp/inotify)的例子也比较通俗易懂。主要是注意一下各种event的类型。

由于root容器使用的是rawcontainerhandler的实现，可以看下watchfornewcontainer函数中这一步的实现：`err := root.handler.WatchSubcontainers(eventsChannel)`其中包含了对于传入进来的eventchannel的处理，之后后面就是通过判断eventchannel的返回值来决定继续添加或者删除容器。

在rawcontainerHandler对于WatchSubcontainers的实现中，先是把所有的cgroup path放在watch实例的监控范围内（相当于所有cgroups的层级结构都受到了watch的监控 当然其中也有一些同步的操作 从watch的列表中添加已有的path删除已经过期的path）之后就是for+select的形式，收到watcher.event，watcher.error以及stopWatcher不同信号时候的处理。

收到watcher.event之后，主要的操作是把watcher传递过来的event转化成container.SubcontainerEvent，因为通过watcher直接传递过来的原生event的信息还是很多的，具体的Type类型也有多种，实际并用不了这么多，只需要SubcontainerAdd 以及 SubcontainerDelete两种类型即可，之后进行转化并且执行一些watch的更新操作，最后把新生成的SubcontainerEvent对象赋值给之前的那个eventChannel。

再回到start函数的地方，可以看到，最后会新启动一个goroutine，来运行manager的`globalHousekeeping`设置定时器，每次隔interval的时间就detectSubcontainers，或者接受到quit信号退出。

在Start操作的时候，最后两步生成了两个quitechannel它们用于实现退出的操作。


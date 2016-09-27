---
layout: post
title: "Cadvisor源码分析（一）"
subtitle: "Docker监控数据采集Cadvisor源码分析入门篇" 
tags: "docker cadvisor 监控"
date: 2016-09-27 14:02:15 +0800
categories: docker
  - 
---

这几篇文章主要是以cadvisor为例，对类似的资源搜集的agent的实现机理进行一个学习，采用的cadvisor版本是v0.20.0。主要是希望能通过分析cadvisor，对这一类agent所搜集的数据以及搜集方法，都有一个比较深入的理解。希望在梳理完成之后，对一些看似比较浅显的问题，比如cadvisor到底搜集了哪些数据，怎么搜集的，能有很好的回答，在文章整理方面，应该尽量通过 graph driving 的方式来呈现。

1. （一）主要是梳理下代码的各个模块以及其相关的功能，后面的几篇是对每个模块的较细致分析。
2. （二）主要是对存储模块进行分析。
3. （三）主要是对manager模块，也是最核心的模块进行分析。
4. （四）主要是从user interface的角度进行分析，也就是api的角度，看cadvisor到底对外向用户暴露了哪些功能，也就是从功能的角度上分析，具体都包含了哪些指标等等。
5. （五）其他方面的整理和收获，比如退出机制，event机制，还有整体上的体会，以及cadvisor在k8s中的使用，如何与heapster结合，等等，从中得到的一些所谓的insights。

###主要模块及流程

![Alt text](http://7xn7vm.com1.z0.glb.clouddn.com/architect.001.jpeg "Cadvisor source code 1")

这个结构图其实也是main函数的主要执行流程。

首先是根据传入的storage参数生成inMemoryCache的实例（这一部分在part2中具体介绍），其中还包含了backendStorage实例，这个backendStorage实例主要是决定除了内存之外，数据会被存放在哪个后端中，实质上是一个storageDriver接口类型，在storage的package中，对于storageDriver接口做了不同的具体实现，memoryStorage实例的初始化的相关操作放在main package的另外一个文件：storagedriver.go中。

之后生成realSysFs结构的实例，其中涉及到的相关函数，是对系统的filesystem所进行的一些操作，realSysFs结构中实际上没有具体的字段，主要是对一系列的方法进行了封装，有点类似于一个工具类，就是通过传入不同的系统文件之后，再从中提取出来不同文件系统的信息。

之后，通过前面生成的memoryStorage以及sysfs实例，创建一个manager实例，这实际上通过一个接口来返回，manager接口中定义了许多用于获取容器和machine信息的函数，生成manager实例的时候，还需要传递两个额外的参数，分别是maxHousekeepingInterval(time.Durattion)以及allowDynamicHousekeeping(bool)分别表示信息存在内存的时间以及是否允许动态配置housekeeping的时间，也就是下一次开始搜集容器信息的时间，默认值分别为60s以及true。可以粗略浏览下manager结构的字段以及相关功能：

```go
type manager struct {
    //当前受到监控的容器存在一个map中 containerData结构中包括了对容器的各种具体操作方式和相关信息
  containers               map[namespacedContainerName]*containerData
  //对map中数据存取时采用的Lock
  containersLock           sync.RWMutex
  //缓存在内存中的数据 主要是容器的相关信息
  memoryCache              *memory.InMemoryCache
  //host上的实际文件系统的相关信息
  fsInfo                   fs.FsInfo
  //machine的相关信息 cpu memory network system信息等等
  machineInfo              info.MachineInfo
  // 用于存放退出信号的channel manager关闭的时候会给其中的channel发送退出信号
  quitChannels             []chan error
  //cadvisor本身所运行的那个容器(如果cadvisor运行在容器中)
  cadvisorContainer        string
  // 是否在hostnamespace中？
  inHostNamespace          bool
  // dockerid的正则表达式匹配
  dockerContainersRegexp   *regexp.Regexp
  // 用于获取cpu信息
  loadReader               cpuload.CpuLoadReader
  // 对event相关操作进行的封装
  eventHandler             events.EventManager
  //manager的启动时间
  startupTime              time.Time
  //在内存中保留数据的时间 也就是下次开始搜集容器相关信息并且更新内存信息的时间
  maxHousekeepingInterval  time.Duration
   //是否允许动态设置dynamic housekeeping time
  allowDynamicHousekeeping bool
}
```

由于还要把服务暴露给外部，所以还要提供一个server的功能来注册api，api可以看成是从另一个维度对程序进行分析，也就是从功能的维度。比起kube-apiserver，真是要简单多了，具体使用上也添加了证书的方式，把上面生成的containerManager注册进去，具体实现在cadvisor/http/handler.go中，可以看到目前已经实现了version1 0,1 1,1 2,1 3,2 0几种，以2 0为例，具体的路由类别主要是以下三种：

* 一种是通过自带默认界面简单看一下机器上的容器信息，就是/containers/路由，这个目前支持的api版本比较低。
* 另一种是/api/路由，具体在/cadvisor/api/handler.go中实现，这一部分路由已经设置的比较友好，会提示出当期支持的子路由都有哪些。可以看到在2.0版本中，支持的查询信息已经相当丰富。
* 另外一个不错的功能就是支持通过页面的方式使用golang的pprof工具，在使用了profiling=true的参数之后，可以通过“net/http/pprof”package来获取应用层面的信息，可以为应用性能调优提供帮助。

之后就是启动manager，运行其Start方法，开始搜集信息，存储信息的循环操作，这之后还为containerManager注册了singlehandler，如果收到了系统发来的kill信号，程序就会捕获到，就直接执行manager的stop函数，manager停止工作。

可以看到，代码的意图在这里表现的很明确，就是生成后端，生成manager，注册api，启动server。还有其他的一些套路化的操作，比如在main函数开始的时候设置MaxProcs,设置runtime.GOMAXPROCS为当前cpu的个数，使得并发性能较高。

后面几篇对每一个部分进行一些相对深入的分析。

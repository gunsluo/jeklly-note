---
layout: post
title: "Cadvisor源码分析监控项"
subtitle: "Docker监控数据采集Cadvisor源码分析监控项" 
tags: "docker cadvisor 监控"
date: 2016-09-27 19:21:21 +0800
categories: cadvisor
  - 
---

主要讨论常见的性能指标，cpu,memory,network，filesystem 看下几种比较好的工具是如何搜集这些性能数据的，并且结合cadvisor进行具体的分析，有些内容比较琐碎，只能慢慢完善了。

想起来初中生物老师说过的话，微观的问题往往通过宏观的现象表现出来。当时感觉不明觉厉。运用到性能监控这里，代码级别的性能问题，反应出来，就是各个性能指标得到的信息了。具体的指标都有哪些，这些指标的含义是什么，应该算是基本功了，对这一部分的学习，要是基于此，并不停留于此。

###关于CPU

####uptime

**load average**

这个指标可以用来查看系统负载，所谓系统负载，即是在特定时间间隔内，运行队列中的平均进程数。

如果一个进程满足以下条件则其就会位于运行队列中：

它没有在等待I/O操作的结果 它没有主动进入等待状态(也就是没有调用'wait') 没有被停止(例如：等待终止)

一般来说，每个CPU内核当前活动进程数不大于3，则系统运行表现良好！

当然这里说的是每个cpu内核，也就是如果你的主机是四核cpu的话，那么只要uptime最后输出的一串字符数值的和小于12，即表示系统负载不是很严重.当然如果达到20，那就表示当前系统负载非常严重，估计打开执行web脚本非常缓慢。这个指标还是与一定程度上还是与机器上的进程相关的，因为衡量的是等待队列的长度。

一般常用的工具中（比如top工具）的load average是统计 1分钟 5分钟 15分钟 时间段内的load average。

####vmstat

vmstat是输出的信息比较全面，memory,swamp,io,cpu,system 可以从不同的角度对系统进行衡量，还有一些更细节的参数，可以用于信息的输出。

vmstat 1 可以每隔1s中打印出来一些信息（后面的信息是这1s之内的信息？？？），其中最后的几行是跟cpu有关的信息。先只看最后几行的信息，其实就是各种cpu时间的占比，其实这几个值是对cpu时间的进一步细分。

* us os在用户模式下所消耗的cpu时间占比。
* sy os在系统模式下所消耗的cpu时间的占比，在内核模式下执行的时间的占比。
* id 空闲的时候的cpu占比
* wa 实际上是iowait time 等待时间 比如线程在I/O处理的时候阻塞，这个时候的cpu时间就被算到了id里面 就是等待着去为线程服务的时间
* st（不是太常用） cpu steal time 在虚拟化的环境下，cpu被调用起来用于服务其他虚拟化资源的时间，注意这个并不是指虚拟机运行时候所占用的cpu时间，而是说hypervisor调用一些资源来进行，这个调用操作所占用的这部分时间，参考这里,通常解释就是 Time stolen from a virtual machine，这个里面有好多例子，介绍不同情况下，各个数据看起来是什么样子的。

其实这个还是通过cpu的各种不同时间，从比较宏观的角度，反映出机器上进程的状态是什么样的，比如系统调用过多，RAM瓶颈，high IO Read/Write，以及cpu wait IO 等等。

####mpstat

mpstat从更细的粒度上对cpu指标进行测量，比如`mpstat -P ALL 1`可以每隔1s的时间打印出本机上所有的cpu状态信息。具体测量方法也是对cpu的时间进行分类，名字不同，本质上是与vmstat是类似的，类别分的也更细一点，具体在需要的时候可以更细致地查询，这里就不再一一罗列。采用`sar -P ALL 1`也可以实现类似的结果。

####其他工具

再细化的话，可以通过`ps -aux`或者 `ps -ef`查看每个进程所占用的cpu时间，如果就在终端查看的话，top工具应该比较实用，上面介绍的相关参数信息，在top工具中都有具体的体现。

由于top工具展示的数据比较多，因此就可以比较好的发现进系统出现的异常，比如哪个进程占用了过多的资源等等。当然类似的工具还有很多，可以从不同粒度对cpu的时间进行衡量，比如time,ptime,pidstat，要是粒度更细的话，可以从代码的层级进行衡量，比如使用DTrace，这里暂不讨论。

还有一个使用很广泛的工具,sysdig，可以达到很细的粒度。

####在cadvisor中 cpu相关指标测量 CpuStats 以及 TaskStats

`stats api`的具体输出如下 结果是ns。其中cpu_inst表示的是In nanocores per second (instantaneous)的cpu使用情况，可以认为是瞬间的使用率，表示cpu的瞬间使用率，即是在1s钟的时间内，cpu的使用的绝对时间。

```bash
        "cpu": {
            "load_average": 0,
            "usage": {
                "per_cpu_usage": [
                    9866509286700,
                    9889084073920
                ],
                "system": 12599470000000,
                "total": 19755593360620,
                "user": 6738860000000
            }
        },
        "cpu_inst": {
            "usage": {
                "per_cpu_usage": [
                    61482158,
                    71646320
                ],
                "system": 60023536,
                "total": 133128478,
                "user": 50019613
            }
        },
```
summary api的相关部分具体输出如下 (又细分为 day _ usage，hour _ usage，minute _ usage)

```bash
        "cpu": {
            "fifty": 70,
            "max": 232,
            "mean": 96,
            "ninety": 174,
            "ninetyfive": 213,
            "present": true
        },
```

先看下 summary api 这部分的含义，首先确定搜集的数据是什么，这里补充下百分比的这种表示方式，可以参考[这里](http://www2.arnes.si/~gljsentvid10/pct.html)，在95%的时间之内，使用量低于这个值，其他的类似。剩下的几个是平均值，最大值等等。这里测量的值是

```bash
Mean, Max, and 90p cpu rate value in milliCpus/seconds. Converted to milliCpus to avoid floats.
```

即是1s之内的cpu的使用时间（多少毫秒），这个是针对于每个容器而言的。比如这里，就是95%的采样时间都低于213ms。Instant sample 会在1s内更新一次。如果second数据足够多，就会产生minute数据。具体的这些指标又可以从 day _ usage，hour _ usage，minute _ usage 几个角度进行了细分。

关于summary stats 目前仅仅是追踪 cpu 以及 memory 的信息

**关于TaskStats**

具体cpuloader（manager中的一个字段）是由linux中的netlink实现的，cadvisor对netlink实现了一个封装，具体在utils/cpuload/netlink文件夹中，里面有个example.go的文件，介绍了主要的使用方式，从cgroups文件夹中获取不同的对应的信息，cpuloader主要用来获取TaskStats的相关信息。

netlink是一个用于在用户空间和内核空间进行通讯的工具，也是一种socket可以参考这个 http://blog.csdn.net/bingqingsuimeng/article/details/8470029

通过netlink可以得到的具体的信息，这部分信息实际上最后被放在TaskStats LoadStats字段当中。

```bash
// Number of sleeping tasks.
NrSleeping uint64 `json:"nr_sleeping"`

// Number of running tasks.
NrRunning uint64 `json:"nr_running"`

// Number of tasks in stopped state
NrStopped uint64 `json:"nr_stopped"`

// Number of tasks in uninterruptible state
NrUninterruptible uint64 `json:"nr_uninterruptible"`

// Number of tasks waiting on IO
NrIoWait uint64 `json:"nr_io_wait"`
```
在containerStats中的cpu usage中包含的信息可以根据libcontaner中的相关操作得出，其中显示的单位是ns，明显这种显示不是太友好，百分比的形式会更好点，percpuusage显然是每个cpu使用的时间。

在updateStats的时候，会通过manager查看一下其cpuloader是否为nil之后get相关的信息,可以看到最后的结果被存在了stats.TaskStats字段中。这部分的信息目前是单独获取的，还没有被缓存起来。

```bash
if c.loadReader != nil {
      // TODO(vmarmol): Cache this path.
      path, err := c.handler.GetCgroupPath("cpu")
      if err == nil {
          loadStats, err := c.loadReader.GetCpuLoad(c.info.Name, path)
          if err != nil {
              return fmt.Errorf("failed to get load stat for %q - path %q, error %s", c.info.Name, path, err)
          }
          stats.TaskStats = loadStats
          c.updateLoad(loadStats.NrRunning)
          // convert to 'milliLoad' to avoid floats and preserve precision.
          stats.Cpu.LoadAverage = int32(c.loadAvg * 1000)
      }
```

按理说在/sys/fs/cgroup/cpuacct这里面都可以找到cpu相关的信息，为何还要使用netlink socket的方式？具体原因可以[参考](https://groups.google.com/forum/#!topic/google-containers/A4MqwpTCpMw)

cpuacct gives us CPU usage, but the netlink code will get us load which we define as the number of threads waiting on CPU. This is not provided by cpuacct today. (在cadvisor中所定义的load包含等待cpu的task的数目(task load的相关信息) 单纯的cpuacct无法提供相关信息 这个与vmstat有点类似了)

在cadvisor中，这部分自己定义的信息叫做LoadStats，于CpuStats（包含相对普通的cpu信息）有所区别。

###关于Memory

背景知识补充

catched memroy 读写文件的时候，一些文件会在cache中缓存，以便提高读写速度，这部分内容就存在cache中。缓存内存(Cache Memory)在你需要使用内存的时候会自动释放，所以你不必担心没有内存可用。

page cache 以及 buffer cache 两种cache都是 disk到memory中的中间结构，只不多存储的内容不同。

####free

通过free命令查看内存的使用情况

第一行

* total 总共的物理内存
* used 应用程序所占用的内存+cache做占用的内存
* free 完全没有被使用的内存 free+used=total
* shared 应用程序共享的内存
* buffers 缓存，主要用于目录方面，inode值等（ls大目录可看到这个值增加） cached 缓存，用于已打开的文件

其他注意 total=free+used used > buffer+cached (所谓应用程序占用实际上就体现在这两个方面) 第二行描述应用程序的内存使用： 前个值表示-buffers/cache —— 应用程序本身可以使用的内存大小，used减去缓存值 后个值表示+buffers/cache —— 所有可供应用程序使用的内存大小，free加上缓存值

注意
-buffers/cache=used-buffers-cached
+buffers/cache=free+buffers+cached

第三行表示swap的使用： used——已使用  free——未使用

####实际场景

又一次进行监控，发现top时候，%MEM中显示的容器的内存占用百分比与通过cgroup的时候进行操作的结果是不一致的。在docker stats中显示出来的结果明显大于通过top命令显示出来的结果，这就是所谓的“度量不一致“导致的原因吧。

通过ps -aux可以看到 RSS 以及 %MEM 这里的RSS表示的是（resident set size）表示的是系统的常驻内存，而这里的%MEM表示的是RSS所站的内存总量的百分比。

通过top命令显示出来的字段被称为RES这个实际上也表示的是常驻内存，就是不同工具带来的拼写有差异。

在docker stats <容器id>中显示出来的当前容器所占用的内存，实际上是cgroups文件系统中的memory.stat文件下，cache+rss两部分的总和，所以通过docker stats或得到的memory会稍微大一些。

####vmstat

首先还是看vmstat中的数据，这个还是从比较宏观的层面上显示了一些具体的指标信息。其中涉及内存健康状况的信息包括以下方面：

####memory角度

这里的单位都是 KB （注意buffer与cache的区别）
* swpd 从内存中换出的容量（从memory换出到disk上的容量）
* free 当前可以使用的memory的大小
* buff 在buffer cache中的内存的大小
* cache 在page cache中的内存大小

####swap角度

* si 被换入的内存的大小
* so 被换出的内存的大小

####top

通过top工具的Mem那一行可以比较清楚地看出mem的占用情况，其中 total=used+free used=程序实际使用的+buffer(buffer cache)+cache(page cache)

####cadvisor中的实现

cadvisor中的内存指标数据

```bash
type MemoryStats struct {
  // Current memory usage, this includes all memory regardless of when it was
  // accessed.
  // Units: Bytes.
  Usage uint64 `json:"usage"`

  // The amount of working set memory, this includes recently accessed memory,
  // dirty memory, and kernel memory. Working set is <= "usage".
  // Units: Bytes.（实际上是一些cache page）
  WorkingSet uint64 `json:"working_set"`

  Failcnt uint64 `json:"failcnt"`

  ContainerData    MemoryStatsMemoryData `json:"container_data,omitempty"`
  HierarchicalData MemoryStatsMemoryData `json:"hierarchical_data,omitempty"`
}
```

具体的信息还是通过runc/libcontainer获得的。libcontainer可以获得的信息包括：

```go
type Stats struct {
  CpuStats    CpuStats    `json:"cpu_stats,omitempty"`
  MemoryStats MemoryStats `json:"memory_stats,omitempty"`
  BlkioStats  BlkioStats  `json:"blkio_stats,omitempty"`
  // the map is in the format "size of hugepage: stats of the hugepage"
  HugetlbStats map[string]HugetlbStats `json:"hugetlb_stats,omitempty"`
}
```

其他的信息就需要通过别的渠道获取了。获取的方式也就是打开对应的文件，之后得到相应的数值。在/sys/fs/cgroup/memory中包含大量的了memory相关的信息。具体含义可以参考cgroup的相关说明。之后通过相关的函数把从cgroups中获得到的信息即sgroup.stats转化成为cadvisor可以使用的containerStats

* usage字段指的是 cgropup中进程当前使用的总得内存量 （实际上cgroup还可以对内存用量使用量的上限进行限制，因此还可以设置内存上限的使用量以及超过这个使用量的次数）
* workingset字段指的是 cgroup中的total _ inactive _ anon ？？？of bytes of anonymous and swap cache memory on inactive LRU list（需要把LRU Page再看看）
* Failcnt show the number of memory usage hits limits 指的是缺页的次数 (可能达到了limit还发生swamp交换？？？)

关于cgroup在memory方面的使用可以[参考](http://xiezhenye.com/2013/10/%E7%94%A8-cgruops-%E7%AE%A1%E7%90%86%E8%BF%9B%E7%A8%8B%E5%86%85%E5%AD%98%E5%8D%A0%E7%94%A8.html)，里面对于memrory的参数解释的比较清楚，比如memsw的含义，上限控制（含有soft时候的区别），oom killer等等。对于cgroup更全面的解释，最全的地方就是参考[官方文档](https://www.kernel.org/doc/Documentation/cgroup-v1/memory.txt)了，其他的比较好的资源比如[这个](http://hustcat.github.io/memory-usage-in-process-and-cgroup/)。里面对page的分类说的很好。

###关于network

cgroup本身没有对network进行什么限制。

```bash
type NetworkStats struct {
  InterfaceStats `json:",inline"`
  Interfaces     []InterfaceStats `json:"interfaces,omitempty"`
  // TCP connection stats (Established, Listen...)
  Tcp TcpStat `json:"tcp"`
  // TCP6 connection stats (Established, Listen...)
  Tcp6 TcpStat `json:"tcp6"`
}
```

terfaceStats就是网络interface的信息

容器没有自己的网络占的时候，就不搜集对应的信息（比如运行在k8s的 pod中的容器）

具体的信息也都是从/proc/<pid>/net/dev文件当中获取的，主要就是TCP链接的各种状态。

在./cadvisor/contianer/docker/handler.go GetStats（被housekeeping调用） 函数以及 ./cadvisor/libcontainer/helper.go 文件中的GetStats函数比较关键，它们两个是互相调用的关系，通过这个可以看出哪些信息是从libcontainer中搜集过来的，以及哪些信息是从host的其他地方搜集来的（比如 Filesystem 的信息以及 Network 的信息）

###关于Filesystem

单独使用的一系列函数得到的相关信息。

###iskIoStats

这个信息是在cgroup信息转化为cadvisor中的container信息的时候进行的操作，具体可以参考这个函数toContainerStats1 信息来自于BlkioStats,主要之cgroup对于blkio方面的限制。可以参考这个http://www.elmerzhang.com/2012/12/cgroups-learning-6-blkio-subsystem/

具体cadvisor中的结果

```go
"diskio": {
    "io_service_bytes": [
        {
            "major": 8,
            "minor": 0,
            "stats": {
                "Async": 1646592,
                "Read": 1536000,
                "Sync": 0,
                "Total": 1646592,
                "Write": 110592
            }
        }
    ],
    "io_serviced": [
        {
            "major": 8,
            "minor": 0,
            "stats": {
                "Async": 54,
                "Read": 27,
                "Sync": 0,
                "Total": 54,
                "Write": 27
            }
        }
    ]
},
```

cgroup中关于block io system 的表述

https://www.kernel.org/doc/Documentation/cgroup-v1/blkio-controller.txt

主要是理解 <major>:<minor> <bytes_per_second>这种表述的含义。可以参考下这个，设备号被记录在/proc/devices 文件中，the major number identifies the driver associated with the device，The minor number is used by the kernel to determine exactly which device is being referred to， the minor number is used by the kernel to determine exactly which device is being referred to.

说的直接一点就是主设备代表的是驱动的大的类别，从设备代表的是驱动的具体的实体，主要是对主从设备号有一些理解。

###用户自定义Metric

可以自定义一些metrics添加到manager的对应字段中

###相关参考资料

cgroup各种参数中文版解释（由于好多信息都来自libcontainer而libcontainer中又是对cgroups的封装 直接查看文档比较快 这个资源很不错）

* https://access.redhat.com/documentation/zh-CN/Red_Hat_Enterprise_Linux/6/html/Resource_Management_Guide/ch-Subsystems_and_Tunable_Parameters.html#sec-blkio
* 关于linux io的监控： http://www.cnblogs.com/york-hust/p/3793064.html
* network信息获取： 关键需要计算每秒的值 http://xmodulo.com/measure-packets-per-second-throughput-high-speed-network-interface.html

proc中的字段详细信息 http://linux.die.net/man/5/proc

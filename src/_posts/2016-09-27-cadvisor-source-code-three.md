---
layout: post
title: "Cadvisor源码分析（三）"
subtitle: "Docker监控数据采集Cadvisor源码分析管理篇" 
tags: "docker cadvisor 监控"
date: 2016-09-27 17:19:37 +0800
categories: docker
  - 
---

这一部分主要是对manager的相关组件进行分析，manager组件应该是整个cadvisor的核心功能，应该是诸多核心逻辑实现的部分，怎么注册信息，怎么提取数据，何时开始搜集数据，间隔时间怎样，何时停止等等，由于manager部分本身比较抽象，所以理解起来还是比较困难，这里也是大概记录，好多细节也理解的不太好，只能一点一点修改了。

在manager.go文件中可以看到，manager是一个interface类型，里面定义了诸多方法，于是要看下，在main函数中调用start方法的是哪个manager，定位到/manager/manager.go文件中。大致浏览interface中定义的方法，可以发现，manage的主要功能就是负责一些具体的逻辑的操作，怎么样启动，怎么样开始搜集信息等等，之后再调用上面提到之前part2存储部分中提到的cache接口和storage接口来把数据存到合适的地方。

这一块需要从两个角度来分析，一方面manager通过start启动，会开始搜集数据，另一方面，manager也会被注册到api逻辑的实现部分，因为并不是所有数据的都一次存好的，有些数据要等到真正发送api请求的时候，才会去搜集，进行真正的取数操作，相当于是动态进行的，这些动态取数的操作，在part4 中具体介绍api的时候再细分析。

首先从manager自身的角度看一下manager.start的实现。在cadvisor.go文件中，相关的有两个操作，一个manager.New操作，即生成一个新的containerManager组件，另一个是start，即启动manager，启动各种goroutine。

首先来看下manager.New都做了哪些事情:

####manager.New

首先是检验该进程是否运行在容器中。

检验的方式是通过读取`/proc/self/cgroup`文件的某个子系统（这里是用cpu子系统）来获取容器id。`/proc/self/cgroup`文件的含义可以查看[这里](http://man7.org/linux/man-pages/man5/proc.5.html)访问`/proc/self`和使用`/proc/<本进程id>`的效果是一样的，采用`/proc/self`会直接通过软链接的方式链接到当前进程所在的对应的目录下。可以[参考](http://unix.stackexchange.com/questions/34192/how-is-proc-self-implemented-in-linux)。

目前在本机上直接运行的时候，这一步似乎有些问题。比如在我的本机上，获得到如下的信息`3:cpu:/user/1000.user/c3.session`，这似乎与通常形式docker容器的名称不一样。其实这里的容器是广泛意义上的容器，并不仅仅局限于docker容器，只要是被cgroup文件系统所监控的目录，在cadvisor看来，都是一个“容器”，因此直接在宿主机上运行cadvisor的时候（比如在自己的虚拟机上）得到的selfcontianer的id就是这个`/user/1000.user/c3.session`。???

毕竟绝大部分还是基于docker容器的，之后docker客户端给本地的docker daemon发请求，得到docker的信息，dockerInfo，之后生成一个叫做context结构的实例，其中包括dockerRoot以及dockerInfo，获取这个context的目的是根据这个信息生成RealFsInfo结构的一个实例，RealFsInfo是对FsInfo interface 的实现，并且还包含partition和labels两个字段cd，具体流程如下：

关于chroot可以参考下相关的资料以及[namespace in operation](http://lwn.net/Articles/531114/)通过`/proc/pid/mountinfo`文件，可以查看到当前这个进程所在的mount namespace下所有的mount point，具体的文件中每个字段的信息，可以查看[这里](http://man7.org/linux/man-pages/man5/proc.5.html)。

通过对mountinfo文件进行解析之后，每一条信息都会生成一个info结构体，包含对应的那几个字段。对每一条进行解析，首先是检验是否为支持的文件系统（Fstype包含ext的，或者btrfs或者xfs的）在docker context的文件类型为devicemapper的时候，需要单独进行一些额外的操作。最后通过这些从mountinfo文件中提取出来的信息，生成partition map。存储到FsInfo中，并返回，这一块还是有些不理解，主要是对文件系统相关的这块还不是很理解，下面是本机上运行cadvisor，生成RealFsInfo的内容，可以参考下这个(莫非是说docker image所在的设备号？？root那个是什么意思？？)：

```bash
&{partitions:map[/dev/disk/by-uuid/eb63c885-a9a8-4cc8-aad7-25357b10b3b3:
{mountpoint:/ major:8 minor:1 fsType: blockSize:0}] labels:map[root:/
dev/disk/by-uuid/eb63c885-a9a8-4cc8-aad7-25357b10b3b3 docker-images:/
dev/disk/by-uuid/eb63c885-a9a8-4cc8-aad7-25357b10b3b3]}
```

之后再回到New函数中，下面一步是判断容器是否存在于hostnamespace(主要判断/rootfs/proc是否存在) 最后根据之前的信息生成manager结构体：

```bash
	newManager := &manager{
		containers:               make(map[namespacedContainerName]*containerData),
		quitChannels:             make([]chan error, 0, 2),
		memoryCache:              memoryCache,
		fsInfo:                   fsInfo,
		cadvisorContainer:        selfContainer,
		inHostNamespace:          inHostNamespace,
		startupTime:              time.Now(),
		maxHousekeepingInterval:  maxHousekeepingInterval,
		allowDynamicHousekeeping: allowDynamicHousekeeping,
		ignoreMetrics:            ignoreMetricsSet,
		containerWatchers:        []watcher.ContainerWatcher{},
		eventsChannel:            eventsChannel,
		collectorHttpClient:      collectorHttpClient,
	}
```

之后还要获得machine的信息（主要是查询各种文件）并且进行eventhandler(主要是封装了一些对event进行处理的操作，相当于是一个event manager)的注册，生成最后的manager返回。

关于FsInfo的几个问题还要再补充说明下。

####manager的Start()方法

start方法就是启动一些一直要运行的go routine来用于实现各种监控操作。

首先是注册factory，facotory实质上是对容器的一些操作的方法的封装，具体可以看./cadvisor/container的package,其中有ContainerHandlerFactory以及ContainerHandler两个主要的接口，ContainerHandler主要是对容器的一些操作的实现，ContainerHandlerFactory是更上层的抽象，比如创建一个containerhandle或者判断当前的containerhandler可否使用。具体对这个两个接口的实现有方式也有两种，一个是在docker 文件夹下的实现，一个是在raw文件夹下的实现。

注册factory的操作就是调用docker.Register以及raw.Register方法将对应的Factory注册到所生成的manager实例中。之后根据参数判断是否启动cpuloadreader。（因为cpuload的值是不断变化的，而且变换速度很快，所以要单独设置一个loaderreader来不断地读取信息）

之后通过manager的watchForNewOoms方法，启动对于OOM的watch操作，这里主要是读取内核的日志文件，并进行解析，看是否捕获OOM信息。

后面的两个操作比较重要：`createContainer("/")`以及`detectSubcontainers("/")` 在manager中的具体操作如下，它们的功能主要就是注册cadvisor文件系统中名字为"/“的容器以及文件目录层次中的其它容器，稍后再具体分析这两个函数。

之后通过manager来watchNewContianer，即是watch cgroup的文件系统，如果其中有新的容器（目录）添加或者被删除，则需要动态地对内存中所存储的信息进行更新删除操作，保持存储的信息与实际的信息一致。

最后开启一个新的goroutine，其中主要执行的是一个定时器的操作，如果没有接收到quite信号，就继续执行detectSubcontainers(“/”)的操作，可以看到，具体的添加注册容器的操作应该都是在createContainer和detectSubcontainers中进行的，先看一下这一部分的结构图：

![Alt text](http://7xn7vm.com1.z0.glb.clouddn.com/manager.001.jpeg "Cadvisor source code 3")

详细分析下涉及到的主要的函数

**func (m *manager) createContainer(containerName string)**

```go
创建containerHandler,主要是通过遍历factories，根据containerName看是否能该factories处理，如果可以处理，就调用对应factory的NewContainerHandler方法。

创建containerManager (拥有更上一层的方法的抽象) 实例 m，返回的是一个GenericCollectorManager的结构，里面有两个字段，一个是`[]*collectorData{}`数组，另外一个是下次开始搜集的时间。

创建newContainerData

通过containerHandler的GetCollectorConfig得到collectorConfigs(一个map)

通过containerManager的registerCollectors添加Collectors

Add colletors 这里还有点问题？？？

检验container是否存在（即之前提到的m.containers字段），不存在则把新生成containerData添加进来。

生成event对象，通过m的eventHandler把newEvent添加进来。

之后开启containerData对象的start方法。
```

前面已经列出了manager对象的主要结构，其中与这部分相关的是这几个：

```go
type manager struct {
	containers               map[namespacedContainerName]*containerData
	containersLock           sync.RWMutex
	memoryCache              *memory.InMemoryCache
	fsInfo                   fs.FsInfo
	machineInfo              info.MachineInfo
	quitChannels             []chan error
	cadvisorContainer        string
	inHostNamespace          bool
	eventHandler             events.EventManager
	startupTime              time.Time
	maxHousekeepingInterval  time.Duration
	allowDynamicHousekeeping bool
	ignoreMetrics            container.MetricSet
	containerWatchers        []watcher.ContainerWatcher
	eventsChannel            chan watcher.ContainerEvent
	collectorHttpClient      *http.Client
}
```

可以看到，对容器进行实际操作的应该是这个containerData结构。

```go
type containerData struct {
	handler                  container.ContainerHandler
	info                     containerInfo
	memoryCache              *memory.InMemoryCache
	lock                     sync.Mutex
	loadReader               cpuload.CpuLoadReader
	summaryReader            *summary.StatsSummary
	loadAvg                  float64 // smoothed load average seen so far.
	housekeepingInterval     time.Duration
	maxHousekeepingInterval  time.Duration
	allowDynamicHousekeeping bool
	lastUpdatedTime          time.Time
	lastErrorTime            time.Time

	// Decay value used for load average smoothing. Interval length of 10 seconds is used.
	loadDecay float64

	// Whether to log the usage of this container when it is updated.
	logUsage bool

	// Tells the container to stop.
	stop chan bool

	// Runs custom metric collectors.
	collectorManager collector.CollectorManager
}
```

实际上这个containerData也是一个中间层，再详细看下一个主要的几个部分：

* 具体对容器操作的实现通过container.ContainerHandler进行,通过其方法大致就可以了解，比如像是ListContainer,GetStats这些操作，这是一个接口，rawContainerHandler以及dockContainerHandler对其进行了实现。
* containerInfo包含三部分:

```go
type containerInfo struct {
	info.ContainerReference
	Subcontainers []info.ContainerReference
	Spec          info.ContainerSpec
}
```

以看到，这里也维护了一个containerCache?既然manager已经有了containerCache,这里为何还要维护 ？
注意看下创建containerData时候的newContainerData方法，可以发现其中的`memoryCache *memory.InMemoryCache`参数，这个是从manager那里传进去的，也就是说，对于manager的InMemoryCache进行实际操作的步骤是在containerData这一层完成的，所有新创建的containerData使用的是同一个manager中的InMemoryCache。

* SummayReader是一个summary信息

* CollectorManager可以注册collector组件，从collector中搜集信息。

EventManager主要是用于监控event信息，稍后再分析。

看到在createContainer的最后一步是执行containerData的Start方法，实际上是用一个goroutine来执行go c.housekeeping()，这个housekeeping的主要部分是一个for循环，主要执行以下操作：

确定housekeeping实际时间，通过select判断，如果接收到stop信号，释放相关用于监控的资源。否则执行`housekeepingTick()`这里主要的作用是`updateStats()`,最后执行的是memoryCache的AddStats操作，相关方法在前面存储的部分已经分析过，还有些细节信息，比如containerData实例中的相关信息的更新，就不再赘述，要注意的是，这里存放数据的实际位置是containerData中的memoryCache，containerData中的memoryCache与manager中的InMemoryCache的区别？？？。注意这里的RecentStats函数中的maxStats的选取这里取的是60个。

再回到之前的housekeeping方法，之后是判断在update的时候，相关信息是否要输出，通过lasthousekeepingtime返回下一次housekeeping的时间（allowDynamicHousekeeping以及HousekeepingInterval两个参数就在这里派上用场）。之后就检验时间是否达到下一次，要是没到，就sleep，否则就更新lasthousekeepingtime，重新开始下一次的循环。

**注意一下handler的选择问题？？**

实际选择的时候，通过CanHandleAndAccept函数的返回值来判断，是否这个handler可以处理。

rawFactory的CanHandleAndAccept逻辑： 很直接了，如果dockeronly参数被设置为false，或者容器的name为"/“，则CanHandleAndAccept都会返回true。factory注册的顺序先是dockerfactory其次是rawfactory，在检测的时候是遍历factory,执行它们的CanHandleAndAccept方法，那个先返回true，就先把那个factory注册进去，所以以”/“命名的容器应该被rawfactory处理，后面的应该被dockerfactory处理。

dockerFactory的CanHandleAndAccept的逻辑： 检验名称是否match docker的id:

```go
var dockerCgroupRegexp = regexp.MustCompile(`.+-([a-z0-9]{64})\.scope$`)`
```

如果不是则不能处理。 传入的container名称可能是`/docker/<dockerid>`的形式，之后将containername转化为dockername，就是取出后面一段的容器id。

之后通过dockerclient给docker daemon发请求，获取到这个容器的信息。

以上操作都成功，则认为这个容器可以被dockerFactory来处理。

**func (m *manager) detectSubcontainers(containerName string) error**

首先是执行getContainersDiff，这个操作会从manager存储的containers(一个map)字段中检测上一步中已经注册进去的containerName为"/“的containerData，之后通过其handler调用ListContainers方法，得到所有的container，之后添加新加入的container，以及移除已经不在list中的container。

通过前面的分析，清楚了createContainer(“/”)，注册进来的容器实际操作的时候，使用的hadler是rawContainerFactory，看下其ListContainer的实现:首先是通过cgroup的绝对路径来查看出都有哪些容器，在递归遍历每个容器的子容器，之后把这些信息存储在map中，之后遍历map，生成info.ContainerReference数组，并返回。

存在其中的cgroups路径就像这样：

```go
map[memory:/sys/fs/cgroup/memory cpuacct:/sys/fs/cgroup/cpuacct blkio:/
sys/fs/cgroup/blkio cpuset:/sys/fs/cgroup/cpuset cpu:/sys/fs/cgroup/cpu]
```

这个信息是在每次createContainer的时候，通过NewCongainerHandler函数生成的，这个信息是生成registry的时候通过cgroupSubsystems传递进来的。之后list的时候，完全是利用cgroup的层次结构的性质，如果某个容器存在，则对应的cgroups路径，比如：/sys/fs/cgroup/memory/docker/<容器id>就是一个目录，在实际实现的时候，在每个cgroups子系统下，也是只抓取目录，之后会按照cgroups树的结构往下拼，比如/docker/<容器id>，之后进行递归操作，这一块有一点技巧性，本质上是目录的遍历操作。

可以这样理解，每次ListContainer操作实际上就是把对应的cgroups整个文件系统遍历了一次，之后按照对应的路径，吧文件系统的叶子节点存到map中返回。

这里有个问题，不加筛选的把cgroups下面的内容都遍历了一遍？在ubuntu上，容器的相关信息被放在对应的/docker目录下，在其他系统，比如centos上，容器被放在对应的/system.slice目录下。很有可能其他的某些使用cgroups文件系统的进程和cadvisor需要监控的进程发生混淆？还是说只要是cadvisor下面的进程都是cadvisor的监控对象？

这应该就是所谓的rawContainerHandler，就是从cgroups的视角去看，把受到cgroups目录树结构控制的进程都看做是一个raw的container。

有了上面的分析，对getContainerDiff的操作就更容易理解了。首先是按照上面的操作将所有的cgroups受控进程信息取出来。读取manager中已经记录的container信息和实际从cgroups中获取到的容器信息，二者进行比较，得到新add进来的容器以及已经删除掉的容器，以containerRefference数组的形式分别返回，这个就是getContainerDiff的全部操作。

显而易见，getContainersDiff应该会被多次调用，因为经常会需要检测有哪些容器被新加入或者删除。

###总结

可以看到manage部分都是围绕manager组件进行操作的，主要的逻辑就是先将root容器注册进去之后，之后以root容器为起点，进行detectsubcontainer的操作，更新删除容器信息。具体的存储在内存中的信息就是containerStates的结构。这也只是cadvisor能提供的所有信息中的一部分，之后定期进行housekeeping操作，更新容器的状态。

在入门篇中也提到，在生成containerManager的时候要把inMemoryCache对象传入进去，之后存储manager就会通过inMemoryCache来对存储相关的操作进行进一步的控制。更详细地说，是所用生成的containerData实例持有一个对inMemoryCache的指针，进行具体操作。

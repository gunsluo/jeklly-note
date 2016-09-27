---
layout: post
title: "Cadvisor源码分析（四）"
subtitle: "Docker监控数据采集Cadvisor源码分析API篇" 
tags: "docker cadvisor 监控"
date: 2016-09-27 18:23:47 +0800
categories: docker
  - 
---

这一部分主要是从API的角度进行分析，cadvisor提供的API是怎样暴露的，怎样注册上来的，以及具体功能是怎样的，由于内容比较琐碎，也是一点一点逐步再完善。

###具体API分析

现在从另外一个维度进行分析，看cadvisor究竟提供了哪些服务出来。 具体api的实现在./cadvisor/api文件中，可以看到目前有newversion1_1 1_2 1_3 2_0几种版本，我们以2_0版本分析。

从start函数中的`cadvisorhttp.RegisterHandlers`执行具体注册的功能，可以看到除了注册普通的api，还注册了用于性能调优的一些api。这里注册api也没有使用什么特别的框架，直接使用golang自带的serverMux的相关操作，比较容易理解，不再赘述。

这里基本上把所有的request的情况写在了一个函数里，显的比较low，比起kube-apiserver来说，注册api这部分的复杂程度上，简直是差了好几个档次，别的不知道，就扩展性来说，显然不太行，不过考虑cadvisor也都仅仅是需要处理一些get请求，估计不会用到太复杂的api的参数，这样也算是满足需求，不需要杀鸡用牛刀了。

在handleRequest函数中，对传来的request做了第一层处理，即截取出用户输入的api版本，并且交给对应的APIVersion的HandleRequest函数来处理，还要注意，这里每次都要把manager传进去，因为实际的取信息的操作都是通过manager来进行的。

我们这里直接以2.0版本的api为例，分析下对外都暴露出了哪些信息，这些信息是怎样获取到的：

v2.0版本有对应的option通过URL的query传递过来：

* IdType string 指定通过哪种方式识别容器名称，可以是name dockerid 或者 dockeralias
* Count int指定返回的stats的数目
* Recursive bool 是否递归地返回childrencontainer的信息

下面分析下几种不同的requestType:

**/api/v2.0/stats**

具体的每个容器的特别详细的信息可以通过这个API得到。

containerStats的信息比较丰富，包含每个子系统中的具体的信息。ContainerInfo中包含ContainerSpec以及ContainerStats数组，每隔一段时间就会记录一次ContainerStat信息。通过cout的参数控制，可以输出最新的几条containerstats信息。

通过管理篇的分析，可以知道，在createContainer的最后一步，是通过houskeeping的操作不断地updateStats然后存到memoryCache中，这里关键是看下updateStates的时候各部分信息是如何获取到的。

这部分的信息比较复杂，应该是容器主要搜集的信息来源，可以通过下面的图大致看一下具体那部分信息在程序中是怎么得到的。关于每一部分的具体含义来源，以及搜集时候的具体实现可以参考[这一篇]()

![Alt text](http://7xn7vm.com1.z0.glb.clouddn.com/metrics.001.jpeg "Cadvisor source code 1")

**/api/v2.0/version**

注意下使用golang自带的system package进行系统调用的方式（之前每次都是自己写一个命令之后去system.run），注意一些获取信息的技巧，可以避免很多繁琐的操作。虽然这一步内部manager得到的信息比较多，但是实际返回回来的之后cadvisor的version信息

| 指标 | 来源 |
| :---: | :---: |
| 主机的os版本信息 | uname系统调用 |
| 容器所运行的os版本 | /etc/os-release 文件中 读取PRETTY_NAME |
| dockerdeamon的版本信息 | dockerdaemon get version |
| cadvisor本身的版本信息 | gobuild的时候从ldflags参数传入 |

**/api/v2.0/attributes**

| 指标 | 来源 |
| :---: | :---: |
| machine info | manager中的machine info结构体 主要是/proc/文件系统 |
| version info | /api/v2.0/version中所提到的操作 |

具体实例是在new manager的时候生成的

```bash
type MachineInfo struct {
	// The number of cores in this machine.
	NumCores int `json:"num_cores"`

	// Maximum clock speed for the cores, in KHz.
	CpuFrequency uint64 `json:"cpu_frequency_khz"`

	// The amount of memory (in bytes) in this machine
	MemoryCapacity uint64 `json:"memory_capacity"`

	// The machine id
	MachineID string `json:"machine_id"`

	// The system uuid
	SystemUUID string `json:"system_uuid"`

	// The boot id
	BootID string `json:"boot_id"`

	// Filesystems on this machine.
	Filesystems []FsInfo `json:"filesystems"`

	// Disk map
	DiskMap map[string]DiskInfo `json:"disk_map"`

	// Network devices
	NetworkDevices []NetInfo `json:"network_devices"`

	// Machine Topology
	// Describes cpu/memory layout and hierarchy.
	Topology []Node `json:"topology"`

	// Cloud provider the machine belongs to.
	CloudProvider CloudProvider `json:"cloud_provider"`

	// Type of cloud instance (e.g. GCE standard) the machine is.
	InstanceType InstanceType `json:"instance_type"`

	// ID of cloud instance (e.g. instance-1) given to it by the cloud provider.
	InstanceID InstanceID `json:"instance_id"`
}
```
**/api/v2.0/machine**

这些信息包含在attribute中，直接返回machineinfo。

**/api/v2.0/ps**

这个会返回所有cgroup中的容器的信息，这个容器作为一个进程会显示出哪些信息，后面可以添加容器id信息，显示对应容器的ps信息(从manager存储的map中取出对应的containerData之后从中再进行筛选)： 比如：

```bash
curl 127.0.0.1:8080/api/v2.0/ps/docker/4f61cb209b685085d5b575173bfa7a5bca822233ae47131ed43033e41fe6505d |python -m json.tool[
{
    "cgroup_path": "",
    "cmd": "sh",
    "parent_pid": 13823,
    "percent_cpu": 0,
    "percent_mem": 0,
    "pid": 18957,
    "rss": 671744,
    "running_time": "00:00:00",
    "start_time": "20:18",
    "status": "Ss+",
    "user": "root",
    "virtual_size": 4546560    
}]
```
**/api/v2.0/spec/**

返回对应的ContainerSpec,比如,这个显示的是容器的spec的信息，显然比起machine的信息要少了好多，就相当于是一个统计清单，看哪些指标包含，哪些指标不包含，比较宏观的一个统计结果：

```bash
curl 127.0.0.1:8080/api/v2.0/spec/docker/4f61cb209b685085d5b575173bfa7a5bca822233ae47131ed43033e41fe6505d |python -m json.tool{
    "/docker/4f61cb209b685085d5b575173bfa7a5bca822233ae47131ed43033e41fe6505d": {
        "aliases":["serene_panini","4f61cb209b685085d5b575173bfa7a5bca822233ae47131ed43033e41fe6505d"],
        "cpu": {
            "limit": 1024,
            "mask": "0-1",
            "max_limit": 0
        },
        "creation_time": "2016-01-24T12:18:20.067581725Z",
        "has_cpu": true,
        "has_custom_metrics": false,
        "has_diskio": true,
        "has_filesystem": true,
        "has_memory": true,
        "has_network": true,
        "image": "ubuntu:14.04",
        "memory": {
            "limit": 18446744073709551615,
            "swap_limit": 18446744073709551615
        },
        "namespace": "docker"
    }
}
```

**/api/v2.0/storage**

主要是文件系统的信息，比如下面结果

```bash
curl 127.0.0.1:8080/api/v2.0/storage/ |python -m json.tool
[
    {
        "available": 321901092864,
        "capacity": 483753484288,
        "device": "/dev/disk/by-uuid/ab42c0eb-a891-4261-90cf-557f75f61f15",
        "labels": [
            "root",
            "docker-images"
        ],
        "mountpoint": "/",
        "usage": 137255526400
    }
]
```

**/api/v2.0/summary**

通过containerData中的summaryreader来获取某个cgroups下面容器的某段时间的摘要信息。目前主要追踪的是cpu以及memory的信息。在statsSummary结构中有具体计算每个属性的方式，包括小时的平均信息，分钟的平均信息，等等。

**/api/v2.0/appmetrics**

可以自定义metrics信息。

###从对外暴露的api的角度进行分析

info结构得到的信息

```go
{
    "BridgeNfIp6tables": true,
    "BridgeNfIptables": true,
    "Containers": 36,
    "CpuCfsPeriod": true,
    "CpuCfsQuota": true,
    "Debug": false,
    "DockerRootDir": "/var/lib/docker",
    "Driver": "aufs",
    "DriverStatus": [
        [
            "Root Dir",
            "/var/lib/docker/aufs"
        ],
        [
            "Backing Filesystem",
            "extfs"
        ],
        [
            "Dirs",
            "244"
        ],
        [
            "Dirperm1 Supported",
            "false"
        ]
    ],
    "ExecutionDriver": "native-0.2",
    "ExperimentalBuild": false,
    "HttpProxy": "",
    "HttpsProxy": "",
    "ID": "ZL2B:AQMX:2S7E:H3PG:V7P6:ITIE:AFEO:P6OL:HPAJ:QFCW:PR6D:PCPG",
    "IPv4Forwarding": true,
    "Images": 172,
    "IndexServerAddress": "https://index.docker.io/v1/",
    "InitPath": "/usr/lib/docker/dockerinit",
    "InitSha1": "1f4a3c648015cae3b3d76c5ba2980d8c1f88f388",
    "KernelVersion": "3.13.0-24-generic",
    "Labels": null,
    "LoggingDriver": "json-file",
    "MemTotal": 8373075968,
    "MemoryLimit": true,
    "NCPU": 4,
    "NEventsListener": 0,
    "NFd": 90,
    "NGoroutines": 157,
    "Name": "ubuntu",
    "NoProxy": "",
    "OomKillDisable": true,
    "OperatingSystem": "Ubuntu 14.04 LTS",
    "RegistryConfig": {
        "IndexConfigs": {
            "docker.io": {
                "Mirrors": null,
                "Name": "docker.io",
                "Official": true,
                "Secure": true
            },
            "k8stestreg:5000": {
                "Mirrors": [],
                "Name": "k8stestreg:5000",
                "Official": false,
                "Secure": false
            }
        },
        "InsecureRegistryCIDRs": [
            "127.0.0.0/8"
        ],
        "Mirrors": null
    },
    "SwapLimit": false,
    "SystemTime": "2015-11-24T20:02:48.562597431+08:00"
}
```

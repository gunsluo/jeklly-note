---
layout: post
title:  "Docker实战应用"
subtitle:  "我在实际项目中使用Docker的经验和遇到的问题"
date:   2016-05-29 12:00:00 +0800
categories: docker
---
本篇文章是实践中使用docker，遇到到的问题并记录下。

###首先推荐docker的学习资料

1. [Docker —— 从入门到实践][docker-book-url]


###Docker安装
系统Ubuntu 14.04 内核3.13.0-65-generic
不多说直接给出安装命令，如果想源码编译的请上官网下载编译。

{% highlight bash %}
apt-get update
apt-get install wget

wget -qO- https://get.docker.com/ | sh
{% endhighlight %}

Ok, 安装完成。就是这么简单。检测安装的docker版本。

{% highlight bash %}
docker --version
{% endhighlight %}


###常用命令
docker安装成功，了解下常用命令。

{% highlight bash %}
#启动服务
/bin/systemctl restart  docker.service
#登录
docker login registry.rd.fyec.cn
#创建
docker build -t registry.rd.fyec.cn/redis-server .
#运行
docker run -t -i registry.rd.fyec.cn/centos:centos7 /bin/bash
#提交
docker push registry.rd.fyec.cn/virtual_ccb_server
#SSH
docker exec -i -t 8ec02d6b7234  bash
{% endhighlight %}

###Dockerfile
如何创建自己的docker镜像，当然是写dockerfile了。现在就来写个简单的dockerfile吧。
service是一个linux系统下的可运行文件

{% highlight bash %}
#基础镜像库
from registry.rd.fyec.cn/base:latest

#将service文件添加到docker镜像的/opt目录
ADD service /opt/service

#运行时暴露80端口
EXPOSE 80

#启动后运行/opt/service
CMD /opt/service
{% endhighlight %}

简单的Dockerfile写好了，当然是创建docker image了。
{% highlight bash %}
docker build -t <docker image name> <dockerfile path>
{% endhighlight %}

最后，当然是吧docker镜像启动起来

{% highlight bash %}
#启动并bash
docker run -t -i <docker image name> /bin/bash
{% endhighlight %}

###Docker Swarm
Swarm是Docker公司在2014年12月初发布的一套较为简单的工具，用来管理Docker集群，它将一群Docker宿主机变成一个单一的，虚拟的主机。Swarm使用标准的Docker API接口作为其前端访问入口，换言之，各种形式的Docker Client(docker client in go, docker_py, docker等)均可以直接与Swarm通信。Swarm几乎全部用Go语言来完成开发，上周五，4月17号，Swarm0.2发布，相比0.1版本，0.2版本增加了一个新的策略来调度集群中的容器，使得在可用的节点上传播它们，以及支持更多的Docker命令以及集群驱动。

Swarm deamon只是一个调度器（Scheduler）加路由器(router)，Swarm自己不运行容器，它只是接受docker客户端发送过来的请求，调度适合的节点来运行容器，这意味着，即使Swarm由于某些原因挂掉了，集群中的节点也会照常运行，当Swarm重新恢复运行之后，它会收集重建集群信息。

##安装Docker-swarm
有三台服务器, 这三台机器创建一个Docker集群 其中 i-238242qix (10.253.101.25) 同时充当swarm manager管理集群

| 机器名        | Ip          | 描述  |
| ------------- |-------------| -----   |
| i-238242qix   | 10.253.101.25 |  swarm manager|
| i-239z31k69   | 10.253.100.20 |  |
| i-238etvs5t   | 10.253.100.229|  |

Docker deamon 的监听端口 

{% highlight bash %}
vim /etc/default/docker
{% endhighlight %}

在文件后面添加
{% highlight bash %}
DOCKER_OPTS="-H 0.0.0.0:2375 -H unix:///var/run/docker.sock --graph /mnt/datadisk/docker --storage-driver btrfs"
{% endhighlight %}
`--graph`指定docker使用磁盘 `--storage-driver`指定文件系统

如果是使用consul配置Docker
{% highlight bash %}
DOCKER_OPTS="-H 0.0.0.0:2375 -H unix:///var/run/docker.sock -D --cluster-advertise 10.139.52.27:2375 --cluster-store consul://10.139.52.27:8500/swarm --graph /mnt/data/docker --storage-driver btrfs"
{% endhighlight %}


重启 Docker deamon
{% highlight bash %}
service docker restart
{% endhighlight %}

安装Docker官方提供的Swarm镜像
{% highlight bash %}
docker pull swarm
{% endhighlight %}
 
运行swarm manager
{% highlight bash %}
docker run -d -p 2376:2376 swarm manage -H :2376 --replication --advertise 10.168.10.198:2376 consul://10.168.10.198:8500/swarm
{% endhighlight %}

加入 swarm
{% highlight bash %}
docker run -d swarm join --advertise=10.168.10.198:2375 consul://10.168.10.198:8500/swarm
{% endhighlight %}

查看集群信息
{% highlight bash %}
docker -H 0.0.0.0:2376 info
{% endhighlight %}

###其他

共享主机目录
{% highlight bash %}
docker run -d -v ~/nginxlogs:/var/log/nginx -p 5000:80 -i nginx
{% endhighlight %}

持久化
{% highlight bash %}
docker create -v /tmp –name cmbdbf dev/file_agent 
docker run -t -i –volumes-from cmbdbf dev/file_agent /bin/bash 
echo “I’m not going anywhere” > /tmp/hi
exit
{% endhighlight %}


`这里只是列出常用命令，之后会将docker网络问题与docker-compose管理以例子列出`


[文章来源][source-url]

[source-url]: https://www.evernote.com/shard/s646/sh/b37d2247-f265-4ade-85b0-2c02ffbd67d7/07e9e0b60b3c7c501137fe0ea3a6360a

[docker-book-url]: https://www.gitbook.com/book/yeasy/docker_practice/details

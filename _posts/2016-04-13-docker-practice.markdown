---
layout: post
title:  "Docker实战应用"
subtitle:  "我在实际项目中使用Docker的经验和遇到的问题"
date:   2016-04-13 12:00:00 +0800
categories: docker
---
本篇文章是实践中使用docker，遇到到的问题并记录下。

###首先推荐docker的学习资料

1. [Docker —— 从入门到实践][docker-book-url]
2. [Docker —— 从入门到实践][docker-book-url]


###常用命令

`启动服务`
{% highlight bash %}
/bin/systemctl restart  docker.service
{% endhighlight %}
`登录`
{% highlight bash %}
docker login registry.rd.fyec.cn
{% endhighlight %}
`创建`
{% highlight bash %}
docker build -t registry.rd.fyec.cn/redis-server .
{% endhighlight %}
`运行`
{% highlight bash %}
docker run -t -i registry.rd.fyec.cn/centos:centos7 /bin/bash
{% endhighlight %}
`提交`
{% highlight bash %}
docker push registry.rd.fyec.cn/virtual_ccb_server
{% endhighlight %}
`SSH`
{% highlight bash %}
docker exec -i -t 8ec02d6b7234  bash
{% endhighlight %}

###Swarm

`运行swarm manager`
{% highlight bash %}
docker run -d -p 2376:2376 swarm manage -H :2376 --replication --advertise 10.168.10.198:2376 consul://10.168.10.198:8500/swarm
{% endhighlight %}

`加入 swarm`
{% highlight bash %}
docker run -d swarm join --advertise=10.168.10.198:2375 consul://10.168.10.198:8500/swarm
{% endhighlight %}


###其他

`共享主机目录`
{% highlight bash %}
docker run -d -v ~/nginxlogs:/var/log/nginx -p 5000:80 -i nginx
{% endhighlight %}

`持久化`
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

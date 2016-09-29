---
layout: post
title: "Docker安装步骤"
subtitle: "在ubuntu系统上Docker安装步骤及命令" 
tags: "docker 安装 ubuntu tool"
date: 2016-09-29 14:02:21 +0800
categories: docker
  - 
---

###安装要求
* ubuntu 64 bit系统
* 系统内核3.10及以上 命令`uname -r`

###安装步骤

**系统包更新**

```bash
sudo apt-get update
$ sudo apt-get install apt-transport-https ca-certificates
```

**增加GPG key**

```bash
sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
```

**增加下载源**

`vim /etc/apt/sources.list.d/docker.list` 添加以下内容：

- On Ubuntu Precise 12.04 (LTS)

```bash
deb https://apt.dockerproject.org/repo ubuntu-precise main
```

- On Ubuntu Trusty 14.04 (LTS)

```bash
deb https://apt.dockerproject.org/repo ubuntu-trusty main
```

- On Ubuntu Wily 15.10

```bash
deb https://apt.dockerproject.org/repo ubuntu-wily main
```

- On Ubuntu Xenial 16.04 (LTS)

```bash
deb https://apt.dockerproject.org/repo ubuntu-xenial main
```

**系统包更新**

```bash
sudo apt-get update
```

**删除旧Docker**

```bash
sudo apt-get purge lxc-docker
```

**验证安装Docker**

```bash
apt-cache policy docker-engine
```

**安装依赖包**

```bash
sudo apt-get update
sudo apt-get install linux-image-extra-$(uname -r) linux-image-extra-virtual
```

**安装Docker**

```bash
sudo apt-get install docker-engine
```

**启动Docker**

```bash
sudo service docker start
```

**验证Docker安装**

```bash
sudo docker run hello-world
```

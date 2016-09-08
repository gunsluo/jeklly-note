---
layout: post
title: "虚拟机安装Centos7 Min的网络问题"
subtitle: "安装min centos后，网络不能使用 - 吐槽不已"
tags: "Centtos7 min install 虚拟机 网络"
date: 2016-09-08 12:26:12
categories: kills
  - 
---

下载安装min Centos7到virtual box, 启动linux后网络是不可用。系统找不到网卡，查找原因是系统启动选项没加载。其次ifconfig常见命令也无法找到，需要手动安装net-tools。

###加载网络

1. 修改grub启动参数
`vim /etc/sysconfig/grub` 添加net.ifnames=0 biosdevname=0
> GRUB_CMDLINE_LINUX=”rd.lvm.lv=vg0/swap vconsole.keymap=us crashkernel=auto  vconsole.font=latarcyrheb-sun16 `net.ifnames=0 biosdevname=0` rd.lvm.lv=vg0/usr rhgb quiet”

2. 加载 `grub2-mkconfig -o /boot/grub2/grub.cfg`

###修改网卡名

如:网卡名en03修改成eth0


1. 修改网络文件名 `mv /etc/sysconfig/network-scripts/ifcfg-en03 /etc/sysconfig/network-scripts/ifcfg-eth0`

2. 修改网络设备名 `vim /etc/sysconfig/network-scripts/ifcfg-eth0`
> name=en03修改为name=eth0

###换源

使用国内aliyun源，加快下载速度。

```bash
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
yum makecache
```

###安装网络工具
```bash
yum install net-tools
```

###重启

`reboot`



---
layout: post
title: "Mac & Window10 双系统安装"
subtitle: "基于el capitan 和 window10 安装教程。自选硬件、UEFI启动、hackintosh驱动"
tags: "mac hackintosh el capitan window10 install 安装"
date: 2016-07-20 12:00:00 +0800
categories: tools
 -
---
本人使用mac pro 2015一段时间，深刻感受到mac pro对于开发者是如此的好用 - 爱不释手。同时也体会到pro硬件配置低引起的卡顿（图形渲染、virtual-box多开） 哎！由于经费和个人好奇心，于是...  开始吧

###我的需求

1. 装个hackintosh用于工作
2. 最好再装个window10。看看电影、打打游戏, 想想都嗨的不行。

###硬件选择
osx系统对硬件有要求，在选择CPU、主板、显卡是要特别注意。选择一不小心可能会在之后无法安装osx, 也可能无法驱动显卡，还可能出现莫名其妙的问题。选择硬件之前请一定查是否有人成功安装。其他的就不说，直接给出参考网站: [Mac硬件(可能需要翻墙)][mac-hardware-url]

###我的硬件

| 硬件类型 | 硬件型号 | ￥价格 |
| :---: | :--- | :---: |
| **CPU** | 英特尔（Intel）酷睿四核 i5-6500 | `1480.00` |
| **主板** | 技嘉（GIGABYTE）Z170-D3H主板 | `1000.00` |
| **显卡** | EVGA GTX950 2G SC ACX2.0 cooler | `1100.00` |
| **硬盘** | 三星(SAMSUNG) 850 EVO 250G SATA3 固态硬盘 | `580.00` |
| **硬盘** | 希捷(SEAGATE)1TB 7200转64M SATA3 台式机硬盘 | `330.00` |
| **内存** | 英睿达(Crucial)铂胜运动LT系列DDR4 2400 8G台式机内存 * 2 | `470.00` |
| **机箱** | 美商海盗船（USCorsair）SPEC-03 黑色红光 中塔机箱 | `350.00` |
| **水冷** | 美商海盗船（USCorsair）H55 CPU散热器 | `500.00` |

**注意：硬件之间要相互支持。我选择的主板不支持蓝牙，也没有买无线网卡，osx的airdrop功能无法使用。你可以选择带蓝牙功能的主板并配上带蓝牙功能的无线网卡（单独蓝牙硬件）**


###组装主机
自己看着办，我无能为力。

###制作El Capitan UEFI USB安装启动盘

1. 准备16G的USB盘和一台osx系统的电脑(如果只有window，请看后面)

2. 通过 “Mac App Store” 更新下载，请进"Mac App Store下载" Install OS X El Capitan
    ![Alt text](/img/post/install-osx-el-capitan.jpg "install os x el capitan")
    下载可能有点慢（可能需要翻墙）

3. 通过网盘下载，这里有小编亲手打包的"OS X El Capitan"镜像已上传到百度盘。提供下载
    - 文件名：安装 OS X El Capitan 1.7.28 2015-10-01.dmg
    - 百度盘 ：http://pan.baidu.com/s/1pLIMAD1
    - 提取码：593r

4. 格式话U盘，u盘名字为USB 
    ![Alt text](/img/post/mac-format.png "format usb")

5. 打开「应用程序」-「实用工具」-「终端」，复制下面的命令，并粘贴到「终端」里，按回车运行：{% highlight bash %}
sudo /Applications/Install\ OS\ X\ El\ Capitan.app/Contents/Resources/createinstallmedia --volume /Volumes/USB --applicationpath /Applications/Install\ OS\ X\ El\ Capitan.app —nointeraction
{% endhighlight %}

6. 下载[Cloverefiboot][Clover-url], 右键「show package contents 」。找到Clover_v2.3k_r3423-UEFI-UB.pkg，双击安装UEFI启动到U盘。
    ![Alt text](/img/post/clover-efi-boot.png "clover efi boot")

7. windows系统制作osx启动盘。请参考: [教程][window-oxs-usb-tutorial-url]

###修改Bios,UEFI方式启动U盘

1. 设置Bios 支持UEFI


###安装el capitan 到固态硬盘

1.选择install OS X
    ![Alt text](/img/post/mac-install-1.jpg "mac install")

2.选择语言
    ![Alt text](/img/post/mac-install-2.png "mac install")

3.选择你的固体硬盘
    ![Alt text](/img/post/mac-install-3.png "mac install")

4.格式化硬盘
    ![Alt text](/img/post/mac-install-4.png "mac install")

5.install OS X
    ![Alt text](/img/post/mac-install-5.png "mac install")

6.OS X 安装好了。
    ![Alt text](/img/post/mac-install-6.png "mac install")

[mac-hardware-url]: http://www.tonymacx86.com/buyersguide/march/2016
[Clover-url]: http://sourceforge.net/projects/cloverefiboot/
[window-oxs-usb-tutorial-url]: https://www.zhihu.com/question/19812727


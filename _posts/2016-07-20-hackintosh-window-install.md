---
layout: post
title: "(原) Mac & Window10 双系统安装"
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
    ![Alt text](http://ww3.sinaimg.cn/mw690/0065glrAgw1f62y34g8r3j30go0an0up.jpg "install os x el capitan")
    
    下载可能有点慢（可能需要翻墙）

3. 通过网盘下载，这里有小编亲手打包的"OS X El Capitan"镜像已上传到百度盘。提供下载
    - 文件名：安装 OS X El Capitan 1.7.28 2015-10-01.dmg
    - 百度盘 ：http://pan.baidu.com/s/1pLIMAD1
    - 提取码：593r

4. 格式话U盘，u盘名字为USB 
    ![Alt text](http://ww3.sinaimg.cn/mw690/0065glrAgw1f62y353duxj30no0kwaew.jpg "format usb")

5. 打开「应用程序」-「实用工具」-「终端」，复制下面的命令，并粘贴到「终端」里，按回车运行：{% highlight bash %}
sudo /Applications/Install\ OS\ X\ El\ Capitan.app/Contents/Resources/createinstallmedia --volume /Volumes/USB --applicationpath /Applications/Install\ OS\ X\ El\ Capitan.app —nointeraction
{% endhighlight %}

6. 下载[Cloverefiboot][Clover-url], 右键「show package contents 」。找到Clover_v2.3k_r3423-UEFI-UB.pkg，双击安装UEFI启动到U盘。
    ![Alt text](http://ww3.sinaimg.cn/mw690/0065glrAgw1f62y33z603j30kc0faq5t.jpg "clover efi boot")

7. windows系统制作osx启动盘。请参考: [教程][window-oxs-usb-tutorial-url]

###修改Bios,UEFI方式启动U盘

1. 设置Bios 支持UEFI
    ![Alt text](http://ww1.sinaimg.cn/mw690/0065glrAgw1f6325f8w00j3112112tds.jpg "bios")

    ![Alt text](http://ww1.sinaimg.cn/mw690/0065glrAgw1f6325mko1mj3112112gq5.jpg "bios")

    ![Alt text](http://ww1.sinaimg.cn/mw690/0065glrAgw1f632pgurc6j3112112dlk.jpg "bios")

###安装el capitan 到固态硬盘

1. 选择install OS X
    ![Alt text](http://ww2.sinaimg.cn/mw690/0065glrAgw1f62y35qv55j30hs0a03yn.jpg "mac install")

2. 选择语言
    ![Alt text](http://ww1.sinaimg.cn/mw690/0065glrAgw1f62y36gi2gj30se0l8dil.jpg "mac install")

3. 选择你的固体硬盘
    ![Alt text](http://ww3.sinaimg.cn/mw690/0065glrAgw1f62y379tqzj30sc0letac.jpg "mac install")

4. 格式化硬盘

    ![Alt text](http://ww3.sinaimg.cn/mw690/0065glrAgw1f62y37whnrj30hs0dcmys.jpg "mac install")

5. install OS X

    ![Alt text](http://ww1.sinaimg.cn/mw690/0065glrAgw1f62y38zx9oj30hs0dejs1.jpg "mac install")

6. OS X 安装好了。
    ![Alt text](http://ww3.sinaimg.cn/mw690/0065glrAgw1f62y39uiedj30hs0ddgpl.jpg "mac install")

###Hackintosh驱动篇
Hackintosh的驱动是最为麻烦的，显卡使用相对型号的web driver。驱动的详细安装介绍另起文章说明。

###安装Window 10前准备

1. 调整安装OSX固态盘大小，腾出硬盘空间安装Window 10
    - 我的固态硬盘大小250G，170G安装Mac，80G安装Window 10

* 打开「应用程序」-「实用工具」-「终端」

{% highlight bash %}
diskutil list
{% endhighlight %}

* 调整硬盘大小

{% highlight bash %}
sudo diskutil resizeVolume /dev/disk0s2 170GB 
{% endhighlight %}

* 调整后硬盘大小

    ![Alt text](http://ww2.sinaimg.cn/mw690/0065glrAgw1f62z9gmspmj30hk04w0tv.jpg "win install")

###制作Window 10 UEFI U盘

1. 下载Window 10 iso安装文件，最好选择64bit的安装包。[下载地址][msdn-i-tell-you-url]

2. 格式化U盘，请务必选择「MS-DOS(FAT)」

3. 在「launchpad」中打开「Boot Camp Assistant」
    ![Alt text](http://ww3.sinaimg.cn/mw690/0065glrAgw1f6303tw70sj30ov0ic40x.jpg "win install")

4. 点「continue」继续

5. 选择下载的Window 10.ISO文件，「continue」写入U盘
    ![Alt text](http://ww2.sinaimg.cn/mw690/0065glrAgw1f6307aur77j30ov0icabm.jpg "win install")

###安装Window10

1. 重启系统，U盘启动进入Window安装

2. 选择没有使用的80G作为Window安装盘
    ![Alt text](http://ww2.sinaimg.cn/mw690/0065glrAgw1f630qfhsd4j31560obwh7.jpg "win install")

3. 点「install」安装
    ![Alt text](http://ww2.sinaimg.cn/mw690/0065glrAgw1f6313mpr9yj314t0mrgnp.jpg "win install")

4. 安装成功
    ![Alt text](http://ww2.sinaimg.cn/mw690/0065glrAgw1f630qmkiiwj316c0paacx.jpg "win install")

###修改Window10引导启动

1. 重启系统，进入Mac系统

* 打开「应用程序」-「实用工具」-「终端」, 挂载EFI启动盘

{% highlight bash %}
diskutil mount /dev/disk0s1
{% endhighlight %}

2. 将Mac的EFI引导程序拷贝到microsoft
    ![Alt text](http://ww1.sinaimg.cn/mw690/0065glrAgw1f631iu7n22j30s70ef0us.jpg "win install")

3. 备份原有bootmgfw.efi 用mac的BOOTX64.efi替换到bootmgfw.efi
    ![Alt text](http://ww1.sinaimg.cn/mw690/0065glrAgw1f631j2zabfj30s70efdj1.jpg "win install")

4. 重启系统，选择你想进入的系统吧
    ![Alt text](http://ww2.sinaimg.cn/mw690/0065glrAgw1f63254x49hj3112112wi4.jpg "win install")

[mac-hardware-url]: http://www.tonymacx86.com/buyersguide/march/2016
[Clover-url]: http://sourceforge.net/projects/cloverefiboot/
[window-oxs-usb-tutorial-url]: https://www.zhihu.com/question/19812727
[msdn-i-tell-you-url]: http://www.itellyou.cn


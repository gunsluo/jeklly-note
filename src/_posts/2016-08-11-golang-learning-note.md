---
layout: post
title: "golang learning note"
tags:

title: "(原) Golang学习笔记"
subtitle: "Golang学习过程中记录笔记，帮助理解"
tags: "golang language goroutine channel 语法"
date: 2016-08-10 12:00:00 +0800
categories: kills
 -
---

###源码笔记

源码[github-Jerrylou][jerrylou-github-url]

###推荐书籍
 - https://github.com/gunsluo/Learning-Go-zh-cn
 - https://www.gitbook.com/book/bingohuang/effective-go-zh-en/details


###优势

**并行**

Go 让函数很容易成为非常轻量的线程。这些线程在Go 中被叫做goroutines；

**Channel**

这些goroutines 之间的通讯由channel完成；

**低依赖**

可直接编译成机器码，不依赖其他库，glibc的版本有一定要求，部署就是扔一个文件上去就完成

**安全**

当转换一个类型到另一个类型的时候需要显式的转换并遵循严格的规则。Go 有
垃圾收集，在Go 中无须free()，语言会处理这一切；

**标准格式化**

Go 程序可以被格式化为程序员希望的（几乎）任何形式，但是官方格式是存在
的。标准也非常简单：gofmt 的输出就是官方认可的格式；

**编码统一**

任何地方都是UTF-8 的，包括字符串以及程序代码。

**开源**

Go 的许可证是完全开源的，参阅Go 发布的源码中的LICENSE 文件；

**静态语言**

编译很快，执行也很快。编译时间用秒计算；动态语言，缺少编译过程，低级错误频出;
高效率（相对于其它静态语言C/C++的问题）
  - 开发效率低，对开发者要求高
  - libc只向后兼容，运维难度偏大

**跨平台**

windows linux osx

**语法简单**

###缺点
  - Go的import包不支持版本，有时候升级容易导致项目不可运行，所以需要自己控制相应的版本信息
  - Go的goroutine一旦启动之后，不同的goroutine之间切换不是受程序控制，runtime调度的时候，需要严谨的逻辑，不然goroutine休眠
  - 无异常处理机制

###性能
 * https://benchmarksgame.alioth.debian.org/u64q/go.html
 * http://mrcook.uk/golang-vs-java-performance

###规范

**gofmt**
> 大部分的格式问题可以通过gofmt解决，gofmt自动格式化代码，保证所有的go代码一致的格式。
> 正常情况下，采用Sublime编写go代码时，插件GoSublilme已经调用gofmt对代码实现了格式化。

命名应该采用有意义的字符，尽量做到见名识意。

**包名**
> 包名统一采用小写单词，不得使用下划线或者混合大小写。

**接口名**
> 接口名统一以大写字母 "I" 开头，后续采用驼峰结构。
> 官方 - 单个函数的接口名以"er"作为后缀，如Reader,Writer
> 接口的实现则去掉“er”

**结构体名**
> 结构体名统一采用驼峰命名结构，不得出现下划线，结合是否可导出确定首字母大小写。

**常量**
> 常量统一采用大写字母，单词之间使用下划线进行分隔。如果是包可见的常量，可在其名字前加上 "k_" 作为前缀。可导出常量与不可导出常量应该分开声明，不得出现在同一常量声明块内。

**变量 全局变量**
> 采用驼峰结构命名，结合是否可导出确定首字母大小写，不得出现下划线。可导出变量与不可导出变量应该分开声明，不得出现在同一变量声明块内。

**形参**
> 采用驼峰结构命名，首字母必须小写，不得出现下划线。

**局部变量**
> 采用驼峰结构命名，首字母必须小写，不得出现下线线。

**函数（方法）**
  - 采用驼峰结构命名，结合是否可导出确定首字母大小写，不得出现下划线；
  - 返回值必须命名，采用驼峰结构命名，首字母必须小写，不得出现下划线；
  - 方法的接收者统一命名 this，接收者类型统一采用指针，特殊情况除外；
  - 如果接收者是 map, slice 或者 chan，则不要用指针传递；

###Goroutine
> golang容许你创建成千上万的goroutine，和原生系统级线程不同，goroutine的调度并不是由系统内核来完成，而是golang自己的sched调度系统来完成。golang的sched调度系统采用比较著名的work-steel算法，大家都知道该算法里最核心的一个数据结构就是一个任务队列，如何保证高并发下该队列的正确性是该算法的重点，比较熟悉java的同学应该知道，大师doug lea威廉叔叔的fork-join并发框架采用一个64位 volatile long字段来保证队列的高并发不加锁的实现

* http://morsmachine.dk/go-scheduler


###框架
 * beego
 * gin
 * echo
 * martini
 * revel

###Ide
 * sublime text 3
 * Visual Studio Code
 * idea
 * vim

[jerrylou-github-url]: https://github.com/gunsluo/learning-note-go

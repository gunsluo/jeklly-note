---
layout: post
title: "Git原理简介"
subtitle: "Git如何实现？实现原理是什么？"
tags:
date: 2016-09-12 11:24:26 +0800
categories: tools
  - 
---

###Git是什么？
git是软件开发版本控制系统，类似linux文件系统的实现(当然比linux文件系统简单)。

###Git对象

Git是如何将文件进行存储？如何将相同文件不同提交进行分割?都依赖与Git对象

* repository(Tree)
* Tree对象(多commit)
* Commit对象(Blob)
* Blob对象(存储)

###举例说明

**初始化Git**

```bash
mkdir gittest
cd gittest
git init
```

查看目录结构`tree .git`

```bash
.git
├── branches
├── config
├── description
├── HEAD
├── hooks
│   ├── applypatch-msg.sample
│   ├── commit-msg.sample
│   ├── post-update.sample
│   ├── pre-applypatch.sample
│   ├── pre-commit.sample
│   ├── prepare-commit-msg.sample
│   ├── pre-push.sample
│   ├── pre-rebase.sample
│   └── update.sample
├── info
│   └── exclude
├── objects
│   ├── info
│   └── pack
└── refs
    ├── heads
    └── tags
```
- branches - 新版本不在使用
- config - Git项目特有的配置
- description - GitWeb 程序使用
- HEAD - 文件指向当前分支
- hooks - 客户端或服务端钩子脚本
- info - .gitignore 文件中管理的忽略模式 (ignored patterns) 的全局可执行文件
- objects - Git对象存储目录
- refs - 目录存储指向数据 (分支) 的提交对象的指针

**添加文件到Git**

添加： `echo 'version 1' > test.txt` `git add test.txt`

查看： `find .git/objects -type f` 结果如下：

```bash
.git/objects/83/baae61804e65cc73a7201a7252750c76066a30
```

查看对象类型： `git cat-file -t 83baae61804e65cc73a7201a7252750c76066a30` 结果如下：

```bash
blob
```

查看对象内容： `git cat-file -p 83baae61804e65cc73a7201a7252750c76066a30` 结果如下：

```bash
version 1
```

**提交文件到Git**

提交： `git commit -a -m "firt commit"`

查看： `find .git/objects -type f` 结果如下：

```bash
.git/objects/83/baae61804e65cc73a7201a7252750c76066a30
.git/objects/d8/329fc1cc938780ffdd9f94e0d364e0ea74f579
.git/objects/6d/c9727a5974bb610f81c22914081d7e6373ae77
```
objects目录新生成了两个对象，这两个对象类型内容是什么呢？我们来看下

查看类型：`git cat-file -t d8329fc1cc938780ffdd9f94e0d364e0ea74f579`

```bash
tree
```

查看内容：`git cat-file -p d8329fc1cc938780ffdd9f94e0d364e0ea74f579`

```bash
100644 blob 83baae61804e65cc73a7201a7252750c76066a30	test.txt
```

查看类型：`git cat-file -t 6dc9727a5974bb610f81c22914081d7e6373ae77`

```bash
commit
```

查看内容：`git cat-file -p 6dc9727a5974bb610f81c22914081d7e6373ae77`

```bash
tree d8329fc1cc938780ffdd9f94e0d364e0ea74f579
author jerrylou <gunsluo@gmail.com> 1473652081 +0800
committer jerrylou <gunsluo@gmail.com> 1473652081 +0800

firt commit
```

综上git存储都是通过blob，commit，tree对象。blob存储文件提交内容，commit存储操作提交信息，tree存储指向blob的指针。

###结构
Git repository是很多不同commit的集合，是有向无环图。如下:

```bash
A---B---C---D---E---F--- master
    \       /   \
    G------H    I---J--- feature
```

###merge和rebase
新的特性分支feature上有F,G两个commit。我们项将feature上的改动同步到master，可以feature分支merge到master。将得到如下:

```bash
A---B---C---D--- master
    \       /
    F------G----- feature
```
我们会发现D节点有两个父节点C和G，经常做merge操作会导致无法得到正确的修改历史。

使用rebase，得到如下:

```bash
A---B---C---D------ master
            \
            F---G---feature
```
不用担心修改历史

###命令

![Alt text](http://ww4.sinaimg.cn/mw690/0065glrAgw1f7qrk2hl4wj30nt0gugrq.jpg "git command")

* git clone - 下载git源码
* git pull --rebase origin master - 同步远程master分支到本地
* git push origin master - 提交当前分支到远程master分支
* git stash [pop] - 换成修改commit

###解决冲突
当做了新的功能准备提交代码时，第一件事同步要合入分支代码(如dev)

1. git pull --rebase origin dev
2. 提示冲突先修改冲突文件保证代码正确
3. git add 冲突文件
4. git rebase --contunie
5. 如还有冲突，跳到第二步，直到无冲突

长时间不rebase主分支容易发生冲突。


###我的.gitconfig配置

```bash
[alias]
	st = status -sb
	br = branch -vv
    ds = diff --staged
    standup = log --since '1 day ago' --oneline --author sebastian@kusnier.net
    lastweek = log --since '1 week ago' --oneline
    ci = commit
    amend = commit --amend -C HEAD
    undo = reset --soft HEAD^
    co = checkout
    df = diff
    dc = diff --cached
    lg = log -p
    lol = log --graph --decorate --pretty=oneline --abbrev-commit
    lola = log --graph --decorate --pretty=oneline --abbrev-commit --all
    l = log --pretty=oneline -n 20 --graph
    graph = log --graph --pretty=format':%C(yellow)%h%Cblue%d%Creset %s %C(white) %an, %ar%Creset'
    ls = ls-files
    g  = grep -I
    vd = difftool -y -t gvimdiff
    p = !"git pull; git submodule foreach git pull origin master"
    undopush = push -f origin HEAD^:master
    # Credit an author on the latest commit
    credit = "!f() { git commit --amend --author \"$1 <$2>\" -C HEAD; }; f"

    # Show files ignored by git:
    ign = ls-files -o -i --exclude-standard
[user]
	name = jerrylou
	email = gunsluo@gmail.com
[core]
	editor = /usr/local/bin/vim
	excludesfile = /Users/jerrylou/.gitignore_global
    pager = cat
    autocrlf = input
[difftool "Kaleidoscope"]
    cmd = ksdiff --partial-changeset --relative-path \"$MERGED\" -- \"$LOCAL\" \"$REMOTE\"
[diff]
    tool = Kaleidoscope
[difftool]
    prompt = false
[mergetool "Kaleidoscope"]
    cmd = ksdiff --merge --output \"$MERGED\" --base \"$BASE\" -- \"$LOCAL\" --snapshot \"$REMOTE\" --snapshot
    trustExitCode = true
[mergetool]
    prompt = false
    keepBackup = true
[merge]
    tool = Kaleidoscope
    log = true
    summary = true
[difftool "sourcetree"]
	cmd = opendiff \"$LOCAL\" \"$REMOTE\"
	path = 
[mergetool "sourcetree"]
	cmd = /Applications/SourceTree.app/Contents/Resources/opendiff-w.sh \"$LOCAL\" \"$REMOTE\" -ancestor \"$BASE\" -merge \"$MERGED\"
	trustExitCode = true
```

###参考

* [Git内部原理](http://iissnan.com/progit/html/zh/ch9_1.html)


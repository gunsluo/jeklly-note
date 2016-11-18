---
layout: post
title: "Centos7 安装 Gitlab CE"
subtitle: "centos7系统安装gitlab CE，搭建自己的代码服务器"
tags: "gitlab install centos"
date: 2016-11-18 10:18:00 +0800
categories: deploy
 -
---

###安装依赖

```bash
sudo yum install curl policycoreutils openssh-server openssh-clients
sudo systemctl enable sshd
sudo systemctl start sshd
sudo yum install postfix
sudo systemctl enable postfix
sudo systemctl start postfix
sudo firewall-cmd --permanent --add-service=http
sudo systemctl reload firewalld
```

###测试发送邮件

```bash
echo "Test mail from postfix" | mail -s "Test Postfix" xxx@xxx.com
```

###添加安装源

```bash
curl -sS https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.rpm.sh | sudo bash
```

###更新为国内源

新建 /etc/yum.repos.d/gitlab-ce.repo，内容为

```bash
[gitlab-ce]
name=gitlab-ce
baseurl=http://mirrors.tuna.tsinghua.edu.cn/gitlab-ce/yum/el7
repo_gpgcheck=0
gpgcheck=0
enabled=1
gpgkey=https://packages.gitlab.com/gpg.key
```

```bash
sudo yum makecache
```

###安装

```bash
sudo yum install gitlab-ce
```

###修改配置

`vim /etc/gitlab/gitlab.rb`

```bash
gitlab_rails['gitlab_email_from'] = 'gitlab@example.com'

external_url 'http://10.128.31.109'
```

###编译启动

```bash
sudo gitlab-ctl reconfigure
```

###问题

1. 在浏览器中访问GitLab出现502错误。
   原因：内存不足。
   解决办法：检查系统的虚拟内存是否随机启动了，如果系统无虚拟内存，则增加虚拟内存，再重新启动系统。

2. 8080端口冲突。
   原因：由于unicorn默认使用的是8080端口。
   解决办法：打开/etc/gitlab/gitlab.rb,打开# unicorn['port'] = 8080 的注释，将8080修改为9090，保存后运行sudo gitlab-ctl reconfigure即可。

3. GitLab头像无法正常显示
   原因：gravatar被墙
   解决办法：编辑 `/etc/gitlab/gitlab.rb`，将

```bash
#gitlab_rails['gravatar_plain_url'] = 'http://gravatar.duoshuo.com/avatar/%{hash}?s=%{size}&d=identicon'
```

修改为：

```bash
gitlab_rails['gravatar_plain_url'] = 'http://gravatar.duoshuo.com/avatar/%{hash}?s=%{size}&d=identicon'
```

然后在命令行执行：

```bash
sudo gitlab-ctl reconfigure 
sudo gitlab-rake cache:clear RAILS_ENV=production
```

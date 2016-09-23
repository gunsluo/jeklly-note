---
layout: post
title: "(原) 多节点Open-falcon部署"
subtitle: "小米开源项目open-falcon - 互联网企业级监控产品"
tags: "open-falcon 监控 互联网 golang python"
date: 2016-08-06 12:30:00 +0800
categories: tools
 -
---
本文档对多节点负载open-falcon部署配置说明。请阅读[官方参考文档][open-falcon-org-url]

![Alt text](http://ww4.sinaimg.cn/mw690/0065glrAgw1f6jxj0iaugj31270pcjwo.jpg "open-falcon arch")

###机器部署
系统：Centos7

| 主机名 | 主机IP | 备注 |
| :---: | :--- | :---: |
| **falconpoc01** | 10.128.31.136 | open-falcon模块测试机 |
| **falconpoc02** | 10.128.31.137 | open-falcon模块测试机 |
| **falconpoc03** | 10.128.31.138 | open-falcon数据测试机 |

###模块部署展示

| 模块 | 主机名 | 主机IP | 备注 |
| :---: | :--- | :--- | :---: |
| **hbs**  | falconpoc01 | 10.128.31.136 | 心跳服务 |
| **hbs**  | falconpoc02 | 10.128.31.137 | 心跳服务 |
| **judge**  | falconpoc01 | 10.128.31.136 | 告警判断 |
| **judge**  | falconpoc02 | 10.128.31.137 | 告警判断 |
| **graph**  | falconpoc01 | 10.128.31.136 | 存储绘图 |
| **graph**  | falconpoc02 | 10.128.31.137 | 存储绘图 |
| **transfer**  | falconpoc01 | 10.128.31.136 | 数据转发 |
| **transfer**  | falconpoc02 | 10.128.31.137 | 数据转发 |
| **query**  | falconpoc01 | 10.128.31.136 | 绘图查询 |
| **query**  | falconpoc02 | 10.128.31.137 | 绘图查询 |
| **dashboard**  | falconpoc01 | 10.128.31.136 | 用户查询 |
| **dashboard**  | falconpoc02 | 10.128.31.137 | 用户查询 |
| **uic**  | falconpoc01 | 10.128.31.136 | 用户管理 |
| **uic**  | falconpoc02 | 10.128.31.137 | 用户管理 |
| **portal**  | falconpoc01 | 10.128.31.136 | 策略配置 |
| **portal**  | falconpoc02 | 10.128.31.137 | 策略配置 |
| **alarm**  | falconpoc01 | 10.128.31.136 | 报警事件 |
| **sender**  | falconpoc01 | 10.128.31.136 | 报警通知 |
| **task**  | falconpoc01 | 10.128.31.136 | 定时任务 |
<br />

|  | 主机名 | 主机IP | 备注 |
| :---: | :--- | :--- | :---: |
| **mysql**  | falconpoc03 | 10.128.31.138 | mysql数据库 |
| **redis**  | falconpoc03 | 10.128.31.138 | redis数据库 |
| **sms**  | falconpoc03 | 10.128.31.138 | 短信接口 |
<br />

| 模块 | 主机名 | 主机IP | 备注 |
| :---: | :--- | :--- | :---: |
| **agent**  | falconpoc01 | 10.128.31.136 | 指标采集 |
| **agent**  | falconpoc02 | 10.128.31.137 | 指标采集 |
| **agent**  | falconpoc03 | 10.128.31.138 | 指标采集 |

###环境部署

####更新centos7源

{% highlight bash %}
 mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
 wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
 yum makecache
{% endhighlight %}

####安装MySQL

{% highlight bash %}
yum install mysql

wget http://dev.mysql.com/get/mysql-community-release-el7-5.noarch.rpm
rpm -ivh mysql-community-release-el7-5.noarch.rpm
yum install mysql-community-server

service mysqld restart
{% endhighlight %}

#####或者

{% highlight bash %}
yum install mariadb-server mariadb

systemctl start mariadb  #启动MariaDB
systemctl stop mariadb  #停止MariaDB
systemctl restart mariadb  #重启MariaDB
systemctl enable mariadb  #设置开机启动
{% endhighlight %}


#####远程访问
{% highlight bash %}
mysql -u root 
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'password' WITH GRANT OPTION;
flush privileges;
{% endhighlight %}

####安装Redis

{% highlight bash %}
yum install gcc
{% endhighlight %}

#####下载
{% highlight bash %}
wget http://download.redis.io/releases/redis-3.0.0.tar.gz
tar zxvf redis-3.0.0.tar.gz
cd redis-3.0.0

#如果不加参数,linux下会报错
make MALLOC=libc

cp src/redis-server /usr/bin/
cp src/redis-cli /usr/bin/
mkdir -p /etc/redis
cp redis.conf /etc/redis/
{% endhighlight %}

#####配置redis
{% highlight bash %}
vim /etc/redis/ redis.conf
bind 0.0.0.0
daemonize yes
{% endhighlight %}

#####启动redis
{% highlight bash %}
/usr/bin/redis-server /etc/redis/redis.conf
{% endhighlight %}


#####登录redis
{% highlight bash %}
/usr/bin/redis-cli
{% endhighlight %}

#####关闭redis
{% highlight bash %}
/usr/bin/redis-cli shutdown
{% endhighlight %}

####初始化MySQL数据

{% highlight bash %}
#下载初始化脚步
git clone https://github.com/open-falcon/scripts.git
cd ./scripts/
mysql -h localhost -u root --password="" < db_schema/graph-db-schema.sql
mysql -h localhost -u root --password="" < db_schema/dashboard-db-schema.sql

mysql -h localhost -u root --password="" < db_schema/portal-db-schema.sql
mysql -h localhost -u root --password="" < db_schema/links-db-schema.sql
mysql -h localhost -u root --password="" < db_schema/uic-db-schema.sql
{% endhighlight %}

####Python环境
{% highlight bash %}
yum install mysql
yum install mysql-devel
yum install -y python-virtualenv
{% endhighlight %}

#####pip换源
{% highlight bash %}
vim ~/.pip/pip.conf

[global]
index-url = http://pypi.douban.com/simple
trusted-host = pypi.douban.com
{% endhighlight %}

###模块单点部署

> 先从模块单点开始部署，完成后再部署多点。前期条件有限，先将open-falcon模块部署falconpoc01服务器，之后再部署相同的模块到falconpoc02。

内部模块相互访问使用host名称，方便于维护。falconpoc01配置 /etc/hosts;添加
{% highlight bash %}
 10.128.31.138	falcon-mysql
 10.128.31.138	falcon-redis
 10.128.31.136	falcon-hbs
 10.128.31.137	falcon-hbs2
 10.128.31.136	falcon-graph
 10.128.31.137	falcon-graph2
 10.128.31.136  falcon-judge
 10.128.31.137	falcon-judge2
{% endhighlight %}

####部署heartbeat心跳模块
> 模块部署的打包、上传不会做介绍说明，官方文档上已经写明。

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "debug": true,
    "database": "root:password@tcp(falcon-mysql:3306)/falcon_portal?loc=Local&parseTime=true",
    "hosts": "",
    "maxIdle": 100,
    "listen": ":6030",
    "trustable": [""],
    "http": {
        "enabled": true,
        "listen": "0.0.0.0:6031"
    }
}
{% endhighlight %}

####部署judge报警判断模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "debug": true,
    "debugHost": "nil",
    "remain": 11, 
    "http": {
        "enabled": true,
        "listen": "0.0.0.0:6081"
    },
    "rpc": {
        "enabled": true,
        "listen": "0.0.0.0:6080"
    },
    "hbs": {
        "servers": ["falcon-hbs:6030"],
        "timeout": 300,
        "interval": 60
    },
    "alarm": {
        "enabled": true,
        "minInterval": 300,
        "queuePattern": "event:p%v",
        "redis": {
            "dsn": "falcon-redis:6379",
            "maxIdle": 5,
            "connTimeout": 5000,
            "readTimeout": 5000,
            "writeTimeout": 5000
        }
    }
}
{% endhighlight %}

####部署graph存储绘图模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
mkdir -p /root/data/6070
vim cfg.json
{
        "debug": false,
        "http": {
                "enabled": true,
                "listen": "0.0.0.0:6071"
        },
        "rpc": {
                "enabled": true,
                "listen": "0.0.0.0:6070"
        },
        "rrd": {
                "storage": "/root/data/6070"
        },
        "db": {
                "dsn": "root:password@tcp(falcon-mysql:3306)/graph?loc=Local&parseTime=true",
                "maxIdle": 4
        },
        "callTimeout": 5000,
        "migrate": {
                "enabled": false,
                "concurrency": 2,
                "replicas": 500,
                "cluster": {
                        "graph-00" : "falcon-graph:6070"
                }
        }
}
{% endhighlight %}

####部署transfer数据转发模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "debug": true,
    "minStep": 30,
    "http": {
        "enabled": true,
        "listen": "0.0.0.0:6060"
    },
    "rpc": {
        "enabled": true,
        "listen": "0.0.0.0:8433"
    },
    "socket": {
        "enabled": true,
        "listen": "0.0.0.0:4444",
        "timeout": 3600
    },
    "judge": {
        "enabled": true,
        "batch": 200,
        "connTimeout": 1000,
        "callTimeout": 5000,
        "maxConns": 32,
        "maxIdle": 32,
        "replicas": 500,
        "cluster": {
            "judge-00" : "falcon-judge:6080"
        }
    },
    "graph": {
        "enabled": true,
        "batch": 200,
        "connTimeout": 1000,
        "callTimeout": 5000,
        "maxConns": 32,
        "maxIdle": 32,
        "replicas": 500,
        "cluster": {
            "graph-00" : "falcon-graph:6070"
        }
    },
    "tsdb": {
        "enabled": false,
        "batch": 200,
        "connTimeout": 1000,
        "callTimeout": 5000,
        "maxConns": 32,
        "maxIdle": 32,
        "retry": 3,
        "address": "127.0.0.1:8088"
    }
}
{% endhighlight %}

####部署query绘图查询模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "debug": "false",
    "http": {
        "enabled":  true,
        "listen":   "0.0.0.0:9966"
    },
    "graph": {
        "connTimeout": 1000,
        "callTimeout": 5000,
        "maxConns": 32,
        "maxIdle": 32,
        "replicas": 500,
        "cluster": {
            "graph-00": "falcon-graph:6070"
        }
    },
    "api": {
        "query": "http://10.128.31.136:9966",
        "dashboard": "http://10.128.31.136:8081",
        "max": 500
    }
}
{% endhighlight %}

####部署dashboard用户查询模块

{% highlight bash %}
#初始化
virtualenv ./env
./env/bin/pip install -r pip_requirements.txt
{% endhighlight %}

{% highlight bash %}
#配置
vim rrd/config.py
#-*-coding:utf8-*-
import os

#-- dashboard db config --
DASHBOARD_DB_HOST = "falcon-mysql"
DASHBOARD_DB_PORT = 3306
DASHBOARD_DB_USER = "root"
DASHBOARD_DB_PASSWD = "password"
DASHBOARD_DB_NAME = "dashboard"

#-- graph db config --
GRAPH_DB_HOST = "falcon-mysql"
GRAPH_DB_PORT = 3306
GRAPH_DB_USER = "root"
GRAPH_DB_PASSWD = "password"
GRAPH_DB_NAME = "graph"

#-- app config --
DEBUG = True
SECRET_KEY = "secret-key"
SESSION_COOKIE_NAME = "open-falcon"
PERMANENT_SESSION_LIFETIME = 3600 * 24 * 30
SITE_COOKIE = "open-falcon-ck"

#-- query config --
QUERY_ADDR = "http://10.128.31.136:9966"

BASE_DIR = "/root/deploy/dashboard"
LOG_PATH = os.path.join(BASE_DIR,"log/")

try:
    from rrd.local_config import *
except:
    pass
{% endhighlight %}

####部署uic用户管理模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "log": "debug",
    "company": "MI",
    "http": {
        "enabled": true,
        "listen": "0.0.0.0:1234"
    },
    "cache": {
        "enabled": true,
        "redis": "127.0.0.1:6379",
        "idle": 10,
        "max": 1000,
        "timeout": {
            "conn": 10000,
            "read": 5000,
            "write": 5000
        }
    },
    "salt": "",
    "canRegister": true,
    "ldap": {
        "enabled": false,
        "addr": "ldap.example.com:389",
        "baseDN": "dc=example,dc=com",
        "bindDN": "cn=mananger,dc=example,dc=com",
        "bindPasswd": "12345678",
        "userField": "uid",
        "attributes": ["sn","mail","telephoneNumber"]
    },
    "uic": {
        "addr": "root:password@tcp(falcon-mysql:3306)/uic?charset=utf8&loc=Asia%2FChongqing",
        "idle": 10,
        "max": 100
    },
    "shortcut": {
        "falconPortal": "http://10.128.31.136:5050/",
        "falconDashboard": "http://10.128.31.136:7070/",
        "falconAlarm": "http://10.128.31.136:9912/"
    }
}
{% endhighlight %}

####部署portal报警策略模块

{% highlight bash %}
#初始化
virtualenv ./env
./env/bin/pip install -r pip_requirements.txt
#配置
vim rrd/config.py
# -*- coding:utf-8 -*-
__author__ = 'Ulric Qin'

# -- app config --
DEBUG = True

# -- db config --
DB_HOST = "falcon-mysql"
DB_PORT = 3306
DB_USER = "root"
DB_PASS = "password"
DB_NAME = "falcon_portal"

# -- cookie config --
SECRET_KEY = "4e.5tyg8-u9ioj"
SESSION_COOKIE_NAME = "falcon-portal"
PERMANENT_SESSION_LIFETIME = 3600 * 24 * 30

UIC_ADDRESS = {
    'internal': 'http://10.128.31.136:1234',
    'external': 'http://10.128.31.136:1234',
}

UIC_TOKEN = ''

MAINTAINERS = ['root']
CONTACT = 'CDXXJCPT@gome.cn'

COMMUNITY = True

try:
    from frame.local_config import *
except Exception, e:
    print "[warning] %s" % e
{% endhighlight %}

####部署alarm报警处理模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "debug": true,
    "uicToken": "",
    "http": {
        "enabled": true,
        "listen": "0.0.0.0:9912"
    },
    "queue": {
        "sms": "/sms",
        "mail": "/mail"
    },
    "redis": {
        "addr": "falcon-redis:6379",
        "maxIdle": 5,
        "highQueues": [
            "event:p0",
            "event:p1",
            "event:p2",
            "event:p3",
            "event:p4",
            "event:p5"
        ],
        "lowQueues": [
            "event:p6"
        ],
        "userSmsQueue": "/queue/user/sms",
        "userMailQueue": "/queue/user/mail"
    },
    "api": {
        "portal": "http://10.128.31.136:5050",
        "uic": "http://10.128.31.136:1234",
        "links": "http://10.128.31.136:5090"
    }
}
{% endhighlight %}

####部署sender报警发送模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "debug": true,
    "http": {
        "enabled": true,
        "listen": "0.0.0.0:6066"
    },
    "redis": {
        "addr": "falcon-redis:6379",
        "maxIdle": 5
    },
    "queue": {
        "sms": "/sms",
        "mail": "/mail"
    },
    "worker": {
        "sms": 10,
        "mail": 50
    },
    "api": {
        "sms": "http://10.128.31.138:8000/sms",
        "mail": "http://10.128.31.138:9000/mail"
    }
}
{% endhighlight %}

####部署task定时任务模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "debug": false,
    "http": {
        "enable": true,
        "listen": "0.0.0.0:8002"
    },
    "index": {
        "enable": true,
        "dsn": "root:password@tcp(falcon-mysql:3306)/graph?loc=Local&parseTime=true",
        "maxIdle": 4,
        "autoDelete": false,
        "cluster":{
            "falcon-graph:6071" : "0 0 0 ? * 0-5"
        }
    },
    "collector" : {
        "enable": false,
        "destUrl" : "http://127.0.0.1:1988/v1/push",
        "srcUrlFmt" : "http://%s/statistics/all",
        "cluster" : [
            "transfer,test.hostname:6060",
            "graph,test.hostname:6071",
            "task,test.hostname:8001"
        ]
    }
}
{% endhighlight %}

####部署agent监控采集模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "debug": true,
    "hostname": "",
    "ip": "",
    "plugin": {
        "enabled": false,
        "dir": "./plugin",
        "git": "https://github.com/open-falcon/plugin.git",
        "logs": "./logs"
    },
    "heartbeat": {
        "enabled": true,
        "addr": "10.128.31.136:6030",
        "interval": 60,
        "timeout": 1000
    },
    "transfer": {
        "enabled": true,
        "addrs": [
            "10.128.31.136:8433"
        ],
        "interval": 60,
        "timeout": 1000
    },
    "http": {
        "enabled": true,
        "listen": ":1988",
        "backdoor": false
    },
    "collector": {
        "ifacePrefix": ["eth", "ens"]
    },
    "ignore": {
        "cpu.busy": true,
        "df.bytes.free": true,
        "df.bytes.total": true,
        "df.bytes.used": true,
        "df.bytes.used.percent": true,
        "df.inodes.total": true,
        "df.inodes.free": true,
        "df.inodes.used": true,
        "df.inodes.used.percent": true,
        "mem.memtotal": true,
        "mem.memused": true,
        "mem.memused.percent": true,
        "mem.memfree": true,
        "mem.swaptotal": true,
        "mem.swapused": true,
        "mem.swapfree": true
    }
}
{% endhighlight %}

> 配置网络相关的collector选项，使用ifconfig查看系统网卡命名。collector选项采集网卡名称前缀。如是配置多节点则做后启动agent。

###多节点模块部署
> 将open-falcon模块部署falconpoc02服务器

内部模块相互访问使用host名称，方便于维护。falconpoc02配置 /etc/hosts;添加
{% highlight bash %}
10.128.31.138	falcon-mysql
10.128.31.138	falcon-redis
10.128.31.136	falcon-hbs
10.128.31.137	falcon-hbs2
10.128.31.136	falcon-graph
10.128.31.137	falcon-graph2
10.128.31.136   falcon-judge
10.128.31.137	falcon-judge2
{% endhighlight %}

####部署heartbeat心跳模块
> 模块部署的打包、上传不会做介绍说明，官方文档上已经写明。

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "debug": true,
    "database": "root:password@tcp(falcon-mysql:3306)/falcon_portal?loc=Local&parseTime=true",
    "hosts": "",
    "maxIdle": 100,
    "listen": ":6030",
    "trustable": [""],
    "http": {
        "enabled": true,
        "listen": "0.0.0.0:6031"
    }
}
{% endhighlight %}

####部署judge报警判断模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "debug": true,
    "debugHost": "nil",
    "remain": 11, 
    "http": {
        "enabled": true,
        "listen": "0.0.0.0:6081"
    },
    "rpc": {
        "enabled": true,
        "listen": "0.0.0.0:6080"
    },
    "hbs": {
        "servers": ["falcon-hbs:6030", "falcon-hbs2:6030"],
        "timeout": 300,
        "interval": 60
    },
    "alarm": {
        "enabled": true,
        "minInterval": 300,
        "queuePattern": "event:p%v",
        "redis": {
            "dsn": "falcon-redis:6379",
            "maxIdle": 5,
            "connTimeout": 5000,
            "readTimeout": 5000,
            "writeTimeout": 5000
        }
    }
}
#falcon01也需要修改
{% endhighlight %}

####部署graph存储绘图模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
mkdir -p /root/data/6070
vim cfg.json
{
        "debug": false,
        "http": {
                "enabled": true,
                "listen": "0.0.0.0:6071"
        },
        "rpc": {
                "enabled": true,
                "listen": "0.0.0.0:6070"
        },
        "rrd": {
                "storage": "/root/data/6070"
        },
        "db": {
                "dsn": "root:password@tcp(falcon-mysql:3306)/graph?loc=Local&parseTime=true",
                "maxIdle": 4
        },
        "callTimeout": 5000,
        "migrate": {
                "enabled": false,
                "concurrency": 2,
                "replicas": 500,
                "cluster": {
                        "graph-00" : "falcon-graph:6070"
                }
        }
}
{% endhighlight %}

####部署transfer数据转发模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "debug": true,
    "minStep": 30,
    "http": {
        "enabled": true,
        "listen": "0.0.0.0:6060"
    },
    "rpc": {
        "enabled": true,
        "listen": "0.0.0.0:8433"
    },
    "socket": {
        "enabled": true,
        "listen": "0.0.0.0:4444",
        "timeout": 3600
    },
    "judge": {
        "enabled": true,
        "batch": 200,
        "connTimeout": 1000,
        "callTimeout": 5000,
        "maxConns": 32,
        "maxIdle": 32,
        "replicas": 500,
        "cluster": {
            "judge-00" : "falcon-judge:6080",
            "judge-01" : "falcon-judge2:6080"
        }
    },
    "graph": {
        "enabled": true,
        "batch": 200,
        "connTimeout": 1000,
        "callTimeout": 5000,
        "maxConns": 32,
        "maxIdle": 32,
        "replicas": 500,
        "cluster": {
            "graph-00" : "falcon-graph:6070",
            "graph-01" : "falcon-graph2:6070"
        }
    },
    "tsdb": {
        "enabled": false,
        "batch": 200,
        "connTimeout": 1000,
        "callTimeout": 5000,
        "maxConns": 32,
        "maxIdle": 32,
        "retry": 3,
        "address": "127.0.0.1:8088"
    }
}
#falcon01也需要修改
{% endhighlight %}

####部署query绘图查询模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "debug": "false",
    "http": {
        "enabled":  true,
        "listen":   "0.0.0.0:9966"
    },
    "graph": {
        "connTimeout": 1000,
        "callTimeout": 5000,
        "maxConns": 32,
        "maxIdle": 32,
        "replicas": 500,
        "cluster": {
            "graph-00": "falcon-graph:6070",
            "graph-01": "falcon-graph2:6070"
        }
    },
    "api": {
        "query": "http://10.128.31.137:9966",
        "dashboard": "http://10.128.31.137:8081",
        "max": 500
    }
}
{% endhighlight %}

####部署dashboard用户查询模块

{% highlight bash %}
#初始化
virtualenv ./env
./env/bin/pip install -r pip_requirements.txt
#配置
vim rrd/config.py
#-*-coding:utf8-*-
import os

#-- dashboard db config --
DASHBOARD_DB_HOST = "falcon-mysql"
DASHBOARD_DB_PORT = 3306
DASHBOARD_DB_USER = "root"
DASHBOARD_DB_PASSWD = "password"
DASHBOARD_DB_NAME = "dashboard"

#-- graph db config --
GRAPH_DB_HOST = "falcon-mysql"
GRAPH_DB_PORT = 3306
GRAPH_DB_USER = "root"
GRAPH_DB_PASSWD = "password"
GRAPH_DB_NAME = "graph"

#-- app config --
DEBUG = True
SECRET_KEY = "secret-key"
SESSION_COOKIE_NAME = "open-falcon"
PERMANENT_SESSION_LIFETIME = 3600 * 24 * 30
SITE_COOKIE = "open-falcon-ck"

#-- query config --
QUERY_ADDR = "http://10.128.31.137:9966"

BASE_DIR = "/root/deploy/dashboard"
LOG_PATH = os.path.join(BASE_DIR,"log/")

try:
    from rrd.local_config import *
except:
    pass
{% endhighlight %}

####部署uic用户管理模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "log": "debug",
    "company": "MI",
    "http": {
        "enabled": true,
        "listen": "0.0.0.0:1234"
    },
    "cache": {
        "enabled": true,
        "redis": "falcon:6379",
        "idle": 10,
        "max": 1000,
        "timeout": {
            "conn": 10000,
            "read": 5000,
            "write": 5000
        }
    },
    "salt": "",
    "canRegister": true,
    "ldap": {
        "enabled": false,
        "addr": "ldap.example.com:389",
        "baseDN": "dc=example,dc=com",
        "bindDN": "cn=mananger,dc=example,dc=com",
        "bindPasswd": "12345678",
        "userField": "uid",
        "attributes": ["sn","mail","telephoneNumber"]
    },
    "uic": {
        "addr": "root:password@tcp(falcon-mysql:3306)/uic?charset=utf8&loc=Asia%2FChongqing",
        "idle": 10,
        "max": 100
    },
    "shortcut": {
        "falconPortal": "http://10.128.31.137:5050/",
        "falconDashboard": "http://10.128.31.137:7070/",
        "falconAlarm": "http://10.128.31.136:9912/"
    }
}
#所有uic(fe)节点的salt配置要相同。
{% endhighlight %}

####部署portal报警策略模块

{% highlight bash %}
#初始化
virtualenv ./env
./env/bin/pip install -r pip_requirements.txt
#配置
vim rrd/config.py
# -*- coding:utf-8 -*-
__author__ = 'Ulric Qin'

# -- app config --
DEBUG = True

# -- db config --
DB_HOST = "falcon-mysql"
DB_PORT = 3306
DB_USER = "root"
DB_PASS = "password"
DB_NAME = "falcon_portal"

# -- cookie config --
SECRET_KEY = "4e.5tyg8-u9ioj"
SESSION_COOKIE_NAME = "falcon-portal"
PERMANENT_SESSION_LIFETIME = 3600 * 24 * 30

UIC_ADDRESS = {
    'internal': 'http://10.128.31.137:1234',
    'external': 'http://10.128.31.137:1234',
}

UIC_TOKEN = ''

MAINTAINERS = ['root']
CONTACT = 'CDXXJCPT@gome.cn'

COMMUNITY = True

try:
    from frame.local_config import *
except Exception, e:
    print "[warning] %s" % e
{% endhighlight %}

####部署agent监控采集模块

{% highlight bash %}
#配置
cp cfg.example.json cfg.json
vim cfg.json
{
    "debug": true,
    "hostname": "",
    "ip": "",
    "plugin": {
        "enabled": false,
        "dir": "./plugin",
        "git": "https://github.com/open-falcon/plugin.git",
        "logs": "./logs"
    },
    "heartbeat": {
        "enabled": true,
        "addr": "10.128.31.137:6030",
        "interval": 60,
        "timeout": 1000
    },
    "transfer": {
        "enabled": true,
        "addrs": [
            "10.128.31.136:8433",
            "10.128.31.137:8433"
        ],
        "interval": 60,
        "timeout": 1000
    },
    "http": {
        "enabled": true,
        "listen": ":1988",
        "backdoor": false
    },
    "collector": {
        "ifacePrefix": ["eth", "ens"]
    },
    "ignore": {
        "cpu.busy": true,
        "df.bytes.free": true,
        "df.bytes.total": true,
        "df.bytes.used": true,
        "df.bytes.used.percent": true,
        "df.inodes.total": true,
        "df.inodes.free": true,
        "df.inodes.used": true,
        "df.inodes.used.percent": true,
        "mem.memtotal": true,
        "mem.memused": true,
        "mem.memused.percent": true,
        "mem.memfree": true,
        "mem.swaptotal": true,
        "mem.swapused": true,
        "mem.swapfree": true
    }
}
{% endhighlight %}

###用户接口

| 描述 | 访问接口 | 功能 | 备注 |
| :---: | :---: | :---: | :---: |
| **dashborad**  | http://10.128.31.136:8081/ | 监控主机数据查询 |  |
| **uic**  | http://10.128.31.136:1234/ | 用户组管理 |  |
| **portal**  | http://10.128.31.136:5050/ | 监控策略配置 |  |
| **dashborad**  | http://10.128.31.137:8081/ | 监控主机数据查询 |  |
| **uic**  | http://10.128.31.137:1234/ | 用户组管理 |  |
| **portal**  | http://10.128.31.137:5050/ | 监控策略配置 |  |
| **alarm**  | http://10.128.31.136:9912/ | 报警查询 |  |

[open-falcon-org-url]: http://book.open-falcon.org/zh/index.html

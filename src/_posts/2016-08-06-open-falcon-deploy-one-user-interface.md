---
layout: post
title: "(原) 多节点Open-falcon统一用户接口配置"
subtitle: "小米开源项目open-falcon - 互联网企业级监控产品"
tags: "open-falcon 监控 互联网 golang python"
date: 2016-08-06 12:00:00 +0800
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

基于[<<多节点Open-falcon部署>>][open-falcon-muti-node-url]文章的环境进行部署

###Nginx安装

{% highlight bash %}
yum install epel-release
yum install nginx

systemctl enable nginx
systemctl start nginx
{% endhighlight %}

###Nginx配置

{% highlight bash %}
vim /etc/nginx/nginx.conf
# For more information on configuration, see:
#   * Official English Documentation: http://nginx.org/en/docs/
#   * Official Russian Documentation: http://nginx.org/ru/docs/

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # Load modular configuration files from the /etc/nginx/conf.d directory.
    # See http://nginx.org/en/docs/ngx_core_module.html#include
    # for more information.
    include /etc/nginx/conf.d/*.conf;
}
{% endhighlight %}

{% highlight bash %}
vim /etc/nginx/conf.d/falcon.conf
upstream dashboard {
        ip_hash;
        server   10.128.31.136:8081;
        server   10.128.31.137:8081;
}

upstream uic {
        ip_hash;
        server   10.128.31.136:1234;
        server   10.128.31.137:1234;
}

upstream portal {
        ip_hash;
        server   10.128.31.136:5050;
        server   10.128.31.137:5050;
}

upstream alarm {
        server   10.128.31.136:9912;
}

server {
      listen  8081;
      server_name  10.128.31.138;

      location / {
               proxy_pass        http://dashboard;
               proxy_set_header   Host             $host;
               proxy_set_header   X-Real-IP        $remote_addr;
               proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
      }
} 

server {
      listen  1234;
      server_name  10.128.31.138;

      location / {
               proxy_pass        http://uic;
               proxy_set_header   Host             $host;
               proxy_set_header   X-Real-IP        $remote_addr;
               proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
      }
} 

server {
      listen  5050;
      server_name  10.128.31.138;

      location / {
               proxy_pass        http://portal;
               proxy_set_header   Host             $host;
               proxy_set_header   X-Real-IP        $remote_addr;
               proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
      }
} 

server {
      listen  9912;
      server_name  10.128.31.138;

      location / {
               proxy_pass        http://alarm;
               proxy_set_header   Host             $host;
               proxy_set_header   X-Real-IP        $remote_addr;
               proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
      }
} 
{% endhighlight %}

###Open-falcon用户接口配置

####uic用户管理模块

{% highlight bash %}
#配置
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
        "falconPortal": "http://10.128.31.138:5050/",
        "falconDashboard": "http://10.128.31.138:8081/",
        "falconAlarm": "http://10.128.31.138:9912/"
    }
}
{% endhighlight %}

####query绘图查询模块

{% highlight bash %}
#配置
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
        "dashboard": "http://10.128.31.138:8081",
        "max": 500
    }
}
{% endhighlight %}

####alarm报警处理模块

{% highlight bash %}
#配置
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
        "portal": "http://10.128.31.138:5050",
        "uic": "http://10.128.31.138:1234",
        "links": "http://10.128.31.138:5090"
    }
}
{% endhighlight %}

###用户接口

| 描述 | 访问接口 | 功能 | 备注 |
| :---: | :---: | :---: | :---: |
| **dashborad**  | http://10.128.31.138:8081/ | 监控主机数据查询 |  |
| **uic**  | http://10.128.31.138:1234/ | 用户组管理 |  |
| **portal**  | http://10.128.31.138:5050/ | 监控策略配置 |  |
| **alarm**  | http://10.128.31.138:9912/ | 报警查询 |  |


[open-falcon-org-url]: http://book.open-falcon.org/zh/index.html
[open-falcon-muti-node-url]: /tools/-/2016/08/06/open-falcon-deploy-with-muti-node.html

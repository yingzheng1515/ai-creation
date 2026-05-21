# 阿里云服务器部署

本文档用于把本项目部署到阿里云 ECS。默认方案是 Node.js + PM2 + Nginx 反向代理。

## 前置条件

- ECS 系统建议 Ubuntu 22.04/24.04。
- 安全组放行 `22`、`80`、`443`。
- Node.js 建议使用 20 LTS 或更高版本。
- 域名可选；没有域名也可以先用公网 IP 访问。

Next.js 官方部署文档要求生产部署具备 `build` 和 `start` 脚本，并通过 `next build` 生成生产构建后用 `next start` 启动服务。
Source: https://nextjs.org/docs/app/getting-started/deploying

## 1. 安装基础软件

```bash
sudo apt update
sudo apt install -y git nginx

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

sudo npm install -g pm2
node -v
npm -v
pm2 -v
```

## 2. 拉取代码

```bash
sudo mkdir -p /var/www
sudo chown -R "$USER":"$USER" /var/www
cd /var/www

git clone <YOUR_REPO_URL> ai-creation
cd ai-creation
git checkout codex/ai-creation-mvp
```

如果代码不是放在远程 Git 仓库，而是本地文件上传，也要保证服务器上的项目目录包含 `package.json`、`src/`、`next.config.ts` 等文件。

## 3. 配置环境变量

在服务器项目目录创建 `.env.local`：

```bash
nano .env.local
```

填入真实密钥和 Seedance 地址：

```bash
DEEPSEEK_API_KEY=你的_deepseek_key
DEEPSEEK_MODEL=deepseek-chat

OPENAI_API_KEY=你的_openai_key
OPENAI_IMAGE_MODEL=gpt-image-2

SEEDANCE_API_KEY=你的_seedance_key
SEEDANCE_API_URL=你的_seedance_创建任务地址
SEEDANCE_STATUS_API_URL=你的_seedance_查询任务地址_包含_{taskId}
SEEDANCE_MODEL=seedance-2.0

# 可选：阿里云 OSS 素材持久化。填完后，生图和生视频结果会先上传到 OSS，再保存 OSS URL。
ALIYUN_OSS_ACCESS_KEY_ID=你的_OSS_AccessKey_ID
ALIYUN_OSS_ACCESS_KEY_SECRET=你的_OSS_AccessKey_Secret
ALIYUN_OSS_BUCKET=你的_bucket_名称
ALIYUN_OSS_ENDPOINT=oss-cn-beijing.aliyuncs.com
ALIYUN_OSS_PREFIX=ai-creation

# 可选：如果绑定了 OSS 自定义域名或 CDN，就填公开访问根地址。
# 不填时默认使用 https://<bucket>.<endpoint>/<objectKey>
ALIYUN_OSS_PUBLIC_BASE_URL=https://你的素材域名

# 可选：如果 bucket 默认不是公共读，可以显式让新上传对象公共读。
# 需要当前 AccessKey 有 PutObjectAcl 或相关权限。
# ALIYUN_OSS_OBJECT_ACL=public-read

# 必填：用于签名登录 Cookie。请换成一串 32 位以上随机字符串。
SESSION_SECRET=换成_32位以上_随机字符串

# 可选：服务器历史记录根目录。默认是项目目录下的 data/。
HISTORY_DATA_DIR=/var/www/ai-creation/data

# 可选：接入 HTTPS 后可以强制开启 Secure Cookie。
# 现在用公网 IP + HTTP 访问时不要设成 true，否则手机浏览器不会保存访客会话。
SESSION_COOKIE_SECURE=false
```

不要把 `.env.local` 提交到 Git。

`HISTORY_DATA_DIR` 用来保存“我的作品 / 素材宝库 / 历史”里的最近生成记录。MVP 阶段它会按浏览器访客会话写入 `data/users/<访客ID>/history.json`，不同访客不会共享同一份作品库。清浏览器 Cookie 或换新浏览器会生成新的访客空间。

账号名 + 访问码登录会写入 `data/auth/accounts.json`。访问码不会明文保存，会使用 Node.js `scrypt` 加盐哈希。`SESSION_SECRET` 改变后，已经登录的浏览器需要重新登录。

OSS 持久化是可选开关。只有 `ALIYUN_OSS_ACCESS_KEY_ID`、`ALIYUN_OSS_ACCESS_KEY_SECRET`、`ALIYUN_OSS_BUCKET`、`ALIYUN_OSS_ENDPOINT` 同时存在时才会启用；否则系统继续保存第三方生成接口返回的原始 URL。

如果手机或其他电脑打不开 OSS 图片/视频，通常是 bucket 或对象没有公开读权限。先在服务器上生成一张图，再复制返回的 URL 到浏览器测试；如果返回 403，需要把 bucket 设为公共读、绑定 CDN/自定义域名，或开启 `ALIYUN_OSS_OBJECT_ACL=public-read` 并确认 AccessKey 权限。

## 4. 安装依赖并构建

```bash
npm ci
npm run build
```

## 5. 用 PM2 启动

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
```

本服务默认监听 `127.0.0.1:3000`。

首次部署时创建历史数据目录。不要在更新部署时删除这个目录：

```bash
mkdir -p data
```

可以用下面命令检查后端是否通：

```bash
curl -sS http://127.0.0.1:3000/api/generate/script \
  -H 'content-type: application/json' \
  --data '{"requirement":"水墨江南宣传片"}'
```

如果 `.env.local` 没填真实配置，会回退到 mock provider。

## 6. 配置 Nginx

创建站点配置：

```bash
sudo nano /etc/nginx/sites-available/ai-creation
```

没有域名时先用公网 IP：

```nginx
server {
  listen 80;
  server_name _;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/ai-creation /etc/nginx/sites-enabled/ai-creation
sudo nginx -t
sudo systemctl reload nginx
```

然后访问：

```text
http://你的服务器公网IP
```

## 7. 更新部署

以后更新代码：

```bash
cd /var/www/ai-creation
git pull
npm ci
npm run build
pm2 restart ai-creation
```

如果你用压缩包覆盖上传代码，排除 `.env.local` 和 `data/`，否则会覆盖服务器密钥或历史记录：

```bash
tar --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='.env.local' --exclude='data' -czf /tmp/ai-creation-latest.tgz .
scp /tmp/ai-creation-latest.tgz root@你的服务器公网IP:/tmp/
```

服务器上执行：

```bash
cd /var/www/ai-creation
tar -xzf /tmp/ai-creation-latest.tgz
mkdir -p data
npm ci
npm run build
pm2 restart ai-creation --update-env
```

## 常见问题

### 端口打不开

先检查 PM2：

```bash
pm2 logs ai-creation --lines 80
pm2 status
```

再检查本机端口：

```bash
curl -I http://127.0.0.1:3000
```

如果本机能访问、公网不能访问，通常是阿里云安全组或 Nginx 配置问题。

### 真实 API 没生效

检查 `.env.local` 是否在项目根目录，并重启：

```bash
pm2 restart ai-creation --update-env
```

还需要确认 Seedance 的查询 URL 模板包含 `{taskId}`，例如：

```text
https://example.com/video/tasks/{taskId}
```

### OSS 没生效

先确认环境变量已经被 PM2 进程读到：

```bash
pm2 restart ai-creation --update-env
curl -sS http://127.0.0.1/api/generate/image \
  -H 'content-type: application/json' \
  -d '{"prompt":"OSS 测试图片"}'
```

如果返回的 `url` 仍然不是 OSS 或 CDN 地址，检查 `.env.local` 里是否至少有这四项：

```text
ALIYUN_OSS_ACCESS_KEY_ID
ALIYUN_OSS_ACCESS_KEY_SECRET
ALIYUN_OSS_BUCKET
ALIYUN_OSS_ENDPOINT
```

如果接口返回 `OSS upload failed.`，优先检查 bucket 名称、endpoint 地域、AccessKey 权限，以及服务器是否能访问 OSS endpoint。

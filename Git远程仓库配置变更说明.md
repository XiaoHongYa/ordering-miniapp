# Git 远程仓库配置变更说明 🔧

## 📋 变更内容

将项目的 Git 远程仓库从 **Coding (内部)** 切换为 **GitHub**,后续所有代码推送都只会推送到 GitHub。

---

## 🔄 变更详情

### 变更前

```bash
origin  ssh://git@e.coding.anker-in.com:2222/codingcorp/dtc_it/dtc_prd_ai_service.git
github  https://github.com/XiaoHongYa/ordering-miniapp.git
```

**推送命令:**
- `git push origin branch-name` → 推送到 Coding
- `git push github branch-name` → 推送到 GitHub

### 变更后

```bash
origin  https://github.com/XiaoHongYa/ordering-miniapp.git
```

**推送命令:**
- `git push` → 推送到 GitHub (默认)
- `git push origin branch-name` → 推送到 GitHub

---

## 🛠️ 执行的命令

```bash
# 1. 删除旧的 origin (Coding)
git remote remove origin

# 2. 将 github 重命名为 origin
git remote rename github origin

# 3. 设置当前分支的上游为 GitHub
git push -u origin feature/ordering-system

# 4. 验证配置
git remote -v
git branch -vv
```

---

## ✅ 配置结果

### 远程仓库

```bash
$ git remote -v
origin  https://github.com/XiaoHongYa/ordering-miniapp.git (fetch)
origin  https://github.com/XiaoHongYa/ordering-miniapp.git (push)
```

### 分支上游

```bash
$ git branch -vv
* feature/ordering-system 706d725 [origin/feature/ordering-system] feat: 订单提交时同步写入订单详情表
```

---

## 📝 后续使用

### 日常推送

现在可以直接使用简化的 Git 命令:

```bash
# 提交代码
git add .
git commit -m "你的提交信息"

# 推送到 GitHub (不需要指定 origin)
git push
```

### 创建新分支

```bash
# 创建并切换到新分支
git checkout -b feature/new-feature

# 第一次推送需要设置上游
git push -u origin feature/new-feature

# 后续推送
git push
```

### 拉取最新代码

```bash
# 拉取当前分支
git pull

# 拉取指定分支
git pull origin main
```

---

## 🌐 GitHub 仓库信息

**仓库地址:** https://github.com/XiaoHongYa/ordering-miniapp

**分支列表:**
- `main` - 主分支
- `feature/ordering-system` - 当前开发分支

---

## 🚀 Netlify 自动部署

Netlify 已经关联了 GitHub 仓库,当你推送代码到 GitHub 时:

1. ✅ GitHub 接收到推送
2. ✅ Netlify 自动检测到代码变更
3. ✅ 触发自动构建和部署
4. ✅ 2-3 分钟后网站更新完成

**Netlify 监听分支:**
- `feature/ordering-system` (当前部署分支)

---

## ⚠️ 注意事项

### 1. Coding 仓库已移除

- ❌ 不再推送到 `e.coding.anker-in.com`
- ❌ 如果需要恢复,需要重新添加远程仓库

### 2. 协作开发

如果有其他开发者需要拉取代码:

```bash
# 克隆仓库
git clone https://github.com/XiaoHongYa/ordering-miniapp.git

# 切换到开发分支
cd ordering-miniapp
git checkout feature/ordering-system
```

### 3. 保护分支

建议在 GitHub 上设置分支保护规则:

1. 访问 https://github.com/XiaoHongYa/ordering-miniapp/settings/branches
2. 点击 "Add rule"
3. 设置 `main` 分支保护:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging

---

## 📊 推送历史

以下代码已成功推送到 GitHub:

| 提交 | 说明 | 时间 |
|------|------|------|
| `706d725` | feat: 订单提交时同步写入订单详情表 | 2025-01-13 |
| `a5d3ee0` | 调整购物车布局,为菜品名称预留更多空间 | 2025-01-13 |
| `ca141a3` | 优化购物车布局和订单详情显示 | 2025-01-13 |
| `13e1373` | 修复下单流程,避免显示空购物车 | 2025-01-13 |
| `f69e556` | 修复分类筛选逻辑,添加'全部'分类选项 | 2025-01-13 |

---

## 🔍 验证方法

### 验证远程仓库

```bash
git remote -v
```

**预期输出:**
```
origin  https://github.com/XiaoHongYa/ordering-miniapp.git (fetch)
origin  https://github.com/XiaoHongYa/ordering-miniapp.git (push)
```

### 验证分支上游

```bash
git branch -vv
```

**预期输出:**
```
* feature/ordering-system 706d725 [origin/feature/ordering-system] feat: 订单提交时同步写入订单详情表
```

### 验证推送

```bash
# 提交一个小修改
echo "# Test" >> README.md
git add README.md
git commit -m "test: 验证推送配置"
git push

# 检查 GitHub 仓库是否有新提交
```

---

## 💡 常见问题

### Q1: 推送时提示权限错误

**错误信息:**
```
remote: Permission to XiaoHongYa/ordering-miniapp.git denied
```

**解决方案:**
1. 检查 GitHub 账号是否有仓库权限
2. 如果使用 HTTPS,可能需要提供 GitHub Personal Access Token
3. 建议配置 SSH 密钥:

```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 添加到 GitHub
cat ~/.ssh/id_ed25519.pub
# 复制输出,添加到 https://github.com/settings/keys

# 修改远程仓库 URL 为 SSH
git remote set-url origin git@github.com:XiaoHongYa/ordering-miniapp.git
```

### Q2: 如何恢复 Coding 仓库?

如果需要同时推送到两个仓库:

```bash
# 添加 Coding 为第二个远程仓库
git remote add coding ssh://git@e.coding.anker-in.com:2222/codingcorp/dtc_it/dtc_prd_ai_service.git

# 推送到 GitHub (默认)
git push

# 推送到 Coding (需要明确指定)
git push coding feature/ordering-system
```

### Q3: 如何查看推送历史?

```bash
# 查看本地提交历史
git log --oneline -10

# 查看远程分支
git branch -r

# 查看某个远程分支的日志
git log origin/feature/ordering-system --oneline -10
```

---

## 🎉 总结

**配置完成:**
- ✅ 已删除 Coding 远程仓库
- ✅ GitHub 已设置为默认远程仓库 (origin)
- ✅ 当前分支已关联 GitHub 上游
- ✅ 所有历史代码已推送到 GitHub

**后续操作:**
- ✅ 使用 `git push` 直接推送到 GitHub
- ✅ Netlify 自动检测并部署
- ✅ 无需再手动指定远程仓库名称

**GitHub 仓库:**
- 🔗 https://github.com/XiaoHongYa/ordering-miniapp

现在你可以专注于功能开发,推送代码会自动同步到 GitHub 并触发 Netlify 部署! 🚀

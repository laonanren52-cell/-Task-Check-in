# SummerFlow 发布手册

## 版本来源

`src-tauri/tauri.conf.json` 是版本号的单一编辑入口。修改后执行：

```bash
npm run version:sync
npm run release:check
```

脚本会同步 `package.json`、`package-lock.json` 与 `src-tauri/Cargo.toml`，并检查语义版本、固定 identifier、updater 公钥和 endpoint。

## 首次配置 GitHub Secrets

在仓库 Settings → Secrets and variables → Actions 中创建：

- `TAURI_SIGNING_PRIVATE_KEY`：`C:\Users\cheng\.tauri\summerflow.key` 的完整内容。
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`：`C:\Users\cheng\.tauri\summerflow.password` 的完整内容。

不要把两个文件复制到仓库，不要在 issue、Release 或日志中粘贴其内容。

> 该私钥是向已安装用户继续发布更新的关键凭据，必须进行离线备份，不得丢失。

## 标准发布步骤

1. 完成功能并更新 `CHANGELOG.md`。
2. 修改 `src-tauri/tauri.conf.json` 的版本号。
3. 执行 `npm run version:sync`。
4. 根据兼容性更新 `release-metadata.json`；普通版本保持 `mandatory: false`。
5. 执行 `npm run release:check`。
6. 执行 `npm run tauri:build` 并本机验证安装包。
7. 提交全部非敏感文件。
8. 创建与版本一致的 Tag，例如 `git tag v0.1.1`。
9. 推送代码和 Tag：`git push origin main --follow-tags`。
10. GitHub Actions 构建 NSIS/MSI、签名 updater 包、生成 `latest.json` 并创建 Release。
11. 安装上一版本，执行一次真实更新与数据保留验证。

## 签名说明

- Updater 包签名：已配置 minisign 密钥和 CI Secrets 注入流程。
- Windows Authenticode：尚未配置正式证书。当前安装包可能触发 SmartScreen；不得用伪造或测试证书冒充正式签名。
- 后续接入证书时，按 Tauri Windows Code Signing 文档向 CI 注入证书，不能关闭系统安全验证。

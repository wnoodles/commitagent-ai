# CommitAgent AI

CommitAgent AI 是一个可切换 AI Provider 的 VS Code Git Commit 生成插件。它会理解当前 Git 修改，读取项目自己的提交规范，生成 Commit Message，并写入 Source Control 输入框供你确认。

## 功能

- 优先分析 staged changes；没有 staged 时可回退到 unstaged changes
- 自动读取 `.commitagent-rules/commit-style.md`
- 支持 DeepSeek、Kimi / Moonshot、OpenAI
- 支持任意 OpenAI-compatible API、Ollama、代理或内部模型
- API Key 保存到 VS Code SecretStorage
- 自动过滤 lockfile、构建产物和敏感文件正文
- 对常见 API Key、Token 和私钥执行基础脱敏
- 限制单文件与总 diff 大小
- 自动生成 `emoji + type(scope): subject`
- 失败时保留原来的 Source Control 输入内容
- 不自动执行 `git add` 或 `git commit`

## 安装

### 安装 VSIX

1. 打开 VS Code。
2. 打开 Extensions 面板。
3. 点击右上角 `...`。
4. 选择 `Install from VSIX...`。
5. 选择 `commitagent-ai-0.1.0.vsix`。

### 开发模式

```bash
npm install
npm run compile
```

用 VS Code 打开项目后按 `F5`，启动 Extension Development Host。

## 首次配置

打开命令面板，依次运行：

1. `CommitAgent: Select AI Provider`
2. `CommitAgent: Set API Key`
3. 可选：`CommitAgent: Test AI Connection`

内置预设：

| Provider | 默认 Base URL | 默认模型 |
| --- | --- | --- |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-flash` |
| Kimi / Moonshot | `https://api.moonshot.cn/v1` | `kimi-k2.5` |
| OpenAI | `https://api.openai.com/v1` | `gpt-5-mini` |
| Custom | `http://localhost:11434/v1` | 用户填写 |

厂商模型名称变化较快，默认值不可用时，在设置中修改 `CommitAgent: Model` 即可，无需修改代码。

## 使用

1. 修改代码。
2. 推荐先将准备提交的内容 Stage。
3. 打开 Source Control。
4. 点击标题栏的星光按钮，或运行 `CommitAgent: Generate Commit Message`。
5. 检查自动填入的 Commit Message。
6. 手动点击 Commit。

默认 `stagedFirst` 策略：

- 有 staged changes：只分析 staged。
- 没有 staged changes：分析 unstaged。
- 插件不会自动暂存文件。

## 项目规范

在项目根目录创建：

```text
.commitagent-rules/
└─ commit-style.md
```

插件按以下优先级查找：

1. `commitAgent.rulesFile` 指定文件
2. `.commitagent-rules/commit-style.md`
3. `.commitagentrc.md`
4. `.commitagentrc.json`
5. `.aicommitrc.md`
6. 内置默认规范

仓库可直接使用本项目中的示例规范。

## Custom Provider

Custom Provider 适用于支持 `/chat/completions` 的接口。需要配置：

- `commitAgent.baseUrl`
- `commitAgent.model`
- API Key；本地 Ollama 无需密钥时可以留空

例如 Ollama：

```json
{
  "commitAgent.provider": "custom",
  "commitAgent.baseUrl": "http://localhost:11434/v1",
  "commitAgent.model": "qwen3:8b"
}
```

## 主要设置

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| `commitAgent.provider` | `deepseek` | AI Provider |
| `commitAgent.diffMode` | `stagedFirst` | diff 选择策略 |
| `commitAgent.rulesFile` | `.commitagent-rules/commit-style.md` | 项目规范文件 |
| `commitAgent.maxDiffChars` | `60000` | 总 diff 上限 |
| `commitAgent.maxFileDiffChars` | `12000` | 单文件 diff 上限 |
| `commitAgent.redactSensitiveContent` | `true` | 是否启用基础脱敏 |

## 隐私说明

生成 Commit Message 时，经过过滤和脱敏的 Git diff 会发送到你选择的 AI Provider。默认不会发送 `.env`、私钥、证书、常见凭据文件、lockfile 和构建产物的正文。自动规则不能替代人工检查，使用公司代码时请遵循公司的数据安全规定。

## 打包

```bash
npm run test
npm run package
```

发布 Marketplace 前请修改 `package.json` 中的 `publisher`，并补充真实仓库地址、图标与发布者信息。

## License

MIT

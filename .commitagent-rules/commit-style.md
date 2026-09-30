# Commit message rules

Use Simplified Chinese and output only the final commit message.

Format: `<emoji> <type>(<scope>): <subject>`

- `scope` is optional.
- `subject` starts with an imperative verb such as 添加、修复、更新、优化、重构.
- The first line must not end with punctuation and must not exceed 72 characters.
- For simple changes, omit the body.
- For complex changes, add a blank line followed by concise `- ` bullet points explaining why.
- Never include diff snippets or `+/-` line numbers.

Types:

- ✨ feat: new feature
- 🐛 fix: bug fix
- 📝 docs: documentation only
- 🎨 style: formatting without behavior changes
- ♻️ refactor: refactoring without feature or bug fix
- ⚡️ perf: performance improvement
- ✅ test: tests
- 🛠 build: build system or dependency changes
- ⚙️ ci: CI configuration
- 🔧 chore: other maintenance
- ⏪ revert: revert a previous commit
- 🎉 init: initialize project or module
- 🚀 release: release a version

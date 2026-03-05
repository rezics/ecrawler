# ecrawler 文档目录

欢迎来到 ecrawler 文档！以下是所有可用文档的导航和索引。

## 📚 文档列表

### 🚀 快速开始

- **[快速开始指南](./GETTING_STARTED.md)** - ⭐ 新手必读
  - 环境配置和依赖安装
  - 数据库设置（Docker/本地）
  - 如何启动各个应用
  - 常见问题排查

### 🏗️ 系统设计

- **[系统架构设计](./ARCHITECTURE.md)** - 深入理解项目设计
  - 整体系统架构
  - 核心组件说明
  - 数据流向
  - 技术决策解释

- **[项目结构详解](./PROJECT_STRUCTURE.md)** - 代码组织方式
  - 完整的目录树
  - 关键文件说明
  - 工作区依赖关系
  - 命名约定和最佳实践

### 💻 开发指南

- **[Extractor 实现指南](./EXTRACTOR_IMPLEMENTATION.md)** - 如何添加新网站支持
  - Extractor 架构模式
  - BQGL 实现详解
  - 逐步实现新爬虫的步骤
  - 常见模式和最佳实践
  - 测试和调试技巧

### 📡 API 文档

- **[API 文档](./API.md)** - （待编写）
  - Server API 端点
  - 请求/响应格式
  - 错误处理
  - 认证方式

### 🚢 部署指南

- **[部署指南](./DEPLOYMENT.md)** - （待编写）
  - 生产环境配置
  - Docker 容器化
  - 服务器部署
  - CI/CD 流程
  - 监控和日志

## 🎯 快速导航

### 根据你的角色选择

#### 👤 新手开发者

1. 阅读 [快速开始指南](./GETTING_STARTED.md)
2. 了解 [项目结构](./PROJECT_STRUCTURE.md)
3. 学习 [系统架构](./ARCHITECTURE.md)

#### 🔧 后端开发者

1. 深入学习 [系统架构](./ARCHITECTURE.md)
2. 查看 [API 文档](./API.md)（开发中）
3. 参考 [Extractor 实现指南](./EXTRACTOR_IMPLEMENTATION.md)

#### 🕷️ 爬虫开发者

1. 首先学习 [Extractor 实现指南](./EXTRACTOR_IMPLEMENTATION.md)
2. 查看现有实现（BQGL、Qidian）
3. 参考 [项目结构](./PROJECT_STRUCTURE.md)

#### 🚀 运维/部署工程师

1. 阅读 [快速开始](./GETTING_STARTED.md) 中的数据库部分
2. 查看 [部署指南](./DEPLOYMENT.md)（开发中）
3. 参考 [系统架构](./ARCHITECTURE.md) 的部署模式

## 📖 按学习阶段

### 第一阶段：项目概览

- [ ] 阅读根目录 [README.md](../README.md)
- [ ] 查看 [项目结构](./PROJECT_STRUCTURE.md) 概览部分

### 第二阶段：开发环境设置

- [ ] 按照 [快速开始](./GETTING_STARTED.md) 安装依赖
- [ ] 启动数据库和各个服务
- [ ] 运行第一个爬取任务

### 第三阶段：代码理解

- [ ] 学习 [系统架构](./ARCHITECTURE.md)
- [ ] 研究 [Extractor 实现](./EXTRACTOR_IMPLEMENTATION.md)
- [ ] 查看现有网站爬虫实现代码

### 第四阶段：动手实现

- [ ] 添加新网站爬虫支持
- [ ] 修改数据模型
- [ ] 扩展 API 功能

## 🔗 重要链接

### 项目资源

- [GitHub 仓库](https://github.com/rezics/ecrawler)
- [项目 Issues](https://github.com/rezics/ecrawler/issues)
- [项目讨论](https://github.com/rezics/ecrawler/discussions)

### 技术栈文档

- [Effect 官方文档](https://effect.website/)
- [Crawlee 文档](https://crawlee.dev/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Yarn 工作区](https://yarnpkg.com/features/workspaces)

### 开发工具

- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/)
- [PostgreSQL](https://www.postgresql.org/)

## ❓ 常见问题

### 我应该从哪个文档开始？

→ 从 [快速开始指南](./GETTING_STARTED.md) 开始。

### 如何添加新的网站爬虫？

→ 查看 [Extractor 实现指南](./EXTRACTOR_IMPLEMENTATION.md)。

### 系统是如何工作的？

→ 阅读 [系统架构设计](./ARCHITECTURE.md)。

### 项目文件夹是怎样组织的？

→ 参考 [项目结构详解](./PROJECT_STRUCTURE.md)。

### 我在某个步骤卡住了怎么办？

→ 查看 [快速开始](./GETTING_STARTED.md) 中的 [常见问题排查](#常见问题排查)
部分。

## 📝 文档维护

本文档由项目社区维护。如果你发现任何错误或希望改进：

1. 提交 [GitHub Issue](https://github.com/rezics/ecrawler/issues)
2. 提交 [Pull Request](https://github.com/rezics/ecrawler/pulls)
3. 参与 [讨论](https://github.com/rezics/ecrawler/discussions)

## 🗺️ 文档状态

| 文档               | 状态      | 最后更新   |
| ------------------ | --------- | ---------- |
| 快速开始指南       | ✅ 完成   | 2026-03-05 |
| 系统架构设计       | ✅ 完成   | 2026-03-05 |
| 项目结构详解       | ✅ 完成   | 2026-03-05 |
| Extractor 实现指南 | ✅ 完成   | 2026-03-05 |
| API 文档           | 🔄 进行中 | -          |
| 部署指南           | 🔄 进行中 | -          |
| 性能优化指南       | 📋 计划中 | -          |
| 测试指南           | 📋 计划中 | -          |

## 📧 获得帮助

如果你有问题或需要帮助：

1. **搜索文档**: 使用浏览器的查找功能搜索关键词
2. **查看代码注释**: 项目代码中有详细的注释和 JSDoc
3. **提交 Issue**: 在 [GitHub](https://github.com/rezics/ecrawler/issues) 上提问
4. **加入讨论**: 参与 [项目讨论](https://github.com/rezics/ecrawler/discussions)

---

**最后更新**: 2026-03-05  
**贡献者**: ecrawler 开发团队  
**许可证**: MIT

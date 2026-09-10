# Rsbuild Project

nodejs >= 20

## Setup

Install the dependencies:

```bash
pnpm install or npm install
```

## Get Started

Start the dev server:

```bash
pnpm dev or npm run dev
```

## 项目结构说明

### 根目录结构

```
├── src/                 # 源代码目录
├── public/              # 静态资源目录
├── .husky/              # Git钩子配置
├── scripts/             # 脚本工具
├── ssl/                 # SSL证书（用于HTTPS开发环境）
├── rsbuild.config.js    # Rsbuild构建配置
└── package.json         # 项目依赖和脚本配置
```

### src 目录结构

#### src/api/

包含所有与后端API通信的函数，按功能模块分类。

- **auth.ts**: 认证相关API（登录、注册等）
- **test.ts**: 测试相关API示例

#### src/components/

包含可复用的UI组件，按功能或业务模块组织。

- **count/**: 计数器相关组件示例

#### src/config/

包含应用的配置信息，如API地址、环境变量等。

- **index.ts**: 主配置文件，包含不同环境的API基础URL和客户端ID等常量

#### src/pages/

包含所有页面级组件，每个文件对应一个路由页面。

- **Index.tsx**: 首页组件
- **Login.tsx**: 登录页面
- **Register.tsx**: 注册页面
- **count.tsx**: 计数器演示页面
- **其他页面组件...**

#### src/store/

使用MobX实现的状态管理，按功能模块划分不同的store。

- **index.ts**: 根store，组合所有子store
- **count.ts**: 计数器相关状态管理

#### src/types/

包含所有TypeScript类型定义，按功能模块分类。

- **auth.ts**: 认证相关类型定义（登录参数、响应等）
- **base.ts**: 基础类型定义（如通用响应格式）
- **example.ts**: 示例类型定义
- **test.ts**: 测试相关类型定义

#### src/utils/

包含通用工具函数，按功能分类。

- **cookie.ts**: Cookie操作工具
- **device.ts**: 设备检测工具
- **http.ts**: HTTP请求封装（基于axios）

#### 其他重要文件

- **routes.tsx**: 应用路由配置，使用React Router管理页面导航
- **App.tsx**: 应用主组件
- **index.tsx**: 应用入口文件
- **index.html**: HTML模板文件

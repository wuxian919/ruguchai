# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)

## 项目概述

柴烧壶产品展示与直播助手系统。包含：
- **手机端浏览页面** (`/`)：长列表滑动浏览产品，支持搜索和分类筛选
- **电脑端管理后台** (`/admin`)：产品增删改查、分类管理
- **PWA 支持**：可添加到手机主屏幕，像原生APP一样使用

## 目录结构

```
├── public/                 # 静态资源（PWA图标等）
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── admin/          # 管理后台页面
│   │   ├── api/            # API路由
│   │   │   ├── products/   # 产品CRUD接口
│   │   │   └── categories/ # 分类CRUD接口
│   │   ├── layout.tsx      # 根布局（PWA配置）
│   │   └── page.tsx        # 首页（产品浏览）
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   └── storage/database/   # 数据库客户端与Schema
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

## 数据库表结构

### products 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | serial | 主键 |
| name | varchar(200) | 产品名称 |
| image_url | text | 产品图片URL |
| params | jsonb | 产品参数（长、高、重、作者、泥料等） |
| description | text | 产品详细描述 |
| sort_order | integer | 排序值 |
| category_id | integer | 分类ID（外键） |
| is_pinned | boolean | 是否置顶 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### categories 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | serial | 主键 |
| name | varchar(100) | 分类名称 |
| sort_order | integer | 排序值 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/products | 获取产品列表（支持category_id、search参数） |
| POST | /api/products | 创建产品 |
| GET | /api/products/[id] | 获取单个产品 |
| PUT | /api/products/[id] | 更新产品 |
| DELETE | /api/products/[id] | 删除产品 |
| GET | /api/categories | 获取分类列表 |
| POST | /api/categories | 创建分类 |
| PUT | /api/categories/[id] | 更新分类 |
| DELETE | /api/categories/[id] | 删除分类 |

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码
- 禁止隐式 `any` 和 `as any`
- 字段名使用 snake_case（数据库字段）

### Hydration 问题防范

- 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据
- 必须使用 'use client' 并配合 useEffect + useState
- 禁止使用 head 标签，优先使用 metadata

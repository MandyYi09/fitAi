# fitAI 版本存档

这两个目录是可独立运行的源码副本。原项目仍在仓库根目录的 `src/` 开发。

| 目录 | 内容 | 来源 |
| --- | --- | --- |
| `fitai-current-2026-10-09/` | 2026-10-09 的完整 fitAI，包含当时 `src/app.js`、`src/index.html`、`src/style.css` 中尚未提交的改动 | 当前工作区快照，基于 `d7ad716` |
| `fitai-basic-stretch-yoga/` | 只有 Stretch 和 Yoga 两个练习分类，共 32 个动作 | Git 提交 `4e6b9f8`，新增其他模式前的最后一版 |

分别在对应目录运行：

```sh
cd versions/fitai-current-2026-10-09
npm run dev
```

```sh
cd versions/fitai-basic-stretch-yoga
npm run dev
```

当前版默认使用 `http://127.0.0.1:5187/`，基础版默认使用 `http://localhost:5173/`。两个版本可以同时运行。各目录也可以分别执行 `npm test` 和 `npm run build`。

`build/` 是生成目录，不包含在快照中。两版的 3D 与姿势追踪资源需要联网从第三方 CDN 加载。

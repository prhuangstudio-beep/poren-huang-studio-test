# Poren Huang Studio

Simple static website: no build tools, dependencies, or framework required.

## 交付前自檢

每次網站修改完成後，先執行：

```bash
npm run check
```

它會檢查作品資料、產生的作品頁、網站地圖、主要頁面的 SEO 基本標記、圖片 alt 文字、測試站同步狀態與未提交變更。檢查通過只代表技術自檢完成；更新 `porenhuang.com` 前仍須取得使用者明確同意。

Open `index.html` in a browser. Replace the five image placeholders in `works.html` and `index.html` after Drive images are supplied. Keep the artwork image files in `assets/images/` and use descriptive lowercase names, e.g. `2026-work-title.jpg`.

Update content in the matching HTML file. Common styling is isolated in `assets/style.css`; the sole JavaScript file only sets the copyright year.

# Phase 3: Kiểm Thử Linting, Build & Visual Verification

- **Parent Plan**: `plans/260903-1558-ui-design-reskin/plan.md`
- **Status**: Pending execution
- **Scope**: Validation & Verification gates

---

## 1. Các Bước Kiểm Thử Cần Thực Hiện

### 1.1 Linting Gate

Chạy lệnh kiểm tra stylelint trên toàn bộ package UI:

```bash
pnpm run lint:css
```

- **Kỳ vọng**: Exit code 0, không có lỗi vi phạm `no-max-width-media-query`, `no-non-standard-breakpoints`, `no-important`, `no-subpixel-values`.

### 1.2 Build Gate

Chạy lệnh compile core UI package:

```bash
pnpm run build:ui
```

- **Kỳ vọng**: Build thành công thư mục `dist/` của package `@payloadcms/ui` mà không có lỗi cú pháp hay thiếu biến CSS.

### 1.3 Runtime & Visual Verification (Optional / User Triggered)

Chạy dev server để kiểm tra hiển thị thực tế:

```bash
pnpm run dev
```

- Điều hướng tới `http://localhost:3000/admin`.
- Kiểm tra các màn hình:
  1. Dashboard tổng quan (stat cards, nav sidebar).
  2. List View (table rows, pagination, search bar, filters).
  3. Edit Document View (input fields, selects, tabs, drawer, autosave banner).
- Bật/tắt theme switch (Light $\leftrightarrow$ Dark) kiểm tra độ sắc nét của viền, độ tương phản text và shadow của popups/modals.

---

## 2. Tiêu Chí Hoàn Thành (Definition of Done)

- Cả 2 lệnh `pnpm run lint:css` và `pnpm run build:ui` đều trả về thành công (Exit 0).
- Visual check đạt chuẩn Linear/Vercel: hiện đại, sắc nét, không vỡ layout.

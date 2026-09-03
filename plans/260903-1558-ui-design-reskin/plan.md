# Plan: Nâng Cấp Toàn Diện Payload Admin UI Theo Chuẩn awesome-design-md

- **Plan Directory**: `plans/260903-1558-ui-design-reskin/`
- **Created**: 2026-09-03
- **Status**: Ready for execution (`/ak:cook`)
- **Archetype**: Linear / Vercel (Minimal, Dark Carbon & Crisp Light, Precision Hairline Borders)
- **Scope**: `DESIGN.md` single source-of-truth + Reskin CSS tokens (`colors.css`, `theme.css`, `elevations.css`)

---

## 1. Mục Tiêu & Yêu Cầu (Goals & Acceptance Criteria)

### Mục tiêu cốt lõi:

1. Xây dựng tài liệu `DESIGN.md` chuẩn 9 phần (Google Stitch / awesome-design-md) đặt tại root repo, định nghĩa toàn bộ quy chuẩn thiết kế UI làm SSoT cho AI agents và team.
2. Reskin toàn diện visual token của Payload CMS qua CSS tokens tại `packages/ui/src/css/` theo phong cách Linear/Vercel:
   - Dark mode: Carbon `#08090a`, surface `#121315`, viền hairline `#232528`, text `#f7f8f8`, accent blue `#0070f3` / `#3b82f6`.
   - Light mode: Canvas `#fcfcfc`, surface `#ffffff`, viền `#e6e8eb`, text `#111827`, accent `#0070f3`.
3. Giữ nguyên 100% code TSX/JSX của hơn 1.200 file trong `packages/ui`, không gây breaking change accessibility hay form logic.
4. Tuân thủ 100% Stylelint rules của Payload CMS (`@layer payload-default`, không `!important`, 4 breakpoints chuẩn, logical properties).

### Tiêu chí nghiệm thu (Acceptance Criteria):

- `DESIGN.md` tồn tại ở root repo, đầy đủ 9 phần tiêu chuẩn.
- `pnpm run lint:css` chạy thành công (exit code 0).
- `pnpm run build:ui` build thành công (exit code 0).
- Giao diện Admin hiển thị đúng tông màu Linear/Vercel trên cả Light và Dark mode.

---

## 2. Danh Sách Các Phase Thực Thi

| Phase       | Tên Phase                                                | File Kế Hoạch                 | File Tác Động                                                                                               |
| ----------- | -------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Phase 1** | Soạn thảo `DESIGN.md` SSoT chuẩn 9 phần                  | `phase-01-design-md.md`       | `DESIGN.md`                                                                                                 |
| **Phase 2** | Reskin Core CSS Tokens (`colors`, `theme`, `elevations`) | `phase-02-core-css-reskin.md` | `packages/ui/src/css/colors.css`<br>`packages/ui/src/css/theme.css`<br>`packages/ui/src/css/elevations.css` |
| **Phase 3** | Kiểm thử Linting, Build & Visual Verification            | `phase-03-verification.md`    | (Kiểm thử, không sửa code)                                                                                  |

---

## 3. Rủi Ro & Biện Pháp Kiểm Soát (Risks & Rollback)

- **Rủi ro**: Độ tương phản text hoặc placeholder quá thấp trong Dark mode gây khó đọc dữ liệu bảng/form.
  - _Kiểm soát_: Tuân thủ WCAG AA contrast ratio (tối thiểu 4.5:1 cho text chính, 3:1 cho secondary text).
- **Rủi ro**: Stylelint báo lỗi subpixel precision hoặc thiếu `@layer`.
  - _Kiểm soát_: Giữ nguyên wrapper `@layer payload-default` và kiểm tra kỹ bằng `pnpm run lint:css`.
- **Rollback**: Toàn bộ thay đổi gói gọn trong 3 file CSS và 1 file markdown, có thể rollback tức thì bằng `git checkout` nếu cần.

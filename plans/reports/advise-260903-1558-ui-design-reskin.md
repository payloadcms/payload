# Advisory Report: Nâng Cấp Toàn Diện Payload Admin UI Theo Chuẩn awesome-design-md

- **Date**: 2026-09-03
- **Context**: Payload CMS Monorepo (`packages/ui`)
- **Archetype**: Linear / Vercel (Minimal, high-contrast, precision borders, dark carbon & clean light)
- **Scope**: `DESIGN.md` single source-of-truth + Reskin Core CSS Tokens

---

## 1. Verdict

Payload CMS có kiến trúc UI phân tầng chặt chẽ bằng CSS `@layer payload-default` với hơn 1.200 file component. Đập đi xây lại component JSX/TSX là tự sát kỹ thuật (vỡ accessibility, breaking change diện rộng, công sức khổng lồ). Hướng đi tối ưu: **Reskin visual tokens** qua các file CSS gốc (`colors.css`, `theme.css`, `elevations.css`, `typography.css`) kết hợp tạo file `DESIGN.md` chuẩn 9 phần theo cấu trúc `awesome-design-md`. Giao diện đạt độ sắc nét chuẩn tech SaaS mà không chạm một dòng code React.

---

## 2. Việc Nên Làm (What you should do)

1. **Tạo `DESIGN.md` ở root repo**:
   - Soạn theo chuẩn Google Stitch / awesome-design-md đủ 9 phần: Visual Theme, Color Palette & Roles, Typography Rules, Component Stylings, Layout Principles, Depth & Elevation, Do's & Don'ts, Responsive Behavior, Agent Prompt Guide.
   - Định nghĩa rõ ràng 2 bộ màu: Dark mode (nền carbon `#08090a`, viền hairline `#232528`, text `#f7f8f8`) và Light mode (nền tinh sạch `#fcfcfc`, surface `#ffffff`, viền `#e6e8eb`).
2. **Nâng cấp `packages/ui/src/css/colors.css`**:
   - Map lại các biến `--color-bg-*`, `--color-text-*`, `--color-border-*` về palette Linear / Vercel.
   - Tăng độ tương phản text phân cấp: primary text sáng rõ, secondary text dịu mắt, muted text đọc được.
   - Thêm sắc thái border viền siêu mỏng (subtle hairline borders) đặc trưng của Vercel/Linear.
3. **Nâng cấp `packages/ui/src/css/theme.css` & `elevations.css`**:
   - Chuẩn hóa bo góc: chuyển từ radius tròn trịa sang radius sắc sảo tinh gọn (`--radius-small: 4px`, `--radius-medium: 6px`, `--radius-large: 8px`).
   - Tinh chỉnh shadow trong `elevations.css`: bỏ shadow mờ đục cũ, thay bằng ambient shadow mỏng kết hợp border 1px cho Dark mode (tạo chiều sâu sắc nét).
4. **Giữ nguyên CSS Layer & Selector Rules**:
   - Mọi override token phải nằm trong `@layer payload-default`.
   - Giữ nguyên naming convention: `--color-*`, `--spacer-*`, logical properties (`padding-inline`, `margin-block`).
   - Tuyệt đối không dùng `!important`.

---

## 3. Việc Không Nên Làm (What you shouldn't do)

1. **Không sửa component JSX/TSX**: Không chèn inline style, không thêm class lạ vào các file `.tsx` trong `packages/ui/src/elements/`.
2. **Không phá vỡ theme toggle**: Không ép cứng Dark mode bằng cách hardcode màu đen lên `:root` chung; phải tách biệt chuẩn xác giữa `:root` (light) và `[data-theme='dark']` hoặc `@media (prefers-color-scheme: dark)`.
3. **Không phá vỡ Stylelint rules của Payload**:
   - Không dùng `max-width` media queries (chỉ dùng mobile-first `min-width`).
   - Không tự chế breakpoint (chỉ dùng 4 mốc: 400px, 768px, 1024px, 1440px).
   - Không dùng giá trị subpixel không hợp lệ.
4. **Không nạp thư viện UI ngoài**: Không cài thêm Tailwind, shadcn, Radix hay AntD vào `packages/ui` vì Payload đã có hệ thống component thuần hiệu năng cao.

---

## 4. Giải Pháp Tối Ưu / Tiết Kiệm (What could be better / more efficient)

- **Tận dụng Cascading Token Inheritance**: Payload đã trỏ các component về CSS variables trung tâm (`--field-border-radius`, `--button-radius`, `--color-bg`, `--color-border`). Chỉ cần sửa 1 token ở file gốc, hàng trăm component tự động thay đổi đồng bộ.
- **Workflow phân nhánh an toàn**:
  - Dùng skill `ak:plan` để lập plan thực thi chi tiết.
  - Dùng skill `ak:cook` để áp dụng các thay đổi CSS.
  - Dùng Playwright MCP (`browser_navigate`, `browser_take_screenshot`) và `pnpm run lint:css` để verify kết quả trực quan ngay trên test app.

---

## 5. Lộ Trình Triển Khai Khuyến Nghị (Step-level route)

1. **Bước 1**: Tạo file `DESIGN.md` ở root, tổng hợp chuẩn hóa aesthetic Linear/Vercel (bảng màu, spacing, elevation, border).
2. **Bước 2**: Chỉnh sửa `packages/ui/src/css/colors.css` (cập nhật palette ramp và semantic tokens).
3. **Bước 3**: Chỉnh sửa `packages/ui/src/css/theme.css` (bán kính góc bo, stroke width, field & button metrics) và `elevations.css` (shadows).
4. **Bước 4**: Chạy `pnpm run lint:css` và `pnpm run build:ui` đảm bảo không dính lỗi lint hoặc syntax.
5. **Bước 5**: Khởi chạy dev server test (`pnpm run dev`), dùng tool browser snapshot / screenshot kiểm tra giao diện bảng điều khiển, collection list, document edit view ở cả 2 mode Light/Dark.

---

## 6. Lợi Ích (Benefits)

- **Nâng tầm thẩm mỹ vượt bậc**: Đưa toàn bộ Admin panel lên đẳng cấp dev tool hiện đại, chuyên nghiệp, tối giản.
- **Rủi ro kỹ thuật bằng 0**: Không gây regression logic form, autosave, authentication hay accessibility.
- **AI-Agent Ready**: File `DESIGN.md` đóng vai trò kim chỉ nam cho tất cả prompt / agent coding sau này luôn tạo UI nhất quán.
- **Tốc độ thực thi nhanh**: Chỉ tác động vài file CSS lõi thay vì phân tán sức lực vào hàng ngàn file component.

---

## 7. Đánh Đổi (Trade-offs)

- **Không thay đổi được bố cục DOM**: Các pattern bố cục cũ (nếu có vị trí chưa tối ưu) sẽ vẫn giữ nguyên, chỉ thay đổi lớp áo màu sắc, viền và khoảng cách.
- **Cần tinh chỉnh tương phản kỹ**: Tone màu Linear/Vercel thường có độ tương phản tinh tế; nếu chỉnh viền quá mờ trên màn hình chất lượng thấp có thể gây khó nhìn. Cần test kỹ WCAG AA.

---

## 8. Work Checklist & Success Metrics

### Work Checklist

- [ ] Soạn thảo và commit `DESIGN.md` chuẩn 9 phần theo mẫu `awesome-design-md` tại root repo.
- [ ] Cập nhật bảng màu Semantic trong `packages/ui/src/css/colors.css` (Light + Dark).
- [ ] Tinh chỉnh radius và control metrics trong `packages/ui/src/css/theme.css`.
- [ ] Tinh chỉnh layer bóng đổ elevation trong `packages/ui/src/css/elevations.css`.
- [ ] Chạy `pnpm run lint:css` không phát sinh cảnh báo hay lỗi.
- [ ] Chạy `pnpm run build:ui` build thành công.
- [ ] Test trực quan qua `pnpm run dev` trên 3 view chính: Dashboard, List View, Document Edit View.

### Success Metrics

1. **Linting**: Lệnh `pnpm run lint:css` trả về exit code 0.
2. **Build**: Lệnh `pnpm run build:ui` hoàn thành không lỗi.
3. **Theme Parity**: Chuyển đổi Light/Dark tức thì, không bị nhấp nháy hoặc mất tương phản chữ.
4. **Zero JSX Regression**: Số file `.tsx` bị thay đổi trong git diff là 0.

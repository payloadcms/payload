# Phase 1: Soạn Thảo `DESIGN.md` Chuẩn 9 Phần

- **Parent Plan**: `plans/260903-1558-ui-design-reskin/plan.md`
- **Status**: Pending execution
- **Target File**: `DESIGN.md` (root directory)

---

## 1. Yêu Cầu Chi Tiết (Requirements)

Xây dựng tài liệu `DESIGN.md` theo cấu trúc 9 phần chuẩn Google Stitch / awesome-design-md:

1. **Visual Theme & Atmosphere**:
   - Tinh thần: High-density engineering minimalism, precision borders, dark carbon & crisp light canvas.
   - Thẩm mỹ: Linear / Vercel archetype.
2. **Color Palette & Roles**:
   - Dark Mode: Surface base `#08090a`, card/panel `#121315`, border hairline `#232528`, text primary `#f7f8f8`, text secondary `#8a8f98`, accent `#0070f3`.
   - Light Mode: Canvas `#fcfcfc`, surface `#ffffff`, border `#e6e8eb`, text primary `#111827`, text secondary `#6b7280`, accent `#0070f3`.
   - Semantic roles: Success, Warning, Error, Info, Interactive states.
3. **Typography Rules**:
   - Font stack: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif. Monospace cho code/ID: JetBrains Mono, Fira Code, monospace.
   - Hierarchy: Heading scales, body sizes, line-height, letter-spacing (tight for headings).
4. **Component Stylings**:
   - Button (Primary, Secondary, Ghost, Danger), Input/Select fields, Table rows, Cards/Drawers/Modals.
5. **Layout Principles**:
   - Spacing scale (`--spacer-*` từ 0 đến 40px), grid system, 4 canonical breakpoints (400, 768, 1024, 1440px).
6. **Depth & Elevation**:
   - Shadow layers (`--elevation-100` đến `--elevation-500`), ambient occlusion, 1px border contrast thay cho heavy shadow ở Dark mode.
7. **Do's and Don'ts**:
   - Do: Dùng token semantic, dùng logical properties, tuân thủ mobile-first.
   - Don't: Dùng `!important`, chế breakpoint lạ, dùng màu raw palette ngoài `colors.css`.
8. **Responsive Behavior**:
   - Collapsing rules, touch targets, drawer drawer-on-mobile.
9. **Agent Prompt Guide**:
   - Hướng dẫn ngắn gọn cho AI agents khi sinh UI components mới trong repo Payload.

---

## 2. Tiêu Chí Hoàn Thành (Definition of Done)

- File `DESIGN.md` được tạo ở root repo, định dạng markdown rõ ràng, không có placeholder chưa điền.

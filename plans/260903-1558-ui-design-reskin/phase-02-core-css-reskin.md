# Phase 2: Reskin Core CSS Tokens

- **Parent Plan**: `plans/260903-1558-ui-design-reskin/plan.md`
- **Status**: Pending execution
- **Target Files**:
  - `packages/ui/src/css/colors.css`
  - `packages/ui/src/css/theme.css`
  - `packages/ui/src/css/elevations.css`

---

## 1. Yêu Cầu Chi Tiết (Requirements)

### 1.1 `packages/ui/src/css/colors.css`

- **Light Theme**:
  - `--color-bg`: `#fcfcfc` (canvas sạch tinh tế)
  - `--color-bg-secondary`: `#f4f5f6`
  - `--color-bg-tertiary`: `#ebeef0`
  - `--color-text`: `#111827` (tương phản cao, dễ đọc)
  - `--color-text-secondary`: `#4b5563`
  - `--color-text-muted`: `#9ca3af`
  - `--color-border`: `#e5e7eb` (viền mảnh tinh gọn)
  - `--color-border-secondary`: `#f3f4f6`
  - `--color-brand`: `#0070f3` (Vercel blue) hoặc `#000000` (Linear monochrome action)
- **Dark Theme (`[data-theme='dark']`)**:
  - `--color-bg`: `#08090a` (carbon tối sâu thẳm, không phải xám đục)
  - `--color-bg-secondary`: `#101113` (card/sidebar)
  - `--color-bg-tertiary`: `#18191b` (hover states, modal surface)
  - `--color-text`: `#f7f8f8` (chữ trắng ngà sắc nét)
  - `--color-text-secondary`: `#8a8f98`
  - `--color-text-muted`: `#62666d`
  - `--color-border`: `#232528` (hairline border tương phản tinh tế)
  - `--color-border-secondary`: `#1c1d20`
  - `--color-brand`: `#0070f3` / `#3b82f6`

### 1.2 `packages/ui/src/css/theme.css`

- Tinh chỉnh radius về chuẩn sắc nét hiện đại:
  - `--radius-small`: `4px` (thay vì 2px)
  - `--radius-medium`: `6px` (thay vì 5px)
  - `--radius-large`: `8px` hoặc `10px` (thay vì 13px quá tròn)
  - `--button-radius`: `var(--radius-medium)` (6px)
  - `--field-border-radius`: `var(--radius-medium)` (6px)
  - `--popup-radius`: `var(--radius-large)` (8px)

### 1.3 `packages/ui/src/css/elevations.css`

- **Light Theme**:
  - `--elevation-100-canvas`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
  - `--elevation-300-tooltip`: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`
  - `--elevation-400-menu-panel`: `0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05)`
  - `--elevation-500-modal-window`: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)`
- **Dark Theme (`[data-theme='dark']`)**:
  - Thay thế shadow mờ đục bằng sự kết hợp giữa ambient dark shadow và hairline border 1px:
  - `--elevation-400-menu-panel`: `0 0 0 1px #232528, 0 12px 24px -4px rgba(0, 0, 0, 0.5)`
  - `--elevation-500-modal-window`: `0 0 0 1px #2a2d31, 0 24px 48px -12px rgba(0, 0, 0, 0.7)`

---

## 2. Tiêu Chí Hoàn Thành (Definition of Done)

- Các file CSS trên được cập nhật chuẩn xác trong `@layer payload-default`.
- Không vi phạm các quy tắc Stylelint của repo (không `!important`, số nguyên cho box-model, format hợp lệ).

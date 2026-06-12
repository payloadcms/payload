import type { PluginLanguage } from '../types.js'

export const viTranslations = {
  'plugin-mcp': {
    apiKeyDescription: 'Khóa API kiểm soát các bộ sưu tập, tài nguyên, công cụ và prompt mà client MCP có thể truy cập.',
    apiKeys: 'Khóa API',
    authentication: 'Xác thực',
    description: 'Mô tả',
    descriptionDescription: 'Mô tả mục đích của khóa API.',
    dismiss: 'Đóng',
    keepKeyPrivate: 'Giữ khóa của bạn riêng tư.',
    keyPrivateDescription: 'Khóa này cấp cho MCP quyền truy cập nội dung của bạn. Đừng chia sẻ với người khác!',
    lastUsed: 'Lần dùng cuối',
    manageAPIKeys: 'Quản lý khóa API',
    mcp: 'MCP',
    noAPIKeys: 'Không có khóa API',
    operations: 'Thao tác',
    overrideAccess: 'Ghi đè kiểm soát truy cập',
    overrideAccessDescription: 'Khi bật, khóa này bỏ qua kiểm soát truy cập của Payload trong mọi thao tác. Hãy để tắt trừ khi bạn có lý do cụ thể.',
    permissions: 'Quyền',
    permissionsDescription: 'Cho phép client MCP truy cập các bộ sưu tập, công cụ, tài nguyên và prompt sau.',
    prompts: 'Prompt',
    resources: 'Tài nguyên',
    server: 'Máy chủ',
    title: 'Tiêu đề',
    titleDescription: 'Tên gợi nhớ hữu ích cho khóa API.',
    tools: 'Công cụ',
    userDescription: 'Người dùng mà MCP sẽ đại diện để hành động.',
  },
}

export const vi: PluginLanguage = {
  dateFNSKey: 'vi',
  translations: viTranslations,
}

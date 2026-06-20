import type { PluginLanguage } from '../types.js'

export const koTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'API 키는 MCP 클라이언트가 접근할 수 있는 컬렉션, 리소스, 도구, 프롬프트를 제어합니다.',
    apiKeys: 'API 키',
    authentication: '인증',
    confirmRotation: 'Confirm rotation',
    description: '설명',
    descriptionDescription: 'API 키의 목적을 설명하세요.',
    dismiss: '닫기',
    errorRotatingAPIKey: 'Failed to rotate API key.',
    keepKeyPrivate: '키를 비공개로 유지하세요.',
    keyPrivateDescription:
      '이 키는 MCP에 콘텐츠 접근 권한을 부여합니다. 다른 사람과 공유하지 마세요!',
    lastUsed: '마지막 사용',
    manageAPIKeys: 'API 키 관리',
    mcp: 'MCP',
    noAPIKeys: 'API 키 없음',
    operations: '작업',
    overrideAccess: '접근 제어 재정의',
    overrideAccessDescription:
      '선택하면 이 키가 수행하는 모든 작업에서 Payload 접근 제어를 우회합니다. 특별한 이유가 없다면 선택하지 마세요.',
    permissions: '권한',
    permissionsDescription:
      'MCP 클라이언트가 다음 컬렉션, 도구, 리소스, 프롬프트에 접근하도록 허용합니다.',
    prompts: '프롬프트',
    resources: '리소스',
    rotate: 'Rotate',
    rotateAPIKey: 'Rotate API key',
    server: '서버',
    title: '제목',
    titleDescription: 'API 키에 사용할 유용한 별칭입니다.',
    tools: '도구',
    userDescription: 'MCP가 대신 작업할 사용자입니다.',
  },
}

export const ko: PluginLanguage = {
  dateFNSKey: 'ko',
  translations: koTranslations,
}

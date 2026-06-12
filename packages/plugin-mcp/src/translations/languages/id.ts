import type { PluginLanguage } from '../types.js'

export const idTranslations = {
  'plugin-mcp': {
    apiKey: 'Kunci API',
    apiKeyDescription: 'Kunci API mengontrol koleksi, resource, alat, dan prompt yang dapat diakses klien MCP.',
    apiKeys: 'Kunci API',
    authentication: 'Autentikasi',
    collections: 'Koleksi',
    custom: 'Kustom',
    description: 'Deskripsi',
    descriptionDescription: 'Jelaskan tujuan kunci API.',
    dismiss: 'Tutup',
    generateAPIKey: 'Buat Kunci API',
    generateNewKey: 'Buat kunci baru',
    globals: 'Global',
    keepKeyPrivate: 'Jaga kunci Anda tetap rahasia.',
    keyPrivateDescription: 'Kunci ini memberi MCP akses ke konten Anda. Jangan bagikan dengan orang lain!',
    lastUsed: 'Terakhir digunakan',
    manageAPIKeys: 'Kelola kunci API',
    mcp: 'MCP',
    noAPIKeys: 'Tidak ada kunci API',
    operations: 'Operasi',
    overrideAccess: 'Abaikan kontrol akses',
    overrideAccessDescription: 'Jika dicentang, kunci ini melewati kontrol akses Payload pada setiap operasi. Biarkan tidak dicentang kecuali Anda memiliki alasan khusus.',
    owner: 'Pemilik',
    permissions: 'Izin',
    permissionsDescription: 'Izinkan klien MCP mengakses koleksi, alat, resource, dan prompt berikut.',
    prompts: 'Prompt',
    resources: 'Resource',
    server: 'Server',
    title: 'Judul',
    titleDescription: 'Nama panggilan yang berguna untuk kunci API.',
    tools: 'Alat',
    userDescription: 'Pengguna yang akan digunakan MCP untuk bertindak.',
  },
}

export const id: PluginLanguage = {
  dateFNSKey: 'id',
  translations: idTranslations,
}

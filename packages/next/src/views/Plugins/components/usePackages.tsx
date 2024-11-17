import { useEffect, useState } from 'react'

export interface Package {
  description: string
  downloads: number
  isInstalled?: boolean
  name: string
  rating: number
  version: string
}

// Mocked data for demonstration
const MOCK_PACKAGES: Package[] = [
  {
    name: '@payloadcms/plugin-cloud',
    description: 'Official Payload Cloud plugin for PayloadCMS',
    downloads: 25000,
    isInstalled: true,
    rating: 4.8,
    version: '1.0.0',
  },
  {
    name: '@payloadcms/plugin-seo',
    description: 'SEO plugin for PayloadCMS with automatic meta tags and sitemap generation',
    downloads: 45000,
    isInstalled: true,
    rating: 4.9,
    version: '2.1.0',
  },
  {
    name: '@payloadcms/plugin-nested-docs',
    description: 'Nested documents plugin for PayloadCMS',
    downloads: 12000,
    rating: 4.5,
    version: '0.9.0',
  },
  {
    name: '@payloadcms/plugin-form-builder',
    description: 'Powerful form builder plugin for PayloadCMS',
    downloads: 32000,
    rating: 4.7,
    version: '1.2.0',
  },
  {
    name: 'payload-plugin-custom-fields',
    description: 'Custom fields collection for PayloadCMS',
    downloads: 8000,
    rating: 4.2,
    version: '0.5.0',
  },
  {
    name: '@payloadcms/plugin-redirects',
    description: 'URL redirects management for PayloadCMS',
    downloads: 15000,
    rating: 4.6,
    version: '1.1.0',
  },
]

export const usePackages = (searchTerm: string, activeTab: 'all' | 'installed') => {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchPackages = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 800))

      let filteredPackages = MOCK_PACKAGES

      if (searchTerm) {
        filteredPackages = filteredPackages.filter(
          (pkg) =>
            pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.description.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      }

      if (activeTab === 'installed') {
        filteredPackages = filteredPackages.filter((pkg) => pkg.isInstalled)
      }

      setPackages(filteredPackages)
      setLoading(false)
    }

    fetchPackages().catch((error) => {
      throw new Error(error)
    })
  }, [searchTerm, activeTab])

  return { loading, packages }
}

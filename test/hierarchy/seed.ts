import type { Payload } from 'payload'

import { departmentsSlug, foldersSlug, organizationsSlug, productsSlug } from './shared.js'

export async function seed(payload: Payload): Promise<void> {
  // Create organization hierarchy
  const acmeCorp = await payload.create({
    collection: organizationsSlug,
    data: { title: 'Acme Corp' },
  })

  const engineeringDiv = await payload.create({
    collection: organizationsSlug,
    data: { parent: acmeCorp.id, title: 'Engineering Division' },
  })

  await payload.create({
    collection: organizationsSlug,
    data: { parent: engineeringDiv.id, title: 'Frontend Team' },
  })

  await payload.create({
    collection: organizationsSlug,
    data: { parent: engineeringDiv.id, title: 'Backend Team' },
  })

  await payload.create({
    collection: organizationsSlug,
    data: { parent: acmeCorp.id, title: 'Marketing Division' },
  })

  // Create department hierarchy (tests custom field names)
  const hrDept = await payload.create({
    collection: departmentsSlug,
    data: { deptName: 'Human Resources' },
  })

  await payload.create({
    collection: departmentsSlug,
    data: { deptName: 'Recruiting', parentDept: hrDept.id },
  })

  await payload.create({
    collection: departmentsSlug,
    data: { deptName: 'Benefits', parentDept: hrDept.id },
  })

  const financeDept = await payload.create({
    collection: departmentsSlug,
    data: { deptName: 'Finance' },
  })

  await payload.create({
    collection: departmentsSlug,
    data: { deptName: 'Accounting', parentDept: financeDept.id },
  })

  // Create product hierarchy (tests localization)
  const electronicsCategory = await payload.create({
    collection: productsSlug,
    data: { name: 'Electronics' },
  })

  const computersCategory = await payload.create({
    collection: productsSlug,
    data: { name: 'Computers', parent: electronicsCategory.id },
  })

  await payload.create({
    collection: productsSlug,
    data: { name: 'Laptops', parent: computersCategory.id },
  })

  await payload.create({
    collection: productsSlug,
    data: { name: 'Desktops', parent: computersCategory.id },
  })

  await payload.create({
    collection: productsSlug,
    data: { name: 'Phones', parent: electronicsCategory.id },
  })

  // Create folder hierarchy (tests collectionSpecific filter)
  // Root folders with different allowedTypes
  const generalFolder = await payload.create({
    collection: foldersSlug,
    data: { name: 'General' }, // No restriction - accepts all types
  })

  await payload.create({
    collection: foldersSlug,
    data: { allowedTypes: [organizationsSlug], name: 'Orgs Only' },
  })

  await payload.create({
    collection: foldersSlug,
    data: { allowedTypes: [productsSlug], name: 'Products Only' },
  })

  await payload.create({
    collection: foldersSlug,
    data: { allowedTypes: [organizationsSlug, productsSlug], name: 'Orgs and Products' },
  })

  // Nested folder
  await payload.create({
    collection: foldersSlug,
    data: { name: 'Subfolder', parentFolder: generalFolder.id },
  })
}

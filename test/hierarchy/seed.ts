import type { Payload } from 'payload'

import {
  departmentsSlug,
  divisionsSlug,
  foldersSlug,
  organizationsSlug,
  productsSlug,
} from './shared.js'

export async function seed(payload: Payload): Promise<void> {
  // Create divisions hierarchy (dedicated to tree-limit / load-more keyboard tests)
  const alphaDivision = await payload.create({
    collection: divisionsSlug,
    data: { title: 'Alpha Division' },
    overrideAccess: true,
  })

  await payload.create({
    collection: divisionsSlug,
    data: { parent: alphaDivision.id, title: 'Alpha Child 1' },
    overrideAccess: true,
  })
  await payload.create({
    collection: divisionsSlug,
    data: { parent: alphaDivision.id, title: 'Alpha Child 2' },
    overrideAccess: true,
  })
  await payload.create({
    collection: divisionsSlug,
    data: { parent: alphaDivision.id, title: 'Alpha Child 3' },
    overrideAccess: true,
  })
  await payload.create({
    collection: divisionsSlug,
    data: { parent: alphaDivision.id, title: 'Alpha Child 4' },
    overrideAccess: true,
  })

  await payload.create({
    collection: divisionsSlug,
    data: { title: 'Beta Division' },
    overrideAccess: true,
  })
  await payload.create({
    collection: divisionsSlug,
    data: { title: 'Gamma Division' },
    overrideAccess: true,
  })

  // Create organization hierarchy
  const acmeCorp = await payload.create({
    collection: organizationsSlug,
    data: { title: 'Acme Corp' },
    overrideAccess: true,
  })

  await payload.create({
    collection: organizationsSlug,
    data: { title: 'Beta Corp' },
    overrideAccess: true,
  })

  await payload.create({
    collection: organizationsSlug,
    data: { title: 'Gamma Corp' },
    overrideAccess: true,
  })

  const engineeringDiv = await payload.create({
    collection: organizationsSlug,
    data: { parent: acmeCorp.id, title: 'Engineering Division' },
    overrideAccess: true,
  })

  await payload.create({
    collection: organizationsSlug,
    data: { parent: engineeringDiv.id, title: 'Frontend Team' },
    overrideAccess: true,
  })

  await payload.create({
    collection: organizationsSlug,
    data: { parent: engineeringDiv.id, title: 'Backend Team' },
    overrideAccess: true,
  })

  await payload.create({
    collection: organizationsSlug,
    data: { parent: acmeCorp.id, title: 'Marketing Division' },
    overrideAccess: true,
  })

  await payload.create({
    collection: organizationsSlug,
    data: { parent: acmeCorp.id, title: 'Zeta Division' },
    overrideAccess: true,
  })

  // Create department hierarchy (tests custom field names)
  const hrDept = await payload.create({
    collection: departmentsSlug,
    data: { deptName: 'Human Resources' },
    overrideAccess: true,
  })

  await payload.create({
    collection: departmentsSlug,
    data: { deptName: 'Recruiting', parentDept: hrDept.id },
    overrideAccess: true,
  })

  await payload.create({
    collection: departmentsSlug,
    data: { deptName: 'Benefits', parentDept: hrDept.id },
    overrideAccess: true,
  })

  const financeDept = await payload.create({
    collection: departmentsSlug,
    data: { deptName: 'Finance' },
    overrideAccess: true,
  })

  await payload.create({
    collection: departmentsSlug,
    data: { deptName: 'Accounting', parentDept: financeDept.id },
    overrideAccess: true,
  })

  // Create product hierarchy (tests localization)
  const electronicsCategory = await payload.create({
    collection: productsSlug,
    data: { name: 'Electronics' },
    overrideAccess: true,
  })

  const computersCategory = await payload.create({
    collection: productsSlug,
    data: { name: 'Computers', parent: electronicsCategory.id },
    overrideAccess: true,
  })

  await payload.create({
    collection: productsSlug,
    data: { name: 'Laptops', parent: computersCategory.id },
    overrideAccess: true,
  })

  await payload.create({
    collection: productsSlug,
    data: { name: 'Desktops', parent: computersCategory.id },
    overrideAccess: true,
  })

  await payload.create({
    collection: productsSlug,
    data: { name: 'Phones', parent: electronicsCategory.id },
    overrideAccess: true,
  })

  // Create folder hierarchy (tests collectionSpecific filter)
  // Root folders with different allowedTypes
  const generalFolder = await payload.create({
    collection: foldersSlug,
    data: { name: 'General' }, // No restriction - accepts all types
    overrideAccess: true,
  })

  await payload.create({
    collection: foldersSlug,
    data: { allowedTypes: [organizationsSlug], name: 'Orgs Only' },
    overrideAccess: true,
  })

  await payload.create({
    collection: foldersSlug,
    data: { allowedTypes: [productsSlug], name: 'Products Only' },
    overrideAccess: true,
  })

  await payload.create({
    collection: foldersSlug,
    data: { allowedTypes: [organizationsSlug, productsSlug], name: 'Orgs and Products' },
    overrideAccess: true,
  })

  // Nested folder
  await payload.create({
    collection: foldersSlug,
    data: { name: 'Subfolder', parentFolder: generalFolder.id },
    overrideAccess: true,
  })
}

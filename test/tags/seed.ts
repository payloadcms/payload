import type { Payload } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'

import { mediaSlug, pagesSlug, postsSlug, tagsSlug } from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const seed = async (payload: Payload): Promise<void> => {
  // Seasons
  const seasons = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Seasons', description: 'Seasonal recipes' } as any,
  })

  const spring = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Spring', [`_h_${tagsSlug}`]: seasons.id } as any,
  })

  const summer = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Summer', [`_h_${tagsSlug}`]: seasons.id } as any,
  })

  const fall = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Fall', [`_h_${tagsSlug}`]: seasons.id } as any,
  })

  const winter = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Winter', [`_h_${tagsSlug}`]: seasons.id } as any,
  })

  // Cuisines
  const cuisines = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Cuisines', description: 'World cuisines' } as any,
  })

  const italian = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Italian', [`_h_${tagsSlug}`]: cuisines.id } as any,
  })

  const mexican = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Mexican', [`_h_${tagsSlug}`]: cuisines.id } as any,
  })

  const asian = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Asian', [`_h_${tagsSlug}`]: cuisines.id } as any,
  })

  const american = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'American', [`_h_${tagsSlug}`]: cuisines.id } as any,
  })

  // Meal Type
  const mealType = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Meal Type', description: 'Type of meal' } as any,
  })

  const breakfast = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Breakfast', [`_h_${tagsSlug}`]: mealType.id } as any,
  })

  const lunch = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Lunch', [`_h_${tagsSlug}`]: mealType.id } as any,
  })

  const dinner = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Dinner', [`_h_${tagsSlug}`]: mealType.id } as any,
  })

  const dessert = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Dessert', [`_h_${tagsSlug}`]: mealType.id } as any,
  })

  // Years
  const years = await payload.create({
    collection: tagsSlug as any,
    data: { name: 'Years', description: 'Recipe archive by year' } as any,
  })

  const year2023 = await payload.create({
    collection: tagsSlug as any,
    data: { name: '2023', [`_h_${tagsSlug}`]: years.id } as any,
  })

  const year2024 = await payload.create({
    collection: tagsSlug as any,
    data: { name: '2024', [`_h_${tagsSlug}`]: years.id } as any,
  })

  // Load image file for media uploads
  const imageFilePath = path.resolve(dirname, '../uploads/image.png')
  const imageFile = await getFileByPath(imageFilePath)

  // Blog posts (recipes)
  await payload.create({
    collection: postsSlug as any,
    data: {
      [`_h_${tagsSlug}`]: [italian.id, dinner.id, fall.id, year2024.id],
      content:
        'Nothing beats a warm bowl of risotto on a crisp autumn evening. This classic recipe uses arborio rice, white wine, and freshly grated parmesan.',
      title: 'Creamy Mushroom Risotto',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      [`_h_${tagsSlug}`]: [mexican.id, dinner.id, summer.id, year2024.id],
      content:
        'Fire up the grill for these smoky carne asada tacos. Marinated flank steak with fresh pico de gallo and homemade guacamole.',
      title: 'Grilled Carne Asada Tacos',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      [`_h_${tagsSlug}`]: [asian.id, lunch.id, spring.id, year2024.id],
      content:
        'A light and refreshing poke bowl with sushi-grade tuna, edamame, cucumber, and a sesame ginger dressing.',
      title: 'Fresh Tuna Poke Bowl',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      [`_h_${tagsSlug}`]: [american.id, breakfast.id, winter.id, year2023.id],
      content:
        'Fluffy buttermilk pancakes stacked high with maple syrup, fresh berries, and a pat of butter. The ultimate weekend breakfast.',
      title: 'Classic Buttermilk Pancakes',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      [`_h_${tagsSlug}`]: [italian.id, dessert.id, summer.id, year2023.id],
      content:
        'Layers of espresso-soaked ladyfingers and mascarpone cream. This no-bake Italian classic is perfect for entertaining.',
      title: 'Traditional Tiramisu',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      [`_h_${tagsSlug}`]: [american.id, dinner.id, fall.id, year2024.id],
      content:
        'Juicy smash burgers with crispy edges, melted cheese, and all the fixings. Better than any restaurant.',
      title: 'Ultimate Smash Burgers',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      [`_h_${tagsSlug}`]: [asian.id, dinner.id, winter.id, year2024.id],
      content:
        'Rich and comforting tonkotsu ramen with a silky pork broth, soft-boiled egg, and hand-pulled noodles.',
      title: 'Homemade Tonkotsu Ramen',
    } as any,
  })

  await payload.create({
    collection: postsSlug as any,
    data: {
      [`_h_${tagsSlug}`]: [mexican.id, breakfast.id, spring.id, year2023.id],
      content:
        'Crispy tortillas topped with fried eggs, black beans, salsa verde, and crumbled queso fresco.',
      title: 'Huevos Rancheros',
    } as any,
  })

  // Pages (guides and about)
  await payload.create({
    collection: pagesSlug as any,
    data: {
      [`_h_${tagsSlug}`]: [italian.id],
      content:
        'Everything you need to know about Italian cooking: essential ingredients, techniques, and regional specialties.',
      title: 'Guide to Italian Cuisine',
    } as any,
  })

  await payload.create({
    collection: pagesSlug as any,
    data: {
      [`_h_${tagsSlug}`]: [summer.id],
      content:
        'Our favorite recipes for hot summer days: refreshing salads, grilled favorites, and frozen treats.',
      title: 'Summer Cooking Collection',
    } as any,
  })

  await payload.create({
    collection: pagesSlug as any,
    data: {
      [`_h_${tagsSlug}`]: [breakfast.id],
      content:
        'Start your day right with our curated breakfast recipes from quick weekday options to lazy weekend brunch.',
      title: 'Breakfast Ideas',
    } as any,
  })

  // Media items (food photos)
  await payload.create({
    collection: mediaSlug as any,
    data: { [`_h_${tagsSlug}`]: [italian.id, dinner.id] } as any,
    file: { ...imageFile, name: 'mushroom-risotto.png' } as any,
  })

  await payload.create({
    collection: mediaSlug as any,
    data: { [`_h_${tagsSlug}`]: [mexican.id, summer.id] } as any,
    file: { ...imageFile, name: 'carne-asada-tacos.png' } as any,
  })

  await payload.create({
    collection: mediaSlug as any,
    data: { [`_h_${tagsSlug}`]: [asian.id, lunch.id] } as any,
    file: { ...imageFile, name: 'tuna-poke-bowl.png' } as any,
  })

  await payload.create({
    collection: mediaSlug as any,
    data: { [`_h_${tagsSlug}`]: [american.id, breakfast.id] } as any,
    file: { ...imageFile, name: 'buttermilk-pancakes.png' } as any,
  })

  await payload.create({
    collection: mediaSlug as any,
    data: { [`_h_${tagsSlug}`]: [dessert.id, italian.id] } as any,
    file: { ...imageFile, name: 'tiramisu.png' } as any,
  })

  await payload.create({
    collection: mediaSlug as any,
    data: { [`_h_${tagsSlug}`]: [asian.id, winter.id] } as any,
    file: { ...imageFile, name: 'tonkotsu-ramen.png' } as any,
  })

  payload.logger.info('Tags seed completed!')
  payload.logger.info('Created: 18 tags, 8 posts, 3 pages, 6 media items')
}

import { getDishes } from '../src/api/feishu.js'

console.log('Testing getDishes...\n')

try {
  const dishes = await getDishes()

  console.log(`Found ${dishes.length} dishes\n`)

  // Show first 3 dishes with their image fields
  dishes.slice(0, 3).forEach((dish, index) => {
    console.log(`--- Dish ${index + 1}: ${dish.name} ---`)
    console.log('ID:', dish.id)
    console.log('image_url:', dish.image_url || '(empty)')
    console.log('image_url_v2:', dish.image_url_v2 || '(empty)')
    console.log('price:', dish.price)
    console.log()
  })
} catch (error) {
  console.error('Error:', error.message)
  console.error(error.stack)
}

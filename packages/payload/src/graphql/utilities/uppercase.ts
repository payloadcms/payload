function uppercase(str: string): string {
  const array1 = str.split(' ')
  const newarray1 = []

  for (let x = 0; x < array1.length; x += 1) {
    newarray1.push(array1[x].charAt(0).toUpperCase() + array1[x].slice(1))
  }
  return newarray1.join(' ')
}

export default uppercase

export default function isBase64Image(image: string): boolean {
  // Check if the image starts with the base64 prefix
  return /^data:image\/[a-z]+;base64,/.test(image);
}

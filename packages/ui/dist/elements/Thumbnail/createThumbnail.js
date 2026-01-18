/**
 * Create a thumbnail from a File object by drawing it onto an OffscreenCanvas
 */export const createThumbnail = file => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file); // Use Object URL directly
    img.onload = () => {
      const maxDimension = 280;
      let drawHeight, drawWidth;
      // Calculate aspect ratio
      const aspectRatio = img.width / img.height;
      // Determine dimensions to fit within maxDimension while maintaining aspect ratio
      if (aspectRatio > 1) {
        // Image is wider than tall
        drawWidth = maxDimension;
        drawHeight = maxDimension / aspectRatio;
      } else {
        // Image is taller than wide, or square
        drawWidth = maxDimension * aspectRatio;
        drawHeight = maxDimension;
      }
      const canvas = new OffscreenCanvas(drawWidth, drawHeight) // Create an OffscreenCanvas
      ;
      const ctx = canvas.getContext('2d');
      // Determine output format based on input file type
      const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = file.type === 'image/png' ? undefined : 0.8 // PNG doesn't use quality, use higher quality for JPEG
      ;
      // Draw the image onto the OffscreenCanvas with calculated dimensions
      ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
      // Convert the OffscreenCanvas to a Blob and free up memory
      canvas.convertToBlob({
        type: outputFormat,
        ...(quality && {
          quality
        })
      }).then(blob => {
        URL.revokeObjectURL(img.src); // Release the Object URL
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // Resolve as data URL
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }).catch(reject);
    };
    img.onerror = error => {
      URL.revokeObjectURL(img.src); // Release Object URL on error
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      reject(error);
    };
  });
};
//# sourceMappingURL=createThumbnail.js.map
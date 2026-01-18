import { jsx as _jsx } from "react/jsx-runtime";
export const UploadJSXConverter = {
  upload: ({
    node
  }) => {
    // TO-DO (v4): SerializedUploadNode should use UploadData_P4
    const uploadNode = node;
    if (typeof uploadNode.value !== 'object') {
      return null;
    }
    const uploadDoc = uploadNode.value;
    const alt = uploadNode.fields?.alt || uploadDoc?.alt || '';
    const url = uploadDoc.url;
    /**
    * If the upload is not an image, return a link to the upload
    */
    if (!uploadDoc.mimeType.startsWith('image')) {
      return /*#__PURE__*/_jsx("a", {
        href: url,
        rel: "noopener noreferrer",
        children: uploadDoc.filename
      });
    }
    /**
    * If the upload is a simple image with no different sizes, return a simple img tag
    */
    if (!uploadDoc.sizes || !Object.keys(uploadDoc.sizes).length) {
      return /*#__PURE__*/_jsx("img", {
        alt: alt,
        height: uploadDoc.height,
        src: url,
        width: uploadDoc.width
      });
    }
    /**
    * If the upload is an image with different sizes, return a picture element
    */
    const pictureJSX = [];
    // Iterate through each size in the data.sizes object
    for (const size in uploadDoc.sizes) {
      const imageSize = uploadDoc.sizes[size];
      // Skip if any property of the size object is null
      if (!imageSize || !imageSize.width || !imageSize.height || !imageSize.mimeType || !imageSize.filesize || !imageSize.filename || !imageSize.url) {
        continue;
      }
      const imageSizeURL = imageSize?.url;
      pictureJSX.push(/*#__PURE__*/_jsx("source", {
        media: `(max-width: ${imageSize.width}px)`,
        srcSet: imageSizeURL,
        type: imageSize.mimeType
      }, size));
    }
    // Add the default img tag
    pictureJSX.push(/*#__PURE__*/_jsx("img", {
      alt: alt,
      height: uploadDoc?.height,
      src: url,
      width: uploadDoc?.width
    }, 'image'));
    return /*#__PURE__*/_jsx("picture", {
      children: pictureJSX
    });
  }
};
//# sourceMappingURL=upload.js.map
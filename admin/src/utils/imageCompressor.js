/**
 * Client-side image compression utility.
 * Compresses large images (e.g. 5MB-10MB mobile camera photos) to ~100KB-200KB base64 / JPEG
 * to prevent MongoDB 16MB limit and Express 413 Payload Too Large errors.
 */

export const compressImageFile = (file, maxWidth = 1000, maxHeight = 1000, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File || file instanceof Blob)) {
      return resolve(null);
    }

    // If file is SVG or small GIF, return direct base64
    if (file.type === "image/svg+xml" || file.type === "image/gif") {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(event.target.result);
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first for maximum compression, fallback to jpeg
        try {
          const webpData = canvas.toDataURL("image/webp", quality);
          if (webpData && webpData.startsWith("data:image/webp")) {
            return resolve(webpData);
          }
        } catch {
          // fallback
        }

        const jpegData = canvas.toDataURL("image/jpeg", quality);
        resolve(jpegData);
      };

      img.onerror = () => {
        // Fallback to uncompressed if canvas load fails
        resolve(event.target.result);
      };

      img.src = event.target.result;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

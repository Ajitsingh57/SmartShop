/**
 * Optimizes image URLs for faster loading, automatic WebP/AVIF formatting,
 * and responsive dimensions via Cloudinary dynamic transformation flags.
 *
 * @param {string} url - Original image URL
 * @param {number} [width=400] - Desired maximum display width in pixels
 * @returns {string} - Optimized image URL
 */
export function getOptimizedImageUrl(url, width = 400) {
  if (!url || typeof url !== "string") return "";

  // If image is hosted on Cloudinary, inject automatic format and quality parameters
  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    const transformation = `f_auto,q_auto,w_${width},c_limit`;
    // Avoid duplicate transformations if already present
    if (url.includes("/upload/f_auto") || url.includes("/upload/q_auto")) {
      return url;
    }
    return url.replace("/upload/", `/upload/${transformation}/`);
  }

  return url;
}

export default getOptimizedImageUrl;

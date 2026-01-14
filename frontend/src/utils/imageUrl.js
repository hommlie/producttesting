
export const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;

    const baseUrl = import.meta.env.VITE_IMG_BASE_URL || 'http://localhost:5000';

    // Remove leading slash if present
    let path = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

    // Check if path already starts with uploads/ to avoid duplication
    if (path.startsWith('uploads/')) {
        return `${baseUrl}/${path}`;
    }

    return `${baseUrl}/uploads/${path}`;
};

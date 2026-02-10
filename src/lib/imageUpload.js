import api from './api';
import showToast from './toast';

export const uploadImage = async (file, type = 'image', language = 'en') => {
  if (!file) {
    return null;
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showToast.error(language === 'ar' ? 'الملف يجب أن يكون صورة' : 'File must be an image');
    return null;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast.error(language === 'ar' ? 'حجم الصورة يجب أن يكون أقل من 5MB' : 'Image size must be less than 5MB');
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('images', file); // Field name matches backend expectation

    const response = await api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Backend returns { success: true, data: { files: [{ url: '...' }] } }
    const files = response.data?.data?.files || response.data?.files || [];
    const imageUrl = files[0]?.url || files[0]?.path || response.data?.data?.url;

    if (imageUrl) {
      // Make sure the URL is absolute
      let fullUrl = imageUrl;
      if (!imageUrl.startsWith('http')) {
        // Remove /api from baseURL if it exists, then add the URL path
        const baseURL = (api.defaults?.baseURL || '').replace('/api', '');
        fullUrl = `${baseURL}${imageUrl}`;
      }
      showToast.success(language === 'ar' ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully');
      return fullUrl;
    } else {
      showToast.error(language === 'ar' ? 'فشل الحصول على رابط الصورة' : 'Failed to get image URL');
      return null;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    showToast.error(
      error.response?.data?.message || 
      (language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image')
    );
    return null;
  }
};

export const uploadVideo = async (file, language = 'en') => {
  if (!file) {
    return null;
  }

  // Validate file type
  if (!file.type.startsWith('video/')) {
    showToast.error(language === 'ar' ? 'الملف يجب أن يكون فيديو' : 'File must be a video');
    return null;
  }

  // Validate file size (max 100MB for video)
  if (file.size > 100 * 1024 * 1024) {
    showToast.error(language === 'ar' ? 'حجم الفيديو يجب أن يكون أقل من 100MB' : 'Video size must be less than 100MB');
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('video', file); // Use 'video' field name as updated in upload.service.js

    const response = await api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const files = response.data?.data?.files || response.data?.files || [];
    const videoUrl = files[0]?.url || files[0]?.path || response.data?.data?.url;

    if (videoUrl) {
      let fullUrl = videoUrl;
      if (!videoUrl.startsWith('http')) {
        const baseURL = (api.defaults?.baseURL || '').replace('/api', '');
        fullUrl = `${baseURL}${videoUrl}`;
      }
      showToast.success(language === 'ar' ? 'تم رفع الفيديو بنجاح' : 'Video uploaded successfully');
      return fullUrl;
    } else {
      showToast.error(language === 'ar' ? 'فشل الحصول على رابط الفيديو' : 'Failed to get video URL');
      return null;
    }
  } catch (error) {
    console.error('Error uploading video:', error);
    showToast.error(
      error.response?.data?.message || 
      (language === 'ar' ? 'فشل رفع الفيديو' : 'Failed to upload video')
    );
    return null;
  }
};

export default uploadImage;


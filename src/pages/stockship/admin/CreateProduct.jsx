import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Plus, Package, Languages, Image as ImageIcon, Search, Share2, Settings, Upload, X, Star, Trash2 } from 'lucide-react';
import showToast from '@/lib/toast';

// Helper function to get full image URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If it's already a full URL (http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a data URL (base64), return as is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // If it starts with /uploads, add the API base URL
  if (imageUrl.startsWith('/uploads')) {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return `${API_URL}${imageUrl}`;
  }
  
  // Otherwise, assume it's a relative path and add /uploads
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return `${API_URL}/uploads/${imageUrl}`;
};

// Image Preview Component with error handling
const ImagePreview = ({ imageUrl, altText, className = "w-full h-32" }) => {
  const [imageError, setImageError] = useState(false);
  const fullUrl = getImageUrl(imageUrl);
  
  if (!fullUrl || imageError) {
    return (
      <div className={`${className} bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs`}>
        {imageError ? 'Invalid Image URL' : 'No Image'}
      </div>
    );
  }
  
  return (
    <img
      src={fullUrl}
      alt={altText || 'Product image'}
      className={`${className} object-cover rounded`}
      crossOrigin="anonymous"
      onError={() => setImageError(true)}
    />
  );
};

const CreateProduct = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'translations', 'images', 'seo', 'social', 'advanced'
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [productImages, setProductImages] = useState([]); // Array of { file, imageUrl, imageOrder, isPrimary, altText, preview }
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    // Basic fields
    nameKey: '',
    nameAr: '',
    nameEn: '',
    descriptionKey: '',
    descriptionAr: '',
    descriptionEn: '',
    sku: '',
    price: '',
    quantity: '',
    quantityPerCarton: '',
    cbm: '',
    minStockLevel: '',
    categoryId: '',
    vendorId: '',
    country: '',
    city: '',
    status: 'PENDING_APPROVAL',
    isFeatured: false,
    acceptsNegotiation: false,
    // SEO fields
    metaTitleKey: '',
    metaTitleAr: '',
    metaTitleEn: '',
    metaDescriptionKey: '',
    metaDescriptionAr: '',
    metaDescriptionEn: '',
    metaKeywords: '',
    slug: '',
    canonicalUrl: '',
    ogTitleKey: '',
    ogTitleAr: '',
    ogTitleEn: '',
    ogDescriptionKey: '',
    ogDescriptionAr: '',
    ogDescriptionEn: '',
    ogImage: '',
    twitterCardTitleKey: '',
    twitterCardTitleAr: '',
    twitterCardTitleEn: '',
    twitterCardDescriptionKey: '',
    twitterCardDescriptionAr: '',
    twitterCardDescriptionEn: '',
    twitterCardImage: '',
    structuredData: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchVendors();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await adminApi.getCategories();
      const data = response.data.data || response.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast.error('Failed to load categories', 'Please refresh the page');
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await adminApi.getVendors();
      const data = response.data.data || response.data;
      setVendors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      showToast.error('Failed to load vendors', 'Please refresh the page');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.nameAr || !formData.nameEn) {
      showToast.error('Name is required', 'Please provide product name in both Arabic and English');
      setActiveTab('translations');
      return;
    }

    if (!formData.sku || !formData.price || !formData.quantity) {
      showToast.error('Required fields missing', 'Please fill in SKU, Price, and Quantity');
      setActiveTab('basic');
      return;
    }

    if (!formData.categoryId || !formData.vendorId) {
      showToast.error('Required fields missing', 'Please select Category and Vendor');
      setActiveTab('basic');
      return;
    }

    if (!formData.country || !formData.city) {
      showToast.error('Required fields missing', 'Please provide Country and City');
      setActiveTab('basic');
      return;
    }

    try {
      setSaving(true);
      
      // Explicitly include all fields, especially translation fields
      const data = {
        // Basic fields
        nameKey: formData.nameKey,
        nameAr: formData.nameAr || '', // Always send, even if empty
        nameEn: formData.nameEn || '', // Always send, even if empty
        descriptionKey: formData.descriptionKey,
        descriptionAr: formData.descriptionAr || '', // Always send, even if empty
        descriptionEn: formData.descriptionEn || '', // Always send, even if empty
        sku: formData.sku,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        quantityPerCarton: formData.quantityPerCarton ? parseInt(formData.quantityPerCarton) : null,
        cbm: formData.cbm ? parseFloat(formData.cbm) : null,
        minStockLevel: formData.minStockLevel ? parseInt(formData.minStockLevel) : null,
        categoryId: parseInt(formData.categoryId),
        vendorId: parseInt(formData.vendorId),
        country: formData.country,
        city: formData.city,
        status: formData.status,
        isFeatured: formData.isFeatured,
        acceptsNegotiation: formData.acceptsNegotiation,
        // SEO fields
        metaTitleKey: formData.metaTitleKey,
        metaTitleAr: formData.metaTitleAr || '',
        metaTitleEn: formData.metaTitleEn || '',
        metaDescriptionKey: formData.metaDescriptionKey,
        metaDescriptionAr: formData.metaDescriptionAr || '',
        metaDescriptionEn: formData.metaDescriptionEn || '',
        metaKeywords: formData.metaKeywords,
        slug: formData.slug,
        canonicalUrl: formData.canonicalUrl,
        // OG fields
        ogTitleKey: formData.ogTitleKey,
        ogTitleAr: formData.ogTitleAr || '',
        ogTitleEn: formData.ogTitleEn || '',
        ogDescriptionKey: formData.ogDescriptionKey,
        ogDescriptionAr: formData.ogDescriptionAr || '',
        ogDescriptionEn: formData.ogDescriptionEn || '',
        ogImage: formData.ogImage,
        // Twitter fields
        twitterCardTitleKey: formData.twitterCardTitleKey,
        twitterCardTitleAr: formData.twitterCardTitleAr || '',
        twitterCardTitleEn: formData.twitterCardTitleEn || '',
        twitterCardDescriptionKey: formData.twitterCardDescriptionKey,
        twitterCardDescriptionAr: formData.twitterCardDescriptionAr || '',
        twitterCardDescriptionEn: formData.twitterCardDescriptionEn || '',
        twitterCardImage: formData.twitterCardImage,
        structuredData: formData.structuredData
      };

      console.log('Creating product with data:', JSON.stringify(data, null, 2));
      console.log('Translation fields:', {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        descriptionAr: data.descriptionAr?.substring(0, 50),
        descriptionEn: data.descriptionEn?.substring(0, 50)
      });
      const response = await adminApi.createProduct(data);
      const createdProduct = response.data.data || response.data;
      
      // Upload images if any
      if (productImages.length > 0) {
        try {
          setUploadingImages(true);
          const files = productImages.filter(img => img.file).map(img => img.file);
          const imageData = productImages.map((img, index) => ({
            imageOrder: img.imageOrder || index + 1,
            isPrimary: img.isPrimary || false,
            altText: img.altText || ''
          }));

          if (files.length > 0) {
            // Upload files
            await adminApi.uploadProductImages(createdProduct.id, {
              files,
              imageData
            });
          } else {
            // Upload URLs
            await adminApi.uploadProductImages(createdProduct.id, {
              images: productImages.map((img, index) => ({
                imageUrl: img.imageUrl,
                imageOrder: img.imageOrder || index + 1,
                isPrimary: img.isPrimary || false,
                altText: img.altText || ''
              }))
            });
          }
        } catch (error) {
          console.error('Error uploading images:', error);
          showToast.warning('Product created but images failed to upload', 'You can add images later');
        } finally {
          setUploadingImages(false);
        }
      }
      
      showToast.success('Product created successfully', 'The product has been created and is pending approval');
      navigate('/stockship/admin/products');
    } catch (error) {
      console.error('Error creating product:', error);
      showToast.error('Failed to create product', error.response?.data?.message || 'Please try again');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setProductImages([]);
    setActiveTab('basic');
    setFormData({
      nameKey: '',
      nameAr: '',
      nameEn: '',
      descriptionKey: '',
      descriptionAr: '',
      descriptionEn: '',
      sku: '',
      price: '',
      quantity: '',
      quantityPerCarton: '',
      cbm: '',
      minStockLevel: '',
      categoryId: '',
      vendorId: '',
      country: '',
      city: '',
      status: 'PENDING_APPROVAL',
      isFeatured: false,
      acceptsNegotiation: false,
      metaTitleKey: '',
      metaTitleAr: '',
      metaTitleEn: '',
      metaDescriptionKey: '',
      metaDescriptionAr: '',
      metaDescriptionEn: '',
      metaKeywords: '',
      slug: '',
      canonicalUrl: '',
      ogTitleKey: '',
      ogTitleAr: '',
      ogTitleEn: '',
      ogDescriptionKey: '',
      ogDescriptionAr: '',
      ogDescriptionEn: '',
      ogImage: '',
      twitterCardTitleKey: '',
      twitterCardTitleAr: '',
      twitterCardTitleEn: '',
      twitterCardDescriptionKey: '',
      twitterCardDescriptionAr: '',
      twitterCardDescriptionEn: '',
      twitterCardImage: '',
      structuredData: ''
    });
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', labelAr: 'المعلومات الأساسية', icon: Package },
    { id: 'translations', label: 'Translations', labelAr: 'الترجمات', icon: Languages },
    { id: 'images', label: 'Images', labelAr: 'الصور', icon: ImageIcon },
    { id: 'seo', label: 'SEO', labelAr: 'تحسين محركات البحث', icon: Search },
    { id: 'social', label: 'Social Media', labelAr: 'وسائل التواصل', icon: Share2 },
    { id: 'advanced', label: 'Advanced', labelAr: 'متقدم', icon: Settings }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/stockship/admin/products')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-3xl font-bold">Create New Product</h1>
          <p className="text-muted-foreground mt-2">Add a new product to the platform</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Product Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tabs Navigation */}
            <div className="border-b mb-6">
              <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-primary text-white border-b-2 border-primary shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      <span className="hidden lg:inline text-xs">({tab.labelAr})</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">SKU *</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="PROD-001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Price (SAR) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nameKey || `Category ${cat.id}`}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vendor *</label>
                    <select
                      value={formData.vendorId}
                      onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.id}>{vendor.companyName || vendor.email}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Country *</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Saudi Arabia"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Riyadh"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity Per Carton</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantityPerCarton}
                      onChange={(e) => setFormData({ ...formData, quantityPerCarton: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CBM (Cubic Meters)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.cbm}
                      onChange={(e) => setFormData({ ...formData, cbm: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0.000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Min Stock Level</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="PENDING_APPROVAL">Pending Approval</option>
                      <option value="APPROVED">Approved</option>
                      <option value="AVAILABLE">Available</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-6 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isFeatured" className="text-sm font-medium">Featured Product</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="acceptsNegotiation"
                      checked={formData.acceptsNegotiation}
                      onChange={(e) => setFormData({ ...formData, acceptsNegotiation: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="acceptsNegotiation" className="text-sm font-medium">Accepts Negotiation</label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Translations Tab */}
            {activeTab === 'translations' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">Product Name (Translation) *</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name (Arabic) *</label>
                      <input
                        type="text"
                        value={formData.nameAr}
                        onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="اسم المنتج بالعربية"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Name (English) *</label>
                      <input
                        type="text"
                        value={formData.nameEn}
                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Product Name in English"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Product Description (Translation)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Description (Arabic)</label>
                      <textarea
                        value={formData.descriptionAr}
                        onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="4"
                        placeholder="وصف المنتج بالعربية"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description (English)</label>
                      <textarea
                        value={formData.descriptionEn}
                        onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="4"
                        placeholder="Product Description in English"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2">Product Images</h3>
                  <p className="text-sm text-gray-600 mb-4">Upload up to 10 images. Supported formats: JPG, PNG, WEBP (Max 10MB each)</p>
                  
                  {/* File Upload Area */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Upload Images</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors bg-gray-50">
                      <input
                        type="file"
                        id="imageUpload"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          if (productImages.length + files.length > 10) {
                            showToast.error('Maximum 10 images allowed', `You can only add ${10 - productImages.length} more image(s)`);
                            return;
                          }
                          
                          files.forEach((file) => {
                            if (file.size > 10 * 1024 * 1024) {
                              showToast.error('File too large', `${file.name} exceeds 10MB limit`);
                              return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const newImage = {
                                file: file,
                                imageUrl: e.target.result,
                                preview: e.target.result,
                                altText: file.name.replace(/\.[^/.]+$/, ''),
                                imageOrder: productImages.length + 1,
                                isPrimary: productImages.length === 0 // First image is primary by default
                              };
                              
                              if (newImage.isPrimary) {
                                setProductImages(prev => prev.map(img => ({ ...img, isPrimary: false })));
                              }
                              
                              setProductImages(prev => [...prev, newImage]);
                            };
                            reader.readAsDataURL(file);
                          });
                          
                          // Reset input
                          e.target.value = '';
                        }}
                      />
                      <label htmlFor="imageUpload" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, WEBP up to 10MB
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Alternative: URL Input */}
                  <div className="mb-6 border-t pt-6">
                    <label className="block text-sm font-medium mb-2">Or Add Image by URL</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        id="newImageUrl"
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://example.com/image.jpg"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const urlInput = document.getElementById('newImageUrl');
                            const altInput = document.getElementById('newImageAlt');
                            
                            if (!urlInput.value.trim()) {
                              showToast.error('Image URL is required', 'Please provide an image URL');
                              return;
                            }
                            
                            if (productImages.length >= 10) {
                              showToast.error('Maximum 10 images allowed', 'Please remove an image first');
                              return;
                            }
                            
                            const newImage = {
                              imageUrl: urlInput.value.trim(),
                              altText: altInput?.value.trim() || '',
                              imageOrder: productImages.length + 1,
                              isPrimary: productImages.length === 0
                            };
                            
                            if (newImage.isPrimary) {
                              setProductImages(prev => prev.map(img => ({ ...img, isPrimary: false })));
                            }
                            
                            setProductImages(prev => [...prev, newImage]);
                            urlInput.value = '';
                            if (altInput) altInput.value = '';
                          }
                        }}
                      />
                      <input
                        type="text"
                        id="newImageAlt"
                        className="w-48 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Alt text (optional)"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const urlInput = document.getElementById('newImageUrl');
                          const altInput = document.getElementById('newImageAlt');
                          
                          if (!urlInput.value.trim()) {
                            showToast.error('Image URL is required', 'Please provide an image URL');
                            return;
                          }
                          
                          if (productImages.length >= 10) {
                            showToast.error('Maximum 10 images allowed', 'Please remove an image first');
                            return;
                          }
                          
                          const newImage = {
                            imageUrl: urlInput.value.trim(),
                            altText: altInput?.value.trim() || '',
                            imageOrder: productImages.length + 1,
                            isPrimary: productImages.length === 0
                          };
                          
                          if (newImage.isPrimary) {
                            setProductImages(prev => prev.map(img => ({ ...img, isPrimary: false })));
                          }
                          
                          setProductImages(prev => [...prev, newImage]);
                          urlInput.value = '';
                          if (altInput) altInput.value = '';
                        }}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add URL
                      </button>
                    </div>
                  </div>
                  
                  {/* Images Grid */}
                  {productImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {productImages.map((img, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group border-2 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Primary Badge */}
                          {img.isPrimary && (
                            <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              Primary
                            </div>
                          )}
                          
                          {/* Image */}
                          <div className="aspect-square relative bg-gray-100">
                            <img
                              src={img.preview || img.imageUrl}
                              alt={img.altText || `Product image ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const parent = e.target.parentElement;
                                if (parent && !parent.querySelector('.image-error')) {
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'image-error w-full h-full flex items-center justify-center text-gray-400 text-xs';
                                  errorDiv.textContent = 'Failed to load';
                                  parent.appendChild(errorDiv);
                                }
                              }}
                            />
                          </div>
                          
                          {/* Overlay Actions */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = productImages.map((i, idx) => ({
                                  ...i,
                                  isPrimary: idx === index
                                }));
                                setProductImages(newImages);
                                showToast.success('Primary image updated', 'This image is now the primary image');
                              }}
                              className="p-2 bg-white rounded-full hover:bg-yellow-50 text-yellow-600"
                              title="Set as Primary"
                            >
                              <Star className={`w-5 h-5 ${img.isPrimary ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setProductImages(prev => prev.filter((_, idx) => idx !== index));
                                showToast.success('Image removed', 'The image has been removed');
                              }}
                              className="p-2 bg-white rounded-full hover:bg-red-50 text-red-600"
                              title="Remove Image"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          
                          {/* Image Info */}
                          <div className="p-3 bg-white">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500">Order: {img.imageOrder}</span>
                              {img.file && (
                                <span className="text-xs text-gray-400">
                                  {(img.file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={img.altText || ''}
                              onChange={(e) => {
                                const newImages = [...productImages];
                                newImages[index].altText = e.target.value;
                                setProductImages(newImages);
                              }}
                              placeholder="Alt text..."
                              className="w-full text-xs px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <input
                              type="number"
                              value={img.imageOrder || index + 1}
                              onChange={(e) => {
                                const newImages = [...productImages];
                                newImages[index].imageOrder = parseInt(e.target.value) || index + 1;
                                setProductImages(newImages);
                              }}
                              min="1"
                              className="w-full text-xs px-2 py-1 border rounded mt-2 focus:outline-none focus:ring-1 focus:ring-primary"
                              placeholder="Order"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                      <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 font-medium">No images added yet</p>
                      <p className="text-sm text-gray-400 mt-1">Upload images using the form above</p>
                    </div>
                  )}
                  
                  {/* Image Count */}
                  {productImages.length > 0 && (
                    <div className="text-sm text-gray-600 text-center pt-4 border-t">
                      {productImages.length} / 10 images added
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Meta Title (Arabic)</label>
                    <input
                      type="text"
                      value={formData.metaTitleAr}
                      onChange={(e) => setFormData({ ...formData, metaTitleAr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="عنوان SEO بالعربية"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Meta Title (English)</label>
                    <input
                      type="text"
                      value={formData.metaTitleEn}
                      onChange={(e) => setFormData({ ...formData, metaTitleEn: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="SEO Title in English"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Meta Description (Arabic)</label>
                    <textarea
                      value={formData.metaDescriptionAr}
                      onChange={(e) => setFormData({ ...formData, metaDescriptionAr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      rows="2"
                      placeholder="وصف SEO بالعربية"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Meta Description (English)</label>
                    <textarea
                      value={formData.metaDescriptionEn}
                      onChange={(e) => setFormData({ ...formData, metaDescriptionEn: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      rows="2"
                      placeholder="SEO Description in English"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Meta Keywords</label>
                    <input
                      type="text"
                      value={formData.metaKeywords}
                      onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="product-slug"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Canonical URL</label>
                    <input
                      type="url"
                      value={formData.canonicalUrl}
                      onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://example.com/product"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Social Media Tab */}
            {activeTab === 'social' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">Open Graph (Social Sharing)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">OG Title (Arabic)</label>
                      <input
                        type="text"
                        value={formData.ogTitleAr}
                        onChange={(e) => setFormData({ ...formData, ogTitleAr: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="عنوان المشاركة بالعربية"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">OG Title (English)</label>
                      <input
                        type="text"
                        value={formData.ogTitleEn}
                        onChange={(e) => setFormData({ ...formData, ogTitleEn: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Social Sharing Title in English"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">OG Description (Arabic)</label>
                      <textarea
                        value={formData.ogDescriptionAr}
                        onChange={(e) => setFormData({ ...formData, ogDescriptionAr: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="2"
                        placeholder="وصف المشاركة بالعربية"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">OG Description (English)</label>
                      <textarea
                        value={formData.ogDescriptionEn}
                        onChange={(e) => setFormData({ ...formData, ogDescriptionEn: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="2"
                        placeholder="Social Sharing Description in English"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">OG Image URL</label>
                      <input
                        type="url"
                        value={formData.ogImage}
                        onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Twitter Card</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Twitter Title (Arabic)</label>
                      <input
                        type="text"
                        value={formData.twitterCardTitleAr}
                        onChange={(e) => setFormData({ ...formData, twitterCardTitleAr: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="عنوان تويتر بالعربية"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Twitter Title (English)</label>
                      <input
                        type="text"
                        value={formData.twitterCardTitleEn}
                        onChange={(e) => setFormData({ ...formData, twitterCardTitleEn: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Twitter Card Title in English"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Twitter Description (Arabic)</label>
                      <textarea
                        value={formData.twitterCardDescriptionAr}
                        onChange={(e) => setFormData({ ...formData, twitterCardDescriptionAr: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="2"
                        placeholder="وصف تويتر بالعربية"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Twitter Description (English)</label>
                      <textarea
                        value={formData.twitterCardDescriptionEn}
                        onChange={(e) => setFormData({ ...formData, twitterCardDescriptionEn: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="2"
                        placeholder="Twitter Card Description in English"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Twitter Card Image URL</label>
                      <input
                        type="url"
                        value={formData.twitterCardImage}
                        onChange={(e) => setFormData({ ...formData, twitterCardImage: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://example.com/twitter-image.jpg"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">Structured Data (JSON-LD)</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Structured Data JSON</label>
                    <textarea
                      value={formData.structuredData}
                      onChange={(e) => setFormData({ ...formData, structuredData: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      rows="8"
                      placeholder='{"@context": "https://schema.org", "@type": "Product", ...}'
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional: JSON-LD structured data for search engines</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons - Always Visible */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => navigate('/stockship/admin/products')}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleReset}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50 font-medium"
              >
                Reset Form
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Creating...' : 'Create Product'}
              </motion.button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CreateProduct;

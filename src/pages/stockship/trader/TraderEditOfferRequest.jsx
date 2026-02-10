import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Upload, 
  X, 
  Save, 
  Image as ImageIcon,
  Loader2,
  Edit,
  Info,
  FileSpreadsheet,
  Package,
  Download
} from 'lucide-react';
import { offerApi, uploadApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Countries and cities data
const countries = [
  { value: 'SA', label: { en: 'Saudi Arabia', ar: 'السعودية' } },
  { value: 'AE', label: { en: 'United Arab Emirates', ar: 'الإمارات' } },
  { value: 'EG', label: { en: 'Egypt', ar: 'مصر' } },
  { value: 'KW', label: { en: 'Kuwait', ar: 'الكويت' } },
  { value: 'QA', label: { en: 'Qatar', ar: 'قطر' } },
  { value: 'BH', label: { en: 'Bahrain', ar: 'البحرين' } },
  { value: 'OM', label: { en: 'Oman', ar: 'عمان' } },
  { value: 'JO', label: { en: 'Jordan', ar: 'الأردن' } },
  { value: 'LB', label: { en: 'Lebanon', ar: 'لبنان' } },
  { value: 'MA', label: { en: 'Morocco', ar: 'المغرب' } }
];

const citiesByCountry = {
  'SA': [
    { value: 'riyadh', label: { en: 'Riyadh', ar: 'الرياض' } },
    { value: 'jeddah', label: { en: 'Jeddah', ar: 'جدة' } },
    { value: 'dammam', label: { en: 'Dammam', ar: 'الدمام' } },
    { value: 'makkah', label: { en: 'Makkah', ar: 'مكة المكرمة' } },
    { value: 'medina', label: { en: 'Medina', ar: 'المدينة المنورة' } },
    { value: 'khobar', label: { en: 'Khobar', ar: 'الخبر' } },
    { value: 'taif', label: { en: 'Taif', ar: 'الطائف' } },
    { value: 'abha', label: { en: 'Abha', ar: 'أبها' } }
  ],
  'AE': [
    { value: 'dubai', label: { en: 'Dubai', ar: 'دبي' } },
    { value: 'abu-dhabi', label: { en: 'Abu Dhabi', ar: 'أبوظبي' } },
    { value: 'sharjah', label: { en: 'Sharjah', ar: 'الشارقة' } }
  ],
  'EG': [
    { value: 'cairo', label: { en: 'Cairo', ar: 'القاهرة' } },
    { value: 'alexandria', label: { en: 'Alexandria', ar: 'الإسكندرية' } }
  ]
};

// Categories for offers
const categories = [
  { value: 'electronics', label: { en: 'Electronics', ar: 'إلكترونيات' } },
  { value: 'clothing', label: { en: 'Clothing', ar: 'ملابس' } },
  { value: 'shoes', label: { en: 'Shoes', ar: 'أحذية' } },
  { value: 'furniture', label: { en: 'Furniture', ar: 'مفروشات' } },
  { value: 'decorations', label: { en: 'Decorations', ar: 'ديكورات' } },
  { value: 'food', label: { en: 'Food', ar: 'أطعمة' } },
  { value: 'toys', label: { en: 'Toys', ar: 'ألعاب' } },
  { value: 'books', label: { en: 'Books', ar: 'كتب' } },
  { value: 'sports', label: { en: 'Sports', ar: 'رياضة' } },
  { value: 'automotive', label: { en: 'Automotive', ar: 'سيارات' } },
  { value: 'health', label: { en: 'Health & Beauty', ar: 'صحة وجمال' } },
  { value: 'home', label: { en: 'Home & Garden', ar: 'منزل وحديقة' } }
];

const TraderEditOfferRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t, language, isRTL } = useLanguage();
  const { user } = getAuth('trader');
  const imageInputRef = useRef(null);
  const excelFileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [offer, setOffer] = useState(null);
  const [items, setItems] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    country: 'SA',
    city: 'jeddah',
    category: '',
    acceptsPriceNegotiation: false,
    acceptsQuantityNegotiation: false
  });
  
  // Images gallery
  const [adImages, setAdImages] = useState([]);
  
  // Excel data
  const [excelData, setExcelData] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [excelFileUrl, setExcelFileUrl] = useState(null);
  const [excelImagesMap, setExcelImagesMap] = useState(new Map());

  // Get available cities for selected country
  const availableCities = citiesByCountry[formData.country] || [];

  // Fetch offer data
  useEffect(() => {
    if (id && user?.id) {
      fetchOffer();
    }
  }, [id, user?.id]);

  const fetchOffer = async () => {
    try {
      setLoading(true);
      const response = await offerApi.getOfferById(id);
      const responseData = response.data?.data || response.data;
      const offerData = responseData.offer || responseData;
      
      if (!offerData) {
        showToast.error(t('mediation.offers.notFound') || 'Offer not found');
        navigate('/stockship/trader/offers');
        return;
      }

      // Check if offer belongs to trader
      if (offerData.traderId !== user.id) {
        showToast.error(t('mediation.offers.unauthorized') || 'Not authorized');
        navigate('/stockship/trader/offers');
        return;
      }

      // Check if offer is ACTIVE
      if (offerData.status !== 'ACTIVE') {
        showToast.error(t('mediation.offers.canOnlyEditActive') || 'Can only request edits for active offers');
        navigate(`/stockship/trader/offers/${id}`);
        return;
      }

      setOffer(offerData);

      // Parse images
      let images = [];
      if (offerData.images) {
        try {
          images = typeof offerData.images === 'string' 
            ? JSON.parse(offerData.images) 
            : offerData.images;
          if (!Array.isArray(images)) images = [];
        } catch (e) {
          images = [];
        }
      }

      // Set form data
      // Check if offer has separate negotiation fields or use acceptsNegotiation
      const acceptsPriceNegotiation = offerData.acceptsPriceNegotiation !== undefined 
        ? offerData.acceptsPriceNegotiation 
        : (offerData.acceptsNegotiation || false);
      const acceptsQuantityNegotiation = offerData.acceptsQuantityNegotiation !== undefined 
        ? offerData.acceptsQuantityNegotiation 
        : (offerData.acceptsNegotiation || false);
      
      setFormData({
        title: offerData.title || '',
        description: offerData.description || '',
        country: offerData.country || 'SA',
        city: offerData.city || 'jeddah',
        category: offerData.category || '',
        acceptsPriceNegotiation,
        acceptsQuantityNegotiation
      });

      // Parse and set items
      let parsedItems = [];
      if (offerData.items && Array.isArray(offerData.items)) {
        parsedItems = offerData.items.map((item, idx) => {
          // Parse item images
          let itemImages = [];
          if (item.images) {
            try {
              itemImages = typeof item.images === 'string' 
                ? JSON.parse(item.images) 
                : item.images;
              if (!Array.isArray(itemImages)) itemImages = [];
            } catch (e) {
              itemImages = [];
            }
          }
          
          return {
            id: item.id,
            no: idx + 1,
            itemNo: item.itemNo || item.itemNumber || '',
            productName: item.productName || item.description || '',
            description: item.description || item.notes || '',
            quantity: parseInt(item.quantity) || 0,
            unit: item.unit || 'SET',
            unitPrice: parseFloat(item.unitPrice || item.amount || 0),
            currency: item.currency || 'USD',
            amount: (parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice || item.amount || 0)),
            image: itemImages.length > 0 ? itemImages[0] : '',
            images: itemImages
          };
        });
      }
      setItems(parsedItems);
      setAdImages(images);
    } catch (error) {
      console.error('Error fetching offer:', error);
      showToast.error(t('mediation.offers.loadFailed') || 'Failed to load offer');
      navigate('/stockship/trader/offers');
    } finally {
      setLoading(false);
    }
  };

  // Handle ad images upload
  const handleAdImagesUpload = async (files) => {
    if (!files || files.length === 0) return;

    if (adImages.length + files.length > 10) {
      showToast.error(
        t('mediation.trader.maxImages') || 'Maximum Images Exceeded',
        t('mediation.trader.maxImagesDesc') || 'You can upload a maximum of 10 images'
      );
      return;
    }

    setUploadingImages(true);
    try {
      const response = await uploadApi.uploadImages(Array.from(files));
      const uploadedUrls = response.data.data.files.map(file => {
        const url = file.url || `/uploads/images/${file.filename}`;
        if (url.startsWith('http')) {
          return url;
        } else if (url.startsWith('/')) {
          return `${API_URL}${url}`;
        } else {
          return `${API_URL}/uploads/images/${url}`;
        }
      });
      
      setAdImages(prev => [...prev, ...uploadedUrls]);
      showToast.success(
        t('common.uploadSuccess') || 'Upload Success',
        t('mediation.trader.imagesUploaded') || 'Images uploaded successfully'
      );
    } catch (error) {
      console.error('Error uploading images:', error);
      showToast.error(
        t('common.uploadFailed') || 'Upload Failed',
        error.response?.data?.message || t('mediation.trader.uploadFailedDesc') || 'Failed to upload images'
      );
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveAdImage = (index) => {
    setAdImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Excel file upload
  const handleExcelFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      showToast.error(
        t('common.invalidFile') || 'Invalid File',
        t('mediation.trader.invalidExcelFile') || 'Please upload a valid Excel file (.xlsx or .xls)'
      );
      return;
    }

    setExcelFile(file);
    setUploading(true);
    
    try {
      // First: Upload Excel to backend to extract images
      let extractedImagesMap = new Map();
      try {
        const excelResponse = await uploadApi.uploadExcel(file);
        
        // Store Excel file URL in state for later use in handleSubmit
        if (excelResponse.data?.data?.file?.url) {
          const uploadedFileUrl = excelResponse.data.data.file.url.startsWith('http') 
            ? excelResponse.data.data.file.url 
            : `${API_URL}${excelResponse.data.data.file.url}`;
          setExcelFileUrl(uploadedFileUrl);
        }
        
        if (excelResponse.data?.data?.images && Array.isArray(excelResponse.data.data.images)) {
          const extractedImages = excelResponse.data.data.images;
          
          // Build image map by row number
          extractedImages.forEach((img) => {
            const rowNum = img.rowNumber || img.row;
            const imageUrl = img.url.startsWith('http') 
              ? img.url 
              : `${API_URL}${img.url}`;
            
            if (!extractedImagesMap.has(rowNum)) {
              extractedImagesMap.set(rowNum, []);
            }
            extractedImagesMap.get(rowNum).push(imageUrl);
          });
          
          setExcelImagesMap(extractedImagesMap);
          
          if (extractedImages.length > 0) {
            showToast.success(
              t('mediation.trader.imagesExtracted') || 'Images Extracted',
              `${extractedImages.length} ${t('mediation.trader.imagesFromExcel') || 'images extracted from Excel'}`
            );
          }
        }
      } catch (uploadError) {
        console.error('Error uploading Excel file for image extraction:', uploadError);
        // Continue with parsing even if image extraction fails
      }
      
      // Second: Parse Excel data in frontend (XLSX library for data only, not images)
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
          
          // Parse data with extracted images
          parseExcelData(jsonData, extractedImagesMap);
        } catch (error) {
          console.error('Error parsing Excel:', error);
          showToast.error(
            t('mediation.trader.parseError') || 'Parse Error',
            t('mediation.trader.parseErrorDesc') || 'Failed to parse Excel file. Please check the format.'
          );
        } finally {
          setUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      showToast.error(
        t('common.uploadError') || 'Upload Error',
        t('mediation.trader.fileReadError') || 'Failed to read the file'
      );
      setUploading(false);
    }
  };

  const parseExcelData = (data, imagesMap = new Map()) => {
    let headerRowIndex = -1;
    let dataStartRow = -1;
    
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (Array.isArray(row)) {
        const rowText = row.join(' ').toUpperCase();
        if (rowText.includes('NO') && (rowText.includes('ITEM') || rowText.includes('DESCRIPTION'))) {
          headerRowIndex = i;
          dataStartRow = i + 1;
          break;
        }
      }
    }
    
    if (headerRowIndex === -1) {
      showToast.error(
        t('mediation.trader.invalidFormat') || 'Invalid Format',
        t('mediation.trader.headerNotFound') || 'Could not find header row in Excel file'
      );
      return;
    }

    const parsedItems = [];
    for (let i = dataStartRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const firstCell = String(row[0] || '').toUpperCase();
      if (firstCell.includes('TOTAL') || firstCell.includes('الإجمالي') || firstCell.includes('总计')) {
        continue;
      }

      const excelRowNumber = i + 1;
      
      const imageCellValue = row[1] || '';
      let cellImageUrls = [];
      if (imageCellValue && (imageCellValue.startsWith('http') || imageCellValue.startsWith('/uploads') || imageCellValue.startsWith('uploads'))) {
        const url = imageCellValue.startsWith('http') 
          ? imageCellValue 
          : `${API_URL}${imageCellValue.startsWith('/') ? '' : '/'}${imageCellValue}`;
        cellImageUrls = [url];
      }

      let excelImages = imagesMap ? (imagesMap.get(excelRowNumber) || []) : [];
      if (excelImages.length === 0 && imagesMap) {
         excelImages = imagesMap.get(excelRowNumber - 1) || [];
      }
      
      const allImages = excelImages.length > 0 ? excelImages : cellImageUrls;

      const item = {
        no: row[0] || '',
        image: allImages[0] || row[1] || '',
        images: allImages.length > 0 ? allImages : (row[1] ? [row[1]] : []),
        itemNo: row[2] || '',
        description: row[3] || '',
        colour: row[4] || '',
        spec: row[5] || '',
        quantity: parseFloat(row[6]) || 0,
        unit: row[7] || 'SET',
        unitPrice: parseFloat(row[8]) || 0,
        currency: row[9] || 'USD',
        amount: parseFloat(row[10]) || 0,
        packing: row[11] || '',
        packageQuantity: parseFloat(row[12]) || 0,
        unitGW: parseFloat(row[13]) || 0,
        totalGW: parseFloat(row[14]) || 0,
        cartonSize: {
          length: parseFloat(row[15]) || 0,
          width: parseFloat(row[16]) || 0,
          height: parseFloat(row[17]) || 0
        },
        totalCBM: parseFloat(row[18]) || 0,
        excelRowNumber: excelRowNumber
      };

      if (!item.amount && item.quantity && item.unitPrice) {
        item.amount = item.quantity * item.unitPrice;
      }

      if (!item.totalGW && item.quantity && item.unitGW) {
        item.totalGW = item.quantity * item.unitGW;
      }

      if (!item.totalCBM && item.cartonSize.length && item.cartonSize.width && item.cartonSize.height) {
        const cbmPerUnit = (item.cartonSize.length * item.cartonSize.width * item.cartonSize.height) / 1000000;
        item.totalCBM = cbmPerUnit * (item.packageQuantity || 1);
      }

      const isHeaderRow = (item.description && (item.description.includes('DESCRIPTION') || item.description.includes('الوصف') || item.description.includes('描述'))) ||
                          (item.itemNo && (item.itemNo.includes('ITEM') || item.itemNo.includes('رقم') || item.itemNo.includes('货号')));

      if ((item.itemNo || item.description) && !isHeaderRow) {
         if (item.quantity > 0 || item.unitPrice > 0 || item.images.length > 0) {
            parsedItems.push(item);
         }
      }
    }

    setItems(parsedItems);
    setExcelData(data);
    setExcelImagesMap(imagesMap);
    showToast.success(
      t('mediation.trader.excelParsed') || 'Excel Parsed',
      `${parsedItems.length} ${t('mediation.trader.itemsParsed') || 'items parsed successfully'}`
    );
  };

  // Download Excel template
  const handleDownloadTemplate = () => {
    const templateData = [
      ['Company name', 'Proforma Invoice No', 'DATE', '', '', '', '', '', 'اسم الشركة', 'رقم الفاتورة المبدئي', 'التاريخ'],
      ['', '', '', '', '', '', '', '', '', '', ''],
      ['NO', 'IMAGE', 'ITEM NO.', 'DESCRIPTION', 'Colour', 'SPEC.', 'QUANTITY', 'Unit', 'UNIT PRICE', 'CURRENCY', 'AMOUNT', 'PACKING', 'PACKAGE QUANTITY (CTN)', 'UNIT G.W. (KGS)', 'TOTAL G.W. (KGS)', 'CARTON SIZE (CM)', '', '', 'TOTAL CBM'],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Length', 'Width', 'Height', '', ''],
      [1, '', 'ITEM001', 'Sample Item', '', '', 100, 'SET', 10, 'USD', 1000, '', 1, 1, 1, 31, 31, 10, '', 0.010483636]
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    XLSX.writeFile(wb, 'offer_template.xlsx');
    showToast.success(
      t('mediation.trader.templateDownloaded') || 'Template Downloaded',
      t('mediation.trader.templateDownloadedSuccess') || 'Excel template downloaded successfully'
    );
  };

  const handleSubmit = async () => {
    if (!offer) return;

    try {
      setSubmitting(true);
      
      // Prepare update data - only include changed fields
      const updateData = {};
      
      if (formData.title !== offer.title) updateData.title = formData.title;
      if (formData.description !== offer.description) updateData.description = formData.description;
      if (formData.country !== offer.country) updateData.country = formData.country;
      if (formData.city !== offer.city) updateData.city = formData.city;
      if (formData.category !== offer.category) updateData.category = formData.category;
      if (formData.acceptsNegotiation !== offer.acceptsNegotiation) {
        updateData.acceptsNegotiation = formData.acceptsNegotiation;
      }

      // Check if images changed
      const currentImages = offer.images 
        ? (typeof offer.images === 'string' ? JSON.parse(offer.images) : offer.images)
        : [];
      if (JSON.stringify(adImages) !== JSON.stringify(currentImages)) {
        updateData.images = adImages;
      }

      // Check if Excel file changed
      if (excelFileUrl && excelFileUrl !== offer.excelFileUrl) {
        updateData.excelFileUrl = excelFileUrl;
        if (excelFile) {
          updateData.excelFileName = excelFile.name;
          updateData.excelFileSize = excelFile.size;
        }
      }

      // Check if items changed (from Excel)
      if (items.length > 0) {
        const currentItems = offer.items && Array.isArray(offer.items) ? offer.items : [];
        // Compare items by converting to JSON strings
        const currentItemsStr = JSON.stringify(currentItems.map(item => ({
          itemNo: item.itemNo,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })));
        const newItemsStr = JSON.stringify(items.map(item => ({
          itemNo: item.itemNo,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })));
        
        if (currentItemsStr !== newItemsStr) {
          updateData.items = items;
        }
      }

      // Check if negotiation fields changed
      if (formData.acceptsPriceNegotiation !== undefined && 
          formData.acceptsPriceNegotiation !== offer.acceptsPriceNegotiation) {
        updateData.acceptsPriceNegotiation = formData.acceptsPriceNegotiation;
      }
      if (formData.acceptsQuantityNegotiation !== undefined && 
          formData.acceptsQuantityNegotiation !== offer.acceptsQuantityNegotiation) {
        updateData.acceptsQuantityNegotiation = formData.acceptsQuantityNegotiation;
      }

      if (Object.keys(updateData).length === 0) {
        showToast.error(t('mediation.offers.noChanges') || 'No changes detected');
        return;
      }

      await offerApi.createOfferUpdateRequest(offer.id, updateData);
      showToast.success(
        t('mediation.offers.editRequestCreated') || 'Edit Request Created',
        t('mediation.offers.editRequestCreatedDesc') || 'Your edit request has been submitted successfully. Please wait for employee review.'
      );
      navigate(`/stockship/trader/offers/${id}`);
    } catch (error) {
      console.error('Error creating edit request:', error);
      showToast.error(
        error.response?.data?.message || 
        t('mediation.offers.editRequestFailed') || 
        'Failed to submit edit request'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('mediation.offers.requestEdit') || 'Request Edit'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('mediation.offers.requestEditDesc') || 'Request changes to your offer. Changes will be reviewed by an employee.'}
          </p>
        </div>
        <button
          onClick={() => navigate(`/stockship/trader/offers/${id}`)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t('common.cancel') || 'Cancel'}
        </button>
      </div>

      {/* Section 1: Publish Ad - Stockship Fees */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Info className="w-5 h-5 text-blue-500" />
            {t('mediation.trader.stockshipFees') || 'Stockship Fees'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Country and City Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('mediation.trader.chooseCountry') || 'Choose Country'} *
              </label>
              <select
                value={formData.country}
                onChange={(e) => {
                  setFormData({ ...formData, country: e.target.value, city: '' });
                }}
                className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <option value="">{t('mediation.trader.selectCountry') || 'Select Country'}</option>
                {countries.map(country => (
                  <option key={country.value} value={country.value}>
                    {isRTL ? country.label.ar : country.label.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('mediation.trader.chooseCity') || 'Choose City'} *
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={!formData.country || availableCities.length === 0}
                className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <option value="">{t('mediation.trader.selectCity') || 'Select City'}</option>
                {availableCities.map(city => (
                  <option key={city.value} value={city.value}>
                    {isRTL ? city.label.ar : city.label.en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Upload Images */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <ImageIcon className="w-5 h-5 text-blue-500" />
            {t('mediation.trader.uploadImages') || 'Upload Images'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors bg-gray-50">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleAdImagesUpload(e.target.files);
                }
                e.target.value = '';
              }}
              disabled={uploadingImages || adImages.length >= 10}
            />
            
            <div className={`flex flex-col items-center gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              <Upload className={`w-16 h-16 text-blue-500 ${uploadingImages ? 'animate-pulse' : ''}`} />
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {t('mediation.trader.dragDropImages') || 'Drag and drop images here'} {t('common.or') || 'or'}
                </p>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImages || adImages.length >= 10}
                  className={`inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  {uploadingImages ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('common.uploading') || 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" />
                      {t('mediation.trader.chooseImages') || 'Choose Images'}
                    </>
                  )}
                </button>
              </div>
              
              <div className="text-sm text-gray-500 space-y-1">
                <p>{t('mediation.trader.maxFileSize') || 'Max 100 MB per file'}</p>
                <p>{t('mediation.trader.supportedFormats') || 'Supported formats: image/jpeg, image/png, image/webp'}</p>
                <p className="font-medium text-gray-700 mt-2">
                  {t('mediation.trader.uploadAdImages') || 'Upload ad images'} ({t('mediation.trader.maxImagesCount') || 'max 10 images'})
                </p>
              </div>
            </div>
          </div>

          {/* Uploaded Images Gallery */}
          {adImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {adImages.map((imgUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imgUrl.startsWith('http') ? imgUrl : `${API_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`}
                    alt={`Ad image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                  <button
                    onClick={() => handleRemoveAdImage(index)}
                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Excel Template and Upload Buttons */}
          <div className={`flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <button
              onClick={handleDownloadTemplate}
              className={`flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Download className="w-5 h-5" />
              {t('mediation.trader.downloadExcelTemplate') || 'Download Ready Excel Template for Filling'}
            </button>
            <label className={`flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input
                ref={excelFileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelFileUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('common.uploading') || 'Uploading...'}
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-5 h-5" />
                  {t('mediation.trader.uploadExcelFromDevice') || 'Upload Excel File from Device'}
                </>
              )}
            </label>
          </div>

          {/* Excel File Info */}
          {excelFile && (
            <div className={`p-4 bg-blue-50 border border-blue-200 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{excelFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {items.length} {t('mediation.trader.itemsParsed') || 'items parsed'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setExcelFile(null);
                    setItems([]);
                    setExcelData(null);
                    setExcelFileUrl(null);
                    setExcelImagesMap(new Map());
                  }}
                  className="p-1 hover:bg-blue-100 rounded"
                >
                  <X className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Ad Details */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <FileSpreadsheet className="w-5 h-5 text-blue-500" />
            {t('mediation.trader.adDetails') || 'Ad Details'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('mediation.offers.offerTitle') || 'Title'} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t('mediation.trader.enterTitle') || 'Enter offer title...'}
            />
          </div>

          {/* Goods Description */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('mediation.trader.goodsDescription') || 'Goods Description'} *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t('mediation.trader.enterGoodsDescription') || 'Enter goods description...'}
            />
          </div>

          {/* Negotiation Toggles - Separate for Price and Quantity */}
          <div className="space-y-4">
            {/* Price Negotiation */}
            <div className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
              <label htmlFor="acceptsPriceNegotiation" className={`text-sm font-medium text-gray-700 cursor-pointer ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('mediation.trader.acceptPriceNegotiation') || 'Do you accept negotiation on price?'}
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="acceptsPriceNegotiation"
                  checked={formData.acceptsPriceNegotiation}
                  onChange={(e) => setFormData({ ...formData, acceptsPriceNegotiation: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {/* Quantity Negotiation */}
            <div className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
              <label htmlFor="acceptsQuantityNegotiation" className={`text-sm font-medium text-gray-700 cursor-pointer ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('mediation.trader.acceptQuantityNegotiation') || 'Do you accept negotiation on quantity?'}
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="acceptsQuantityNegotiation"
                  checked={formData.acceptsQuantityNegotiation}
                  onChange={(e) => setFormData({ ...formData, acceptsQuantityNegotiation: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('mediation.trader.selectCategory') || 'Choose appropriate section'} *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <option value="">{t('mediation.trader.categoryPlaceholder') || 'Section Name'}</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {isRTL ? category.label.ar : category.label.en}
                </option>
              ))}
            </select>
          </div>

          {/* Items Table (Read-only display) */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('mediation.trader.offerItems') || 'Offer Items'} ({items.length})
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className={`px-3 py-2 font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>NO</th>
                      <th className={`px-3 py-2 font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.trader.itemNo') || 'Item No'}</th>
                      <th className={`px-3 py-2 font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.trader.description') || 'Description'}</th>
                      <th className={`px-3 py-2 font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.trader.quantity') || 'Qty'}</th>
                      <th className={`px-3 py-2 font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.trader.unitPrice') || 'Unit Price'}</th>
                      <th className={`px-3 py-2 font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.trader.amount') || 'Amount'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>{item.no || index + 1}</td>
                        <td className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>{item.itemNo || '-'}</td>
                        <td className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>{item.productName || item.description || '-'}</td>
                        <td className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>{item.quantity} {item.unit}</td>
                        <td className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>{item.unitPrice?.toFixed(2) || '0.00'} {item.currency}</td>
                        <td className={`px-3 py-2 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{item.amount?.toFixed(2) || '0.00'} {item.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className={`flex justify-end pt-4 border-t border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={submitting || !formData.description.trim() || !formData.category}
              className={`flex items-center gap-2 px-8 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('common.submitting') || 'Submitting...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t('common.submitRequest') || 'Submit Request'}
                </>
              )}
            </motion.button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TraderEditOfferRequest;

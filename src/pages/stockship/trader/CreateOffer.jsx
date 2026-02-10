import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  Plus, 
  Save, 
  Trash2,
  Download,
  Image as ImageIcon,
  Check,
  Loader2,
  Info,
  Edit
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

const CreateOffer = () => {
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t, language, isRTL } = useLanguage();
  const { user } = getAuth('trader');
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const excelFileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [excelImagesMap, setExcelImagesMap] = useState(new Map()); // Map: Excel row number -> image URLs
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    country: 'SA', // Default to Saudi Arabia
    city: 'jeddah', // Default to Jeddah
    category: '',
    acceptsNegotiation: false,
    termsAccepted: false
  });
  
  // Images gallery (for the ad itself, not per item)
  const [adImages, setAdImages] = useState([]);
  
  // Excel data
  const [excelData, setExcelData] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [excelFileUrl, setExcelFileUrl] = useState(null); // Store uploaded Excel file URL
  const [items, setItems] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  
  // Units and currencies options
  const units = ['SET', 'PCS', 'BOX', 'CARTON', 'KG', 'M', 'M²', 'M³', 'L', 'طقم', 'قطعة', 'صندوق', 'كرتون', 'كجم', 'متر', 'م²', 'م³', 'لتر', '放', '件', '盒', '箱', '公斤', '米', '平方米', '立方米', '升'];
  const currencies = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'CNY', '¥', 'SR', 'ريال', 'دولار', '元'];

  // Get available cities for selected country
  const availableCities = citiesByCountry[formData.country] || [];

  // Handle ad images upload (main gallery for the ad)
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
        // API returns url like /uploads/images/filename or full URL
        const url = file.url || `/uploads/images/${file.filename}`;
        // If URL starts with /, prepend API_URL, otherwise use as is
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
        t('mediation.trader.imagesUploaded') || 'Images Uploaded',
        `${uploadedUrls.length} ${t('mediation.trader.imagesUploadedSuccess') || 'image(s) uploaded successfully'}`
      );
    } catch (error) {
      console.error('Error uploading images:', error);
      showToast.error(
        t('mediation.trader.uploadFailed') || 'Upload Failed',
        error.response?.data?.message || t('common.errorOccurred') || 'Failed to upload images'
      );
    } finally {
      setUploadingImages(false);
    }
  };

  // Remove ad image
  const handleRemoveAdImage = (index) => {
    setAdImages(prev => prev.filter((_, i) => i !== index));
  };

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

      // Get images from Excel extraction
      // Excel rows are 1-based, frontend array is 0-based
      // If headerRowIndex = 0 (header at array index 0), then:
      //   Excel row 1 = array index 0 (header)
      //   Excel row 2 = array index 1 (first data row, dataStartRow)
      // If headerRowIndex = 2 (header at array index 2), then:
      //   Excel row 1 = array index 0
      //   Excel row 2 = array index 1
      //   Excel row 3 = array index 2 (header)
      //   Excel row 4 = array index 3 (first data row, dataStartRow = 3)
      // General formula: Excel row number = array index + 1 (since Excel is 1-based)
      // But we need to account for header position: Excel row = array index + 1 (always true)
      // Since dataStartRow = headerRowIndex + 1, and we loop from dataStartRow:
      //   array index i = dataStartRow, dataStartRow + 1, ...
      //   Excel row = i + 1
      const excelRowNumber = i + 1; // Excel row number (1-based) - array index i = Excel row (i + 1)
      
      // Also check cell value for image URL (column B, index 1)
      const imageCellValue = row[1] || '';
      let cellImageUrls = [];
      if (imageCellValue && (imageCellValue.startsWith('http') || imageCellValue.startsWith('/uploads') || imageCellValue.startsWith('uploads'))) {
        const url = imageCellValue.startsWith('http') 
          ? imageCellValue 
          : `${API_URL}${imageCellValue.startsWith('/') ? '' : '/'}${imageCellValue}`;
        cellImageUrls = [url];
      }

      // Combine Excel extracted images with cell URL images (prioritize extracted images)
      // Check current row and previous row (for images anchored slightly above)
      let excelImages = imagesMap ? (imagesMap.get(excelRowNumber) || []) : [];
      if (excelImages.length === 0 && imagesMap) {
         excelImages = imagesMap.get(excelRowNumber - 1) || [];
      }
      
      const allImages = excelImages.length > 0 ? excelImages : cellImageUrls;

      const item = {
        no: row[0] || '',
        image: allImages[0] || row[1] || '', // Use extracted image or cell value
        images: allImages.length > 0 ? allImages : (row[1] ? [row[1]] : []), // Use extracted images or cell value
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
        excelRowNumber: excelRowNumber // Persist Excel row number for image mapping in submit
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

      // Filter out invalid items (must have quantity or price, and not be a header row)
      // Checks for common header terms in description or itemNo if quantity/price are 0
      const isHeaderRow = (item.description && (item.description.includes('DESCRIPTION') || item.description.includes('الوصف') || item.description.includes('描述'))) ||
                          (item.itemNo && (item.itemNo.includes('ITEM') || item.itemNo.includes('رقم') || item.itemNo.includes('货号')));

      if ((item.itemNo || item.description) && !isHeaderRow) {
         // Also require either valid quantity or price to filter empty/garbage rows
         if (item.quantity > 0 || item.unitPrice > 0 || item.images.length > 0) {
            parsedItems.push(item);
         }
      }
    }

    setItems(parsedItems);
    setExcelData(data);
    setExcelImagesMap(imagesMap); // Store images map for later use
    showToast.success(
      t('mediation.trader.excelParsed') || 'Excel Parsed',
      `${parsedItems.length} ${t('mediation.trader.itemsParsed') || 'items parsed successfully'}`
    );
  };

  // Download Excel template
  const handleDownloadTemplate = () => {
    // Create a simple Excel template structure
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
    // Validation
    if (!formData.termsAccepted) {
      showToast.error(
        t('common.validationError') || 'Validation Error',
        t('mediation.trader.acceptTerms') || 'Please accept the terms and conditions'
      );
      return;
    }

    if (!formData.description.trim()) {
      showToast.error(
        t('common.validationError') || 'Validation Error',
        t('mediation.trader.enterDescription') || 'Please enter goods description'
      );
      return;
    }

    if (!formData.category) {
      showToast.error(
        t('common.validationError') || 'Validation Error',
        t('mediation.trader.selectCategory') || 'Please select a category'
      );
      return;
    }

    // Allow creating offer with description only if no items and no Excel
    // Items can be added later or Excel can be uploaded later
    // if (items.length === 0 && !excelFile) {
    //   showToast.error(
    //     t('common.validationError') || 'Validation Error',
    //     t('mediation.trader.addItemsOrExcel') || 'Please add items or upload an Excel file'
    //   );
    //   return;
    // }

    setLoading(true);
    try {
      let excelFileName = null;
      let excelFileSize = null;
      // Use Excel file URL from state (already uploaded in handleExcelFileUpload)
      const finalExcelFileUrl = excelFileUrl || null;

      // Use Excel file info (already uploaded in handleExcelFileUpload)
      // Use existing excelImagesMap and excelFileUrl from state (already populated during file upload)
      if (excelFile) {
        excelFileName = excelFile.name;
        excelFileSize = excelFile.size;
      }

      // Prepare offer data
      // Ensure title is not empty - use description or default value
      const offerTitle = formData.description && formData.description.trim() 
        ? formData.description.trim().substring(0, 100) 
        : 'New Advertisement';
      
      const offerData = {
        title: offerTitle,
        description: formData.description || offerTitle,
        items: (items && items.length > 0) ? items.map((item, index) => {
          // Ensure productName is not empty (required field in schema)
          const productName = (item.description && item.description.trim()) || (item.productName && item.productName.trim()) || `Item ${index + 1}`;
          
          // Get images from Excel extraction
          // Items array index is 0-based (first item is index 0)
          // Excel rows are 1-based (header is row 1, first data row is row 2)
          // If header is at Excel row 1, first data item (index 0) is at Excel row 2
          // So: Excel row number = frontend index + 2 (header=1, first data=2, so index 0 = row 2)
          // Use the stored excelImagesMap from state which was built during parseExcelData
          // Note: excelImagesMap uses Excel row numbers as keys
          // Use the persisted excelRowNumber if available, otherwise fallback to calculation (assumes header at row 1)
          // Use the persisted excelRowNumber if available, otherwise fallback to calculation (assumes header at row 1)
          const excelRowNumber = item.excelRowNumber || (index + 2);
          
          // Fuzzy matching: Check current row, then previous row, then next row
          let excelImages = [];
          if (excelImagesMap && excelImagesMap.size > 0) {
            if (excelImagesMap.has(excelRowNumber)) {
              excelImages = excelImagesMap.get(excelRowNumber) || [];
            } else if (excelImagesMap.has(excelRowNumber - 1)) {
              excelImages = excelImagesMap.get(excelRowNumber - 1) || [];
            } else if (excelImagesMap.has(excelRowNumber + 1)) {
              excelImages = excelImagesMap.get(excelRowNumber + 1) || [];
            }
          }
          
          // Combine Excel extracted images with item images (prioritize Excel extracted images)
          // Item images may come from cell values or manual upload, but Excel extracted images take priority
          let finalImages = [];
          if (excelImages.length > 0) {
            // Use Excel extracted images (highest priority)
            finalImages = excelImages;
          } else if (item.images && Array.isArray(item.images) && item.images.length > 0) {
            // Use item images (from cell values or manual upload)
            finalImages = item.images;
          } else if (item.image) {
            // Use single item image
            finalImages = [item.image];
          }
          
          return {
            no: item.no || (index + 1),
            itemNo: item.itemNo || null,
            description: item.description || productName, // Use productName as fallback
            productName: productName, // Required field
            colour: item.colour || null,
            spec: item.spec || null,
            quantity: item.quantity || 0,
            unit: item.unit || 'SET',
            unitPrice: item.unitPrice ? parseFloat(item.unitPrice) : 0,
            currency: item.currency || 'USD',
            amount: item.amount ? parseFloat(item.amount) : 0,
            packing: item.packing || null,
            packageQuantity: item.packageQuantity || 0,
            unitGW: item.unitGW ? parseFloat(item.unitGW) : 0,
            totalGW: item.totalGW ? parseFloat(item.totalGW) : 0,
            cartonSize: {
              length: item.cartonSize?.length || 0,
              width: item.cartonSize?.width || 0,
              height: item.cartonSize?.height || 0
            },
            cartonLength: item.cartonSize?.length || 0,
            cartonWidth: item.cartonSize?.width || 0,
            cartonHeight: item.cartonSize?.height || 0,
            totalCBM: (item.totalCBM && !isNaN(parseFloat(item.totalCBM))) ? parseFloat(item.totalCBM).toFixed(4) : '0.0000', // Convert to string with 4 decimal places for Prisma Decimal
            image: finalImages[0] || item.image || null, // First image or fallback
            images: finalImages.length > 0 ? finalImages : (item.image ? [item.image] : []) // All images from Excel or fallback
          };
        }) : [], // Empty array if no items
        metadata: {
          country: formData.country,
          city: formData.city,
          category: formData.category,
          acceptsNegotiation: formData.acceptsNegotiation,
          adImages: adImages,
          companyName: '',
          proformaInvoiceNo: '',
          date: new Date().toISOString().split('T')[0]
        },
        excelFileUrl: finalExcelFileUrl || null, // Use from state (already uploaded in handleExcelFileUpload)
        excelFileName: excelFileName,
        excelFileSize: excelFileSize,
        images: adImages // Send ad images at top level to match schema
      };

      const response = await offerApi.createOffer(offerData);
      showToast.success(
        t('mediation.trader.adCreated') || t('mediation.trader.offerCreated') || 'Ad Created',
        t('mediation.trader.createSuccess') || 'Your advertisement has been created successfully'
      );
      navigate('/stockship/trader/offers');
    } catch (error) {
      console.error('Error creating offer:', error);
      showToast.error(
        t('mediation.trader.createFailed') || 'Creation Failed',
        error.response?.data?.message || t('mediation.trader.createFailedDesc') || 'Failed to create advertisement. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle item image upload
  const handleItemImageUpload = async (itemIndex, files) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const response = await uploadApi.uploadImages(Array.from(files));
      const uploadedUrls = response.data.data.files.map(file => {
        // API returns url like /uploads/images/filename or full URL
        const url = file.url || `/uploads/images/${file.filename}`;
        // If URL starts with /, prepend API_URL, otherwise use as is
        if (url.startsWith('http')) {
          return url;
        } else if (url.startsWith('/')) {
          return `${API_URL}${url}`;
        } else {
          return `${API_URL}/uploads/images/${url}`;
        }
      });
      
      const updatedItems = [...items];
      const existingImages = updatedItems[itemIndex].images || [];
      updatedItems[itemIndex].images = [...existingImages, ...uploadedUrls];
      
      if (uploadedUrls.length > 0) {
        updatedItems[itemIndex].image = uploadedUrls[0];
      }
      
      setItems(updatedItems);
      showToast.success(
        t('mediation.trader.imagesUploaded') || 'Images Uploaded',
        `${uploadedUrls.length} ${t('mediation.trader.imagesUploadedSuccess') || 'image(s) uploaded successfully'}`
      );
    } catch (error) {
      console.error('Error uploading images:', error);
      showToast.error(
        t('mediation.trader.uploadFailed') || 'Upload Failed',
        error.response?.data?.message || t('common.errorOccurred') || 'Failed to upload images'
      );
    } finally {
      setUploadingImages(false);
    }
  };

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
            {t('mediation.trader.publishAd') || t('mediation.trader.createAd') || t('mediation.trader.createOffer') || 'Publish Ad'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('mediation.trader.publishAdDesc') || t('mediation.trader.createAdDesc') || 'Create and publish a new advertisement'}
          </p>
        </div>
        <button
          onClick={() => navigate('/stockship/trader/offers')}
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
          {/* Terms and Conditions Checkbox */}
          <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <input
              type="checkbox"
              id="termsAccepted"
              checked={formData.termsAccepted}
              onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="termsAccepted" className={`text-sm text-gray-700 cursor-pointer ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('mediation.trader.agreeTerms') || 'I agree to the Terms and Conditions'}
            </label>
          </div>

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
          {/* Large Image Upload Area */}
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

          {/* Negotiation Toggle */}
          <div className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
            <label htmlFor="acceptsNegotiation" className={`text-sm font-medium text-gray-700 cursor-pointer ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('mediation.trader.acceptNegotiation') || 'Do you accept negotiation on price and quantity?'}
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="acceptsNegotiation"
                checked={formData.acceptsNegotiation}
                onChange={(e) => setFormData({ ...formData, acceptsNegotiation: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
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

          {/* Parsed Items Table (if Excel was uploaded) */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('mediation.trader.parsedItems') || 'Parsed Items'} ({items.length})
                </h3>
                <button
                  onClick={() => {
                    setItems([...items, {
                      no: items.length + 1,
                      image: '',
                      images: [],
                      itemNo: '',
                      description: '',
                      colour: '',
                      spec: '',
                      quantity: 0,
                      unit: 'SET',
                      unitPrice: 0,
                      currency: 'USD',
                      amount: 0,
                      packing: '',
                      packageQuantity: 0,
                      unitGW: 0,
                      totalGW: 0,
                      cartonSize: { length: 0, width: 0, height: 0 },
                      totalCBM: 0
                    }]);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <Plus className="w-4 h-4" />
                  {t('mediation.trader.addItem') || 'Add Item'}
                </button>
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
                      <th className={`px-3 py-2 font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.actions') || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>{item.no || index + 1}</td>
                        <td className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>{item.itemNo}</td>
                        <td className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>{item.description}</td>
                        <td className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>{item.quantity}</td>
                        <td className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>{item.unitPrice} {item.currency}</td>
                        <td className={`px-3 py-2 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{item.amount?.toFixed(2) || '0.00'}</td>
                        <td className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                            <button
                              onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title={t('common.edit') || 'Edit'}
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => setItems(items.filter((_, i) => i !== index))}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                              title={t('common.delete') || 'Delete'}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Publish Button */}
          <div className={`flex justify-end pt-4 border-t border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading || !formData.termsAccepted || !formData.description.trim() || !formData.category}
              className={`flex items-center gap-2 px-8 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('common.publishing') || t('common.creating') || 'Publishing...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t('mediation.trader.publish') || 'Publish'}
                </>
              )}
            </motion.button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Item Modal */}
      <AnimatePresence>
        {editingIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <div className={`sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-xl font-bold">{t('mediation.trader.editItem') || 'Edit Item'}</h2>
                <button
                  onClick={() => setEditingIndex(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {editingIndex !== null && items[editingIndex] && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.trader.itemNo') || 'Item No'}</label>
                      <input
                        type="text"
                        value={items[editingIndex]?.itemNo || ''}
                        onChange={(e) => {
                          const updatedItems = [...items];
                          updatedItems[editingIndex].itemNo = e.target.value;
                          setItems(updatedItems);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.trader.description') || 'Description'}</label>
                      <input
                        type="text"
                        value={items[editingIndex]?.description || ''}
                        onChange={(e) => {
                          const updatedItems = [...items];
                          updatedItems[editingIndex].description = e.target.value;
                          setItems(updatedItems);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.trader.quantity') || 'Quantity'}</label>
                      <input
                        type="number"
                        value={items[editingIndex]?.quantity || 0}
                        onChange={(e) => {
                          const updatedItems = [...items];
                          const quantity = parseFloat(e.target.value) || 0;
                          updatedItems[editingIndex].quantity = quantity;
                          if (updatedItems[editingIndex].unitPrice) {
                            updatedItems[editingIndex].amount = quantity * updatedItems[editingIndex].unitPrice;
                          }
                          setItems(updatedItems);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.trader.unit') || 'Unit'}</label>
                      <select
                        value={items[editingIndex]?.unit || 'SET'}
                        onChange={(e) => {
                          const updatedItems = [...items];
                          updatedItems[editingIndex].unit = e.target.value;
                          setItems(updatedItems);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}
                      >
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.trader.unitPrice') || 'Unit Price'}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={items[editingIndex]?.unitPrice || 0}
                        onChange={(e) => {
                          const updatedItems = [...items];
                          const unitPrice = parseFloat(e.target.value) || 0;
                          updatedItems[editingIndex].unitPrice = unitPrice;
                          if (updatedItems[editingIndex].quantity) {
                            updatedItems[editingIndex].amount = updatedItems[editingIndex].quantity * unitPrice;
                          }
                          setItems(updatedItems);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.trader.currency') || 'Currency'}</label>
                      <select
                        value={items[editingIndex]?.currency || 'USD'}
                        onChange={(e) => {
                          const updatedItems = [...items];
                          updatedItems[editingIndex].currency = e.target.value;
                          setItems(updatedItems);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}
                      >
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Image Gallery for Item */}
                    <div className="col-span-2">
                      <label className={`block text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('mediation.trader.itemImages') || 'Item Images'} ({items[editingIndex]?.images?.length || 0})
                      </label>
                      <div className="space-y-3">
                        {items[editingIndex]?.images && items[editingIndex].images.length > 0 && (
                          <div className="grid grid-cols-4 gap-2">
                            {items[editingIndex].images.map((imgUrl, imgIndex) => (
                              <div key={imgIndex} className="relative group">
                                <img
                                  src={imgUrl && imgUrl.startsWith('http') ? imgUrl : (imgUrl ? `${API_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=')}
                                  alt={`Item ${imgIndex + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    // Use a simple placeholder if image fails to load
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=';
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const updatedItems = [...items];
                                    updatedItems[editingIndex].images = updatedItems[editingIndex].images.filter((_, idx) => idx !== imgIndex);
                                    if (updatedItems[editingIndex].images.length > 0) {
                                      updatedItems[editingIndex].image = updatedItems[editingIndex].images[0];
                                    } else {
                                      updatedItems[editingIndex].image = '';
                                    }
                                    setItems(updatedItems);
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                handleItemImageUpload(editingIndex, e.target.files);
                              }
                              e.target.value = '';
                            }}
                          />
                          {uploadingImages ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                              <span className="text-sm text-gray-600">{t('common.uploading') || 'Uploading...'}</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-5 h-5 text-blue-500" />
                              <span className="text-sm text-gray-600">{t('mediation.trader.uploadImages') || 'Upload Images'}</span>
                            </>
                          )}
                        </label>
                        <p className={`text-xs text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {t('mediation.trader.imageUploadHint') || 'You can upload multiple images (JPEG, PNG, WebP). Maximum 10 images per item.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className={`sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => setEditingIndex(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {t('common.close') || 'Close'}
                </button>
                <button
                  onClick={() => setEditingIndex(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('common.save') || 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CreateOffer;

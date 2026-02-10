import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export const showConfirm = (message, onConfirm, onCancel = () => {}) => {
  const { language } = useLanguage();
  
  toast.custom((t) => (
    <div className="bg-card border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]">
      <p className="mb-4 text-sm">{message}</p>
      <div className={`flex gap-2 justify-end ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            toast.dismiss(t);
            onCancel();
          }}
        >
          {language === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            toast.dismiss(t);
            onConfirm();
          }}
        >
          {language === 'ar' ? 'تأكيد' : 'Confirm'}
        </Button>
      </div>
    </div>
  ), {
    duration: Infinity, // Keep it open until user clicks
  });
};

export default showConfirm;


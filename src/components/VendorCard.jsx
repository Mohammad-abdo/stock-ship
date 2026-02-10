import { motion } from "framer-motion";
import { LucideIcon, MapPin, Phone, Mail, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export default function VendorCard({
  id,
  name,
  nameAr,
  nameEn,
  type, // 'shop', 'pharmacy', 'company'
  icon: Icon,
  status,
  location,
  phone,
  email,
  image,
  stats = {},
  delay = 0,
  onClick,
}) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const displayName = isRTL ? (nameAr || name) : (nameEn || name);

  const typeColors = {
    shop: {
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
      text: "text-pink-500",
      label: isRTL ? "متجر" : "Shop",
    },
    pharmacy: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      text: "text-purple-500",
      label: isRTL ? "صيدلية" : "Pharmacy",
    },
    company: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      text: "text-blue-500",
      label: isRTL ? "شركة" : "Company",
    },
  };

  const colors = typeColors[type] || typeColors.shop;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Navigate based on type
      switch (type) {
        case "shop":
        case "pharmacy":
        case "company":
          navigate(`/admin/shops/${id}`);
          break;
        default:
          break;
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative overflow-hidden rounded-xl border-2 ${colors.border} ${colors.bg} p-6 cursor-pointer transition-all duration-300 group`}
      onClick={handleClick}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                <Icon className={`w-5 h-5 ${colors.text}`} />
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}
              >
                {colors.label}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-1">{displayName}</h3>
            {status && (
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  status === "active"
                    ? "bg-green-500/10 text-green-600"
                    : "bg-gray-500/10 text-gray-600"
                }`}
              >
                {status === "active"
                  ? isRTL
                    ? "نشط"
                    : "Active"
                  : isRTL
                  ? "غير نشط"
                  : "Inactive"}
              </span>
            )}
          </div>
          {image && (
            <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white/20">
              <img
                src={image}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4">
          {location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{location}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{phone}</span>
            </div>
          )}
          {email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="truncate">{email}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        {Object.keys(stats).length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/10">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {isRTL ? key : key}
                </p>
                <p className="text-lg font-bold">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* View Details Link */}
        <div className="mt-4 flex items-center justify-end">
          <motion.div
            whileHover={{ x: isRTL ? -5 : 5 }}
            className="flex items-center gap-1 text-sm font-medium text-primary"
          >
            <span>{isRTL ? "عرض التفاصيل" : "View Details"}</span>
            <ExternalLink className="w-4 h-4" />
          </motion.div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-colors" />
    </motion.div>
  );
}


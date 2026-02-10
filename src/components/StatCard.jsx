import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  trend,
  trendUp,
  subtitle,
  description, // Alias for subtitle
  delay = 0,
  onClick,
}) {
  // Use description if subtitle is not provided
  const displaySubtitle = subtitle || description;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative overflow-hidden rounded-xl border ${borderColor} ${bgColor} p-6 cursor-pointer transition-all duration-300 group`}
      onClick={onClick}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${bgColor} ${color} bg-opacity-20`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          {trend && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2 }}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                trendUp
                  ? "bg-green-500/10 text-green-600"
                  : "bg-red-500/10 text-red-600"
              }`}
            >
              {trendUp ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend}
            </motion.div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.1 }}
            className="text-3xl font-bold"
          >
            {typeof value === "number" ? value.toLocaleString() : value}
          </motion.h3>
          {displaySubtitle && (
            <p className="text-xs text-muted-foreground mt-2">{displaySubtitle}</p>
          )}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-colors" />
    </motion.div>
  );
}


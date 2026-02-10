import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Lock, Loader2, AlertCircle, Briefcase } from "lucide-react";

export default function EmployeeLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, setActiveRole } = useMultiAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password, "employee");
      
      if (setActiveRole) {
        setActiveRole("employee");
        localStorage.setItem('active_role', 'employee');
      }

      const returnUrl = location.state?.returnUrl;
      if (returnUrl) {
        navigate(returnUrl, { replace: true });
        return;
      }

      navigate("/stockship/employee/dashboard", { replace: true });
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfter = err.response.headers['retry-after'] || 15;
        setError(`Too many login attempts. Please wait ${retryAfter} seconds before trying again.`);
      } else {
        setError(err.response?.data?.message || err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-500/10 via-background to-green-500/5 p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1 text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 w-16 h-16 rounded-full bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center"
            >
              <Briefcase className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-linear-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
              {t('login.employeeTitle')}
            </CardTitle>
            <CardDescription className="text-lg">
              {t('login.employeeSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label htmlFor="email" className="text-sm font-medium">
                  {t('login.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="employee@stokship.com"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <label htmlFor="password" className="text-sm font-medium">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('login.signingIn')}
                  </>
                ) : (
                  t('login.signIn')
                )}
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-center text-sm text-muted-foreground"
            >
              <p className="text-xs">Employee: employee@stokship.com / password</p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}



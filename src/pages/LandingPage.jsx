import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Box, Shield, Globe, Ship, LayoutDashboard, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { offerApi } from '@/lib/mediationApi';

export default function LandingPage() {
  const { isLoggedIn, isClient, isTrader, isEmployee, isAdmin, isVendor, isModerator, activeRole } = useMultiAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  useEffect(() => {
    fetchPublicOffers();
  }, []);

  const fetchPublicOffers = async () => {
    try {
      const response = await offerApi.getActiveOffers({ limit: 6 });
      setOffers(response.data?.data || []);
    } catch (error) {
      console.error("Failed to load offers:", error);
    } finally {
      setLoadingOffers(false);
    }
  };

  const getDashboardLink = () => {
    if (activeRole === 'client' || isClient()) return '/stockship/client/dashboard';
    if (activeRole === 'trader' || isTrader()) return '/stockship/trader/dashboard';
    if (activeRole === 'employee' || isEmployee()) return '/stockship/employee/dashboard';
    if (activeRole === 'vendor' || isVendor()) return '/stockship/vendor/dashboard';
    if (activeRole === 'admin' || isAdmin()) return '/stockship/admin/dashboard';
    if (activeRole === 'moderator' || isModerator()) return '/stockship/moderator/dashboard';
    return '/login';
  };

  const dashboardLink = getDashboardLink();
  const isAuthenticated = isLoggedIn('client') || isLoggedIn('trader') || isLoggedIn('employee') || isLoggedIn('admin') || isLoggedIn('vendor') || isLoggedIn('moderator');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        {/* ... header content ... */}
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl text-primary">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Ship className="w-5 h-5" />
            </div>
            StockShip
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to={dashboardLink}>
                <Button className="gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button>Login</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 lg:py-32 relative overflow-hidden">
          {/* ... hero content ... */}
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-primary/10 -z-10" />
          <div className="container mx-auto px-4 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent"
            >
              Global Logistics & Trading <br className="hidden md:block" /> Simplified.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Connect with top traders, manage shipments, and streamline your supply chain with our advanced mediation platform.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center gap-4"
            >
              {isAuthenticated ? (
                <Link to={dashboardLink}>
                  <Button size="lg" className="h-12 px-8 text-lg gap-2">
                    Go to Dashboard <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button size="lg" className="h-12 px-8 text-lg gap-2">
                    Get Started <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </section>

        {/* Public Marketplace Preview */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
             <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Latest Opportunities</h2>
                <p className="text-muted-foreground">Discover the latest offers from our verified traders</p>
             </div>

             {loadingOffers ? (
               <div className="flex justify-center py-12">
                 <Loader2 className="w-8 h-8 animate-spin text-primary" />
               </div>
             ) : offers.length === 0 ? (
               <div className="text-center py-12 bg-card rounded-lg border">
                 <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                 <p>No active offers at the moment.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {offers.map((offer, idx) => (
                   <motion.div
                     key={offer.id}
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.1 }}
                     viewport={{ once: true }}
                   >
                     <Card className="h-full hover:shadow-lg transition-shadow">
                       <CardHeader>
                         <div className="flex justify-between items-start">
                           <div>
                             <CardTitle className="text-lg line-clamp-1">{offer.title}</CardTitle>
                             <CardDescription className="line-clamp-2 mt-1">{offer.description}</CardDescription>
                           </div>
                           <Badge variant="outline">{offer.status}</Badge>
                         </div>
                       </CardHeader>
                       <CardContent>
                         <div className="space-y-2 text-sm text-muted-foreground">
                            {offer.country && (
                              <div className="flex justify-between">
                                 <span>Origin:</span>
                                 <span className="font-medium text-foreground">{offer.country}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                               <span>Items:</span>
                               <span className="font-medium text-foreground">{offer.items?.length || 0}</span>
                            </div>
                         </div>
                       </CardContent>
                       <CardFooter>
                         <Button className="w-full" onClick={() => navigate(`/offers/${offer.id}`)}>
                            View Details <ArrowRight className="w-4 h-4 ml-2" />
                         </Button>
                       </CardFooter>
                     </Card>
                   </motion.div>
                 ))}
               </div>
             )}
             
             {!loadingOffers && offers.length > 0 && (
               <div className="text-center mt-10">
                 <Link to={isAuthenticated ? "/stockship/client/dashboard" : "/login"}>
                   <Button variant="outline" size="lg">View All Offers</Button>
                 </Link>
               </div>
             )}
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-card/30">
          <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Box} 
              title="Inventory Management" 
              description="Real-time tracking of your goods and shipments across the globe." 
              delay={0.3}
            />
            <FeatureCard 
              icon={Shield} 
              title="Secure Transactions" 
              description="Safe and transparent deals with verified traders and suppliers." 
              delay={0.4}
            />
            <FeatureCard 
              icon={Globe} 
              title="Global Network" 
              description="Access a worldwide network of logistics partners and markets." 
              delay={0.5}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-card/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} StockShip. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}

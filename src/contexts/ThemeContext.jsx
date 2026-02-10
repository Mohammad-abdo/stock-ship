import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Force light mode only - no dark mode
  const [theme, setTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState(() => {
    return localStorage.getItem('primaryColor') || 'blue';
  });
  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('fontFamily') || 'inter';
  });
  const [sidebarStyle, setSidebarStyle] = useState(() => {
    return localStorage.getItem('sidebarStyle') || 'default';
  });

  useEffect(() => {
    // Force light mode - remove dark mode
    localStorage.setItem('theme', 'light');
    localStorage.setItem('primaryColor', primaryColor);
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('sidebarStyle', sidebarStyle);
    
    const root = document.documentElement;
    
    // Force light mode only
    root.classList.remove('light', 'dark');
    root.classList.add('light');
    
    // Apply primary color based on theme
    const colors = {
      blue: { 
        light: { primary: '221.2 83.2% 53.3%', primaryForeground: '0 0% 100%' },
        dark: { primary: '217.2 91.2% 59.8%', primaryForeground: '222.2 47.4% 11.2%' }
      },
      green: { 
        light: { primary: '142.1 76.2% 36.3%', primaryForeground: '355.7 100% 97.3%' },
        dark: { primary: '142.1 70% 45%', primaryForeground: '0 0% 100%' }
      },
      purple: { 
        light: { primary: '262.1 83.3% 57.8%', primaryForeground: '0 0% 100%' },
        dark: { primary: '262.1 80% 65%', primaryForeground: '0 0% 100%' }
      },
      red: { 
        light: { primary: '0 72.2% 50.6%', primaryForeground: '0 0% 100%' },
        dark: { primary: '0 70% 55%', primaryForeground: '0 0% 100%' }
      },
      orange: { 
        light: { primary: '24.6 95% 53.1%', primaryForeground: '0 0% 100%' },
        dark: { primary: '24.6 90% 58%', primaryForeground: '0 0% 100%' }
      },
      pink: { 
        light: { primary: '330.4 81.2% 60.4%', primaryForeground: '0 0% 100%' },
        dark: { primary: '330.4 75% 65%', primaryForeground: '0 0% 100%' }
      },
    };
    
    if (colors[primaryColor]) {
      // Always use light mode colors
      const colorScheme = colors[primaryColor].light;
      // Update primary color with hsl() format
      root.style.setProperty('--primary', colorScheme.primary);
      root.style.setProperty('--primary-foreground', colorScheme.primaryForeground);
      // Also update ring color
      root.style.setProperty('--ring', colorScheme.primary);
      
      // Force update all elements that use primary color
      const style = document.createElement('style');
      style.id = 'dynamic-primary-color';
      style.textContent = `
        :root {
          --primary: ${colorScheme.primary};
          --primary-foreground: ${colorScheme.primaryForeground};
          --ring: ${colorScheme.primary};
        }
        .dark {
          --primary: ${colors[primaryColor].dark?.primary || colorScheme.primary};
          --primary-foreground: ${colors[primaryColor].dark?.primaryForeground || colorScheme.primaryForeground};
          --ring: ${colors[primaryColor].dark?.primary || colorScheme.primary};
        }
      `;
      const existingStyle = document.getElementById('dynamic-primary-color');
      if (existingStyle) {
        existingStyle.remove();
      }
      document.head.appendChild(style);
    }

    // Apply font family
    const fonts = {
      inter: '"Inter", system-ui, -apple-system, sans-serif',
      roboto: '"Roboto", system-ui, sans-serif',
      poppins: '"Poppins", system-ui, sans-serif',
      opensans: '"Open Sans", system-ui, sans-serif',
      lato: '"Lato", system-ui, sans-serif',
      montserrat: '"Montserrat", system-ui, sans-serif',
      cairo: '"Cairo", system-ui, sans-serif',
      tajawal: '"Tajawal", system-ui, sans-serif',
    };

    if (fonts[fontFamily]) {
      root.style.setProperty('--font-family', fonts[fontFamily]);
      document.body.style.fontFamily = fonts[fontFamily];
    }

    // Apply sidebar style class
    root.classList.remove('sidebar-default', 'sidebar-minimal', 'sidebar-compact', 'sidebar-gradient');
    root.classList.add(`sidebar-${sidebarStyle}`);
  }, [theme, primaryColor, fontFamily, sidebarStyle]);

  // Disabled - light mode only
  const toggleTheme = () => {
    // No-op: light mode only
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      primaryColor, 
      fontFamily,
      sidebarStyle,
      setTheme, 
      setPrimaryColor, 
      setFontFamily,
      setSidebarStyle,
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};


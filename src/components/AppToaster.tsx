import { Toaster } from 'sonner';
import { useTheme } from '../contexts/themeContextCore';

const AppToaster = () => {
  const { theme } = useTheme();

  return <Toaster richColors closeButton position="top-right" theme={theme} />;
};

export default AppToaster;

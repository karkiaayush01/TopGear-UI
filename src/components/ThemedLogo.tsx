import { useTheme } from '../contexts/themeContextCore';

type ThemedLogoProps = {
  className?: string;
};

const ThemedLogo = ({ className }: ThemedLogoProps) => {
  const { theme } = useTheme();

  return <img src={`/logo/TopGear-${theme}.png`} alt="TopGear" className={className} />;
};

export default ThemedLogo;

import { useMediaQuery } from './useMediaQuery';

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export function useResponsive() {
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm})`);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md})`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg})`);
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl})`);
  const is2xl = useMediaQuery(`(min-width: ${breakpoints['2xl']})`);

  const isMobile = !isSm;
  const isTablet = isSm && !isLg;
  const isDesktop = isLg;

  return {
    // Breakpoint checks
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    
    // Device type checks
    isMobile,
    isTablet,
    isDesktop,
    
    // Utility checks
    isSmAndUp: isSm,
    isMdAndUp: isMd,
    isLgAndUp: isLg,
    isXlAndUp: isXl,
    is2xlAndUp: is2xl,
    
    // Range checks
    isSmToMd: isSm && !isMd,
    isMdToLg: isMd && !isLg,
    isLgToXl: isLg && !isXl,
    isXlTo2xl: isXl && !is2xl,
  };
}
# NotesFlow Performance Baseline

## Core Web Vitals Targets

### Required Thresholds
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **INP (Interaction to Next Paint)**: < 200ms

### Additional Metrics
- **TTFB (Time to First Byte)**: < 800ms
- **FCP (First Contentful Paint)**: < 1.8s
- **TBT (Total Blocking Time)**: < 200ms

## Performance Monitoring Setup

### 1. Web Vitals Monitoring
- Implemented `useReportWebVitals` hook in WebVitals component
- Real-time monitoring in development with debug overlay
- Production analytics endpoint support via `NEXT_PUBLIC_ANALYTICS_ENDPOINT`

### 2. Bundle Analysis
```bash
# Analyze bundle size
bun run analyze

# Analyze server bundles only
bun run analyze:server

# Analyze client bundles only
bun run analyze:browser
```

### 3. Performance Hooks
- Custom `usePerformance` hook for component-level metrics
- Automatic render time tracking
- Action performance measurement

## Initial Baseline (Empty Project)

Run `bun dev` and navigate to `http://localhost:3000?debug=true` to see Web Vitals overlay.

### Expected Initial Metrics
- FCP: < 500ms (empty page)
- LCP: < 500ms (no content)
- CLS: 0 (no layout shifts)
- FID/INP: < 50ms (minimal interactivity)

## Performance Testing Checklist

### Development
- [ ] Enable Web Vitals debug mode: `?debug=true`
- [ ] Monitor console for performance logs
- [ ] Check React DevTools Profiler

### Pre-Production
- [ ] Run bundle analyzer
- [ ] Test with Chrome DevTools Lighthouse
- [ ] Measure with WebPageTest
- [ ] Test on real devices (mobile, tablet)
- [ ] Test on slow 3G network

### Production Monitoring
- [ ] Configure analytics endpoint
- [ ] Set up performance alerts
- [ ] Monitor Core Web Vitals dashboard
- [ ] Track performance regressions

## Performance Optimization Guidelines

### Bundle Size
- Target < 200KB for initial JavaScript
- Use dynamic imports for heavy features
- Tree-shake unused code
- Optimize images with next/image

### Rendering
- Prefer Server Components by default
- Use Suspense boundaries
- Implement streaming SSR
- Minimize client-side state

### Network
- Enable HTTP/2 Push
- Use resource hints (preconnect, prefetch)
- Implement proper caching headers
- Optimize API response times

## Monitoring Commands

```bash
# Development performance check
bun dev --turbopack
# Open http://localhost:3000?debug=true

# Production build analysis
bun run analyze

# Lighthouse CI (install first: npm i -g @lhci/cli)
lhci autorun
```
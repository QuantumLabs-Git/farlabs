## Frontend Styleguide

### Design Language
- **Palette**: Dark base (`#050505`, `#0F0F0F`) with neon purple (`#7C3AED`) and emerald accents.
- **Typography**: `Space Grotesk` for display, `JetBrains Mono` for data payloads. Use uppercase with wide letter spacing for section headers.
- **Effects**: Glassmorphism panels (`glass-panel` utility), radial glow hover tracking (see `ServiceCard`), motion transitions via Framer Motion.
- **Spacing**: 24px baseline grid (`space-y-6`, `gap-6`). Keep edges rounded (24px+) for primary panels.

### Components
- `Button`: Supports `primary`, `ghost`, `outline`. Use `asChild` when wrapping links. Adds loading spinner automatically.
- `Card`: Glass panels with optional elevation (neon shadow). Apply `elevated` for interactive states.
- `Modal`: Headless UI `Dialog` with blur background and neon border.

### Layout
- Top-level `Header` uses sticky glass container with scroll-based elevation.
- `Navigation` encapsulates active states with gradient glows.
- Section spacing: `space-y-16` to visually separate vertical content bands.

### Animations
- Framer Motion `whileInView` for progressive reveal.
- Hover states add translation, shadow emphasis, and gradient overlays.
- Use `transition={{ delay: index * 0.04 }}` to create cascade effects on grid items.

### Accessibility
- Ensure 4.5:1 contrast ratio (dark backgrounds, light text).
- Focus outlines preserved (`focus-visible:ring-brand`).
- Provide descriptive alt text and ARIA labels when integrating media.

### Web3 UX
- Wallet interactions handled through `WalletConnect` component; show FAR balance badges.
- Use monospace font for addresses. Truncate with `shortenAddress`.
- Provide contextual status (e.g., pending, confirmed) in `TransactionHistory`.

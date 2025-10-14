# Far Labs Brand Guidelines
## Version 1.0

---

## 🎨 Brand Overview

Far Labs is the innovation hub powering multiple decentralized ecosystems across AI, gaming, science, and digital identity. Our brand represents cutting-edge technology, decentralization, and community-driven innovation.

### Brand Promise
Building the Future of Decentralized Technology

### Brand Values
- **Innovation**: Pioneering breakthrough solutions in Web3
- **Decentralization**: Empowering users through distributed systems
- **Transparency**: Real metrics, no mock data, authentic growth
- **Community**: Building together with developers and users worldwide

---

## 🎨 Color Palette

### Primary Colors

#### Purple Gradient (Main Brand Color)
- **Primary**: `#7C3AED`
- **Primary Light**: `#A78BFA`
- **Primary Dark**: `#5B21B6`
- **Usage**: Logo, CTAs, key highlights, links
- **Gradient**: `linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)`

### Accent Colors

#### Success Green
- **Accent**: `#10B981`
- **Usage**: Success states, positive metrics, online status

#### Warning Orange
- **Warning**: `#F59E0B`
- **Usage**: Warnings, important notices

#### Danger Red
- **Danger**: `#EF4444`
- **Usage**: Errors, offline status, critical alerts

### Dark Theme Colors

#### Backgrounds
- **Primary Background**: `#0F0F0F` - Main page background
- **Secondary Background**: `#1A1A1A` - Cards and sections
- **Tertiary Background**: `#262626` - Inputs and nested elements
- **Border**: `#2D2D2D` - All borders and dividers

#### Text Colors
- **Primary Text**: `#FFFFFF` - Headlines and primary content
- **Secondary Text**: `#A3A3A3` - Body text and descriptions
- **Muted Text**: `#737373` - Captions and labels

---

## 📝 Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Weights
- **Regular**: 400 - Body text
- **Medium**: 500 - Navigation, labels
- **Semibold**: 600 - Subheadings
- **Bold**: 700 - Important metrics
- **Extra Bold**: 800 - Headlines, logo

### Type Scale

#### Headlines
- **H1**: 3.5-4.5rem (clamp(2.5rem, 6vw, 4.5rem)), Extra Bold (800)
- **H2**: 3rem, Extra Bold (800)
- **H3**: 1.5rem, Bold (700)

#### Body
- **Large**: 1.25rem - Hero descriptions
- **Regular**: 1rem - Body text
- **Small**: 0.875rem - Labels, captions

#### Special
- **Logo**: 1.5rem, Extra Bold (800), Purple gradient
- **Stat Values**: 2-2.5rem, Extra Bold (800), Purple gradient
- **Button Text**: 1rem, Semibold (600)

### Letter Spacing
- **Headlines**: -0.02em to -0.03em (tight)
- **Uppercase Labels**: 0.05em (loose)
- **Body**: Normal

---

## 🏷️ Logo Usage

### Primary Logo
- **Text**: "FAR LABS"
- **Style**: All caps, Extra Bold (800)
- **Color**: Purple gradient (`linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)`)
- **CSS Implementation**:
```css
.logo {
    font-size: 1.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
```

### Logo Clear Space
- Minimum clear space around logo = 0.5x height of logo
- Never place logo on busy backgrounds
- Always ensure sufficient contrast

### Logo Don'ts
- ❌ Don't change the gradient colors
- ❌ Don't use different fonts
- ❌ Don't add effects or shadows
- ❌ Don't stretch or distort

---

## 🎭 Visual Style

### Design Principles

#### Dark & Modern
- Dark theme by default (#0F0F0F background)
- High contrast for readability
- Subtle gradients for depth

#### Black & White Icons
All emoji icons must be rendered in black and white:
```css
.emoji-bw {
    filter: grayscale(100%) contrast(200%);
}
```

#### Card Design
- Background: `#1A1A1A`
- Border: 1px solid `#2D2D2D`
- Border radius: 1rem
- Padding: 2rem
- Hover state: Border changes to primary color, subtle elevation

#### Gradients
- **Primary Gradient**: `linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)`
- **Card Background**: `linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)`
- Use sparingly for emphasis

---

## 🧩 Component Patterns

### Buttons

#### Primary Button
```css
background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%);
color: white;
padding: 0.875rem 2rem;
border-radius: 0.5rem;
font-weight: 600;
box-shadow: 0 4px 25px rgba(124, 58, 237, 0.25);
```

#### Secondary Button
```css
background: #1A1A1A;
color: #FFFFFF;
border: 1px solid #2D2D2D;
```

### Forms
- Input background: `#262626`
- Border: 1px solid `#2D2D2D`
- Focus state: Border color changes to primary
- Border radius: 0.5rem

### Navigation
- Fixed position with backdrop blur
- Background: `rgba(15, 15, 15, 0.95)`
- Border bottom: 1px solid `#2D2D2D`

---

## 📊 Data Visualization

### Metrics Display
- **All metrics start at 0** - No mock data
- Large numbers use gradient text
- Include units ($, %, etc.)
- Format large numbers (1M, 1K, etc.)

### Charts
- Primary color: `#7C3AED`
- Background: `rgba(124, 58, 237, 0.1)`
- Grid lines: `rgba(255, 255, 255, 0.1)`
- Text color: `#A3A3A3`

---

## 💬 Voice & Tone

### Writing Style
- **Concise**: Direct and to the point
- **Technical**: Accurate terminology
- **Professional**: No unnecessary embellishments
- **Authentic**: Real metrics only, no inflation

### Key Phrases
- "Building the Future of Decentralized Technology"
- "Decentralized AI inference at scale"
- "The innovation hub powering multiple ecosystems"

---

## 🚀 Project Sub-brands

Each ecosystem project maintains consistent styling while having its own identity:

1. **Far Inference** 🧠 - Decentralized AI Network
2. **Farcana Game** 🎮 - Blockchain Gaming
3. **Far DeSci** 🧪 - Decentralized Science
4. **Far GameD** 🏆 - Game Distribution
5. **FarTwin AI** 👥 - Digital Twin Platform
6. **$FAR Token** 💎 - Utility Token

All project icons must be displayed in black and white using the grayscale filter.

---

## 📱 Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Considerations
- Stack grid layouts to single column
- Hide secondary navigation
- Maintain 16px minimum touch targets
- Preserve readability with appropriate font sizes

---

## ✅ Do's and Don'ts

### Do's
✅ Use the exact color values specified
✅ Maintain consistent spacing (1rem = 16px base)
✅ Apply grayscale filter to all emoji icons
✅ Start all metrics at 0 (no mock data)
✅ Use Inter font family
✅ Apply proper gradient to logo text

### Don'ts
❌ Don't use colored emoji icons
❌ Don't add mock or inflated data
❌ Don't modify the primary purple gradient
❌ Don't use light themes
❌ Don't change established color relationships
❌ Don't add unnecessary animations or effects

---

## 🔗 Implementation

### CSS Variables
```css
:root {
    --primary: #7C3AED;
    --primary-light: #A78BFA;
    --primary-dark: #5B21B6;
    --accent: #10B981;
    --warning: #F59E0B;
    --danger: #EF4444;
    --bg-primary: #0F0F0F;
    --bg-secondary: #1A1A1A;
    --bg-tertiary: #262626;
    --border: #2D2D2D;
    --text-primary: #FFFFFF;
    --text-secondary: #A3A3A3;
    --text-muted: #737373;
}
```

---

## 📞 Contact

For brand-related questions or asset requests, contact the Far Labs team.

**Version**: 1.0
**Last Updated**: October 2024
**Status**: Active

---

*These guidelines ensure consistent brand representation across all Far Labs properties and communications.*
# Design System Inspired by University of Dhaka

## 1. Visual Theme & Atmosphere

The University of Dhaka design system embodies institutional authority and academic prestige through a sophisticated blend of deep navy foundations and vibrant accent colors. This system prioritizes clarity, accessibility, and professional communication while maintaining warm, approachable elements through strategic use of golden-amber accents. The design language reflects a prestigious educational institution—combining formal structures with modern usability. Multilingual support (English and Bengali) is central to the visual identity, requiring robust typography and spacing systems. The atmosphere is authoritative yet inclusive, conveying trust and excellence while remaining welcoming to diverse stakeholder groups (students, faculty, alumni, and the general public).

**Key Characteristics**
- Deep navy (`#002147`) as the dominant structural element, conveying stability and academic rigor
- Golden-amber accents (`#FFB606`) that add warmth and highlight interactive, important elements
- High contrast ratios ensuring accessibility across digital and physical touchpoints
- Poppins font family throughout for modern, readable typographic presentation
- Extensive use of whitespace and generous spacing for premium feel
- Clear hierarchical structure with multiple button styles for diverse interaction contexts
- Responsive design supporting institutional complexity (navigation, admissions, research, services)

## 2. Color Palette & Roles

### Primary
- **Navy Blue** (`#002147`): Dominant color used extensively across headers, navigation, backgrounds, and structural elements. Conveys institutional authority and academic excellence. Primary brand color representing the university's identity.
- **Sky Blue** (`#428BCA`): Secondary primary color used for links, hover states, and subtle interactive indicators. Provides visual hierarchy without overwhelming the interface.

### Accent Colors
- **Golden Amber** (`#FFB606`): Primary call-to-action and interactive element color. Used prominently for buttons, links, and attention-grabbing elements across the interface. Communicates warmth and forward momentum alongside institutional professionalism.

### Interactive
- **Error Red** (`#FF0000`): Error states, validation failures, and critical alerts. Used sparingly but prominently when user action is required to correct mistakes.
- **Light Lavender** (`#BBAACC`): Subtle accent for secondary interactive states or decorative elements. Minimal usage but provides sophisticated color variation.

### Neutral Scale
- **Charcoal Dark** (`#1C1C1C`): Darkest neutral for emphasis text and critical typography. Used rarely for maximum impact.
- **Dark Gray** (`#333333`): Primary body text color and heavy emphasis. High contrast against light backgrounds for optimal readability.
- **Medium Gray** (`#666666`): Secondary text, metadata, and lower-hierarchy information. Most frequently used neutral, providing visual rest without reducing clarity.
- **Light Gray** (`#777777`): Tertiary text and disabled states. Reduced visual weight while maintaining legibility.
- **Off-White** (`#F7F7F7`): Subtle background tint for content areas and cards, adding depth while maintaining minimal visual distraction.

### Surface & Borders
- **Pure White** (`#FFFFFF`): Primary surface color for content areas, inputs, and card backgrounds. Ensures maximum readability and accessibility.
- **Border Gray** (`#E7E7E7`): Subtle dividing lines and table borders. Low-contrast stroke for organizational hierarchy without visual heaviness.

### Semantic / Status
- **Warning Amber** (`#FFB606`): Warning states, highlights, and calls-to-action. Uses the same gold as accent for consistency—indicates positive action or important information requiring attention.

## 3. Typography Rules

### Font Family
**Primary:** Poppins (https://fonts.googleapis.com/css?family=Open+Sans)
Fallback stack: `Poppins, 'Open Sans', 'Segoe UI', Roboto, sans-serif`

**Secondary:** System stack for fallback
`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| **Display** | Poppins | 30px | 600 | 36px | 0px | Hero titles and major section headers; high prominence |
| **H2** | Poppins | 30px | 600 | 36px | 0px | Primary page headings and section titles |
| **H3** | Poppins | 24px | 400 | 28.8px | 0px | Secondary section headers and subsections |
| **H4** | Poppins | 18px | 600 | 25.2px | 0px | Tertiary headings and card titles; increased weight for emphasis |
| **H5** | Poppins | 14px | 600 | 16.8px | 0px | Subheadings and labels; compact but emphasized |
| **Body** | Poppins | 18px | 400 | 30px | 0px | Primary body text for articles and long-form content; generous line height for readability |
| **Body Small** | Poppins | 14px | 400 | 26px | 0px | Secondary body text, metadata, and captions; maintains legibility at reduced size |
| **List Item** | Poppins | 14px | 500 | 26px | 0px | List items and navigation text; medium weight for visual distinction |
| **Button** | Poppins | 12px | 700 | 25px | 0px | Call-to-action text; bold weight commands attention |
| **Link** | Poppins | 14px | 600 | 26px | 0px | Inline and standalone links; bold weight with inherited color system |
| **Span / Utility** | Poppins | 14px | 400 | 26px | 0px | Inline text, badges, and utility elements |
| **Code / Monospace** | Poppins | 14px | 400 | 26px | 0px | Code blocks and technical text (fallback to system monospace when available) |

### Principles
- **Generous line height** (1.5–1.8 ratio) ensures readability across all text sizes, essential for multilingual content (English and Bengali)
- **Weight progression** creates clear visual hierarchy without excessive size variation (400, 500, 600, 700 weights)
- **Consistent font family** (Poppins throughout) unifies the interface and reduces cognitive load
- **Size jumps** between hierarchy levels are moderate (18px → 24px → 30px) to maintain visual cohesion
- **Body text prioritizes comfort** with 18px base size and 30px line height, accommodating diverse reading abilities and age groups
- **Button typography** is compact (12px) but bold (700 weight) to ensure CTAs stand out without excessive whitespace
- **Accessibility first:** High contrast with neutral backgrounds and generous spacing between letterforms

## 4. Component Stylings

### Buttons

#### Primary Button (Fixed Width, CTA)
```
Background: #FFB606
Text Color: #002147
Font: Poppins, 12px, 700, line-height 25px
Padding: 2px 10px
Height: 33px
Width: 120px
Border: 2px solid #FFB606
Border Radius: 3px
Box Shadow: none
```
**Hover State:** Background becomes darker amber (`#E6A500`), text remains `#002147`
**Active State:** Border becomes `2px solid #CC8A00`, subtle inset shadow `inset 0 1px 2px rgba(0,0,0,0.2)`
**Disabled State:** Background becomes `#F0F0F0`, text becomes `#CCCCCC`, cursor becomes `not-allowed`

#### Primary Button (Flexible Width, CTA)
```
Background: #FFB606
Text Color: #002147
Font: Poppins, 12px, 700, line-height 25px
Padding: 2px 10px
Height: auto
Width: auto
Border: 2px solid #FFB606
Border Radius: 3px
Box Shadow: none
Minimum Width: 100px
```
**Hover State:** Same as fixed-width button
**Active State:** Same as fixed-width button
**Disabled State:** Same as fixed-width button

#### Secondary Button (Text-based Navigation)
```
Background: transparent
Text Color: #666666
Font: Poppins, 18px, 400, line-height 26px
Padding: 0px
Height: auto
Width: auto
Border: 0px
Border Radius: 4px
Box Shadow: none
```
**Hover State:** Text color becomes `#002147`, background becomes `rgba(0, 33, 71, 0.05)`, padding adjusts to `2px 4px`
**Active State:** Text color becomes `#002147`, text weight becomes 600
**Disabled State:** Text color becomes `#CCCCCC`, cursor becomes `not-allowed`

#### Tertiary Button (Icon-adjacent, Minimal)
```
Background: transparent
Text Color: #666666
Font: Poppins, 14px, 400, line-height 26px
Padding: 0px
Height: auto
Width: auto
Border: 0px
Border Radius: 0px
Box Shadow: none
```
**Hover State:** Text color becomes `#428BCA`, text decoration underline added
**Active State:** Text color becomes `#002147`, text weight becomes 600
**Disabled State:** Text color becomes `#CCCCCC`

### Cards & Containers

#### Content Card (Standard)
```
Background: #FFFFFF
Border: 1px solid #E7E7E7
Border Radius: 8px
Padding: 20px
Box Shadow: 0px 1px 3px rgba(0, 0, 0, 0.08)
Text Color: #333333
```
**Hover State:** Box shadow becomes `0px 4px 12px rgba(0, 0, 0, 0.12)`
**Focus State:** Border becomes `1px solid #428BCA`

#### Hero Container (Full-width Banner)
```
Background: linear-gradient(135deg, #002147 0%, #1a3a5c 100%)
Padding: 60px 36px
Border Radius: 0px
Box Shadow: none
Text Color: #FFFFFF
Min Height: 300px
```
**Content Overlay:** Semi-transparent dark overlay (`rgba(0, 33, 71, 0.5)`) for text legibility over background images

#### Section Container (Grouped Content)
```
Background: #F7F7F7
Padding: 36px 20px
Border Radius: 4px
Border: none
Box Shadow: none
```

### Inputs & Forms

#### Text Input (Standard)
```
Background: #FFFFFF
Border: 1px solid #E7E7E7
Border Radius: 8px
Padding: 8px 20px
Height: 34px
Font: Poppins, 14px, 400, line-height 20px
Text Color: #1C1C1C
Placeholder Color: #999999
```
**Focus State:** Border becomes `1px solid #428BCA`, box shadow becomes `0 0 0 3px rgba(66, 139, 202, 0.1)`
**Filled State:** Border becomes `1px solid #666666`, background remains `#FFFFFF`
**Error State:** Border becomes `1px solid #FF0000`, placeholder text becomes `#FF6666`
**Disabled State:** Background becomes `#F7F7F7`, border becomes `1px solid #E7E7E7`, text color becomes `#CCCCCC`, cursor becomes `not-allowed`

#### Textarea
```
Background: #FFFFFF
Border: 1px solid #E7E7E7
Border Radius: 8px
Padding: 12px 20px
Font: Poppins, 14px, 400, line-height 20px
Text Color: #1C1C1C
Min Height: 100px
Resize: vertical
```
**Focus State:** Same as text input
**Error State:** Same as text input

#### Select / Dropdown Input
```
Background: #FFFFFF
Border: 1px solid #E7E7E7
Border Radius: 8px
Padding: 8px 20px
Height: 34px
Font: Poppins, 14px, 400
Text Color: #1C1C1C
Appearance: none
```
**Focus State:** Same as text input
**Open State:** Border becomes `1px solid #428BCA`, box shadow becomes `0px 5px 50px rgba(0, 0, 0, 0.15)`

### Navigation

#### Top Navigation Bar
```
Background: rgba(0, 0, 0, 0)
Height: 110px
Width: 1440px (full container)
Padding: 0px
Font: Poppins, 14px, 400, line-height 26px
Text Color: #666666
Border: none
Box Shadow: 0px 8px 25px rgba(0, 0, 0, 0.04)
```
**Link Hover:** Text color becomes `#002147`, background becomes `rgba(0, 33, 71, 0.08)`
**Active Link:** Text color becomes `#002147`, text weight becomes 600, border-bottom becomes `2px solid #FFB606`

#### Dropdown Navigation Menu
```
Background: #FFFFFF
Border Radius: 4px
Box Shadow: 0px 5px 50px rgba(0, 0, 0, 0.15)
Padding: 8px 0px
Min Width: 180px
```
**Item Padding:** 12px 16px
**Item Text Color:** `#333333`
**Item Hover State:** Background becomes `#F7F7F7`, text color becomes `#002147`
**Item Active State:** Background becomes `#E6A500`, text color becomes `#FFFFFF`
**Separator:** 1px solid `#E7E7E7` between groups

#### Breadcrumb Navigation
```
Font: Poppins, 12px, 400, line-height 20px
Text Color: #666666
Separator: " / " in `#CCCCCC`
Padding: 8px 0px
```
**Link Hover:** Text color becomes `#428BCA`, text decoration underline added
**Current Page:** Text color becomes `#333333`, text weight becomes 600, no underline on hover

## 5. Layout Principles

### Spacing System

**Base Unit:** 4px (all spacing derives from multiples of 4px)

**Spacing Scale:**
- **Micro (4px):** Inline text spacing, minimal gaps between closely-related elements
- **XS (8px):** Tight spacing between related components
- **S (12px):** Gap between form elements, list items, and utility spacing
- **M (16px):** Padding inside cards, standard spacing between content sections
- **L (20px):** Padding within containers, spacing between grouped sections
- **XL (24px):** Margin between major sections, spacing around cards
- **2XL (32px):** Margin between distinct content blocks
- **3XL (36px):** Padding for hero sections, major layout spacing
- **4XL (52px):** Large spacing between page sections
- **5XL (60px):** Hero section padding, page-level spacing
- **6XL (64px):** Major section margins, full-width spacing
- **7XL (136px):** Spacing between major page areas
- **8XL (196px):** Maximum margin between distinct page zones

**Usage Context:**
- **Form elements:** 12px vertical spacing between inputs
- **Cards:** 16px–20px internal padding, 24px spacing between cards
- **Typography:** 24px margin-bottom for headings, 32px for major sections
- **Navigation:** 16px padding for menu items, 12px gap for icon groups
- **Buttons:** 2px–10px padding (component-specific)

### Grid & Container

**Max Width:** 1440px for main container
**Columns:** 12-column grid system for responsive breakpoints
**Gutter:** 20px (10px on each side of column)
**Section Padding:** 36px–60px horizontal padding on full-width sections
**Content Margin:** Auto-centered within 1440px container

**Container Patterns:**
- **Full-width Hero:** Edge-to-edge with internal 36px–60px padding
- **Bounded Content:** Centered within 1440px max-width container
- **Sidebar Layout:** Primary 8 columns + sidebar 4 columns (or 9 + 3 variation)
- **Three-Column Grid:** Equal 4-column sections for content, testimonials, and facts

### Whitespace Philosophy

The design system embraces generous whitespace as a mark of premium positioning and accessibility. Spacing is intentional and consistent, never arbitrary—every margin and padding value aligns to the 4px base unit scale. Whitespace provides visual rest for users and reduces cognitive load, particularly important for multilingual content where text density can increase. Card-based layouts isolate content into digestible chunks with clear spatial separation. Section margins (32px–64px) create natural breathing room between major content areas. The hierarchy is reinforced through spacing variation: tighter internal padding within components, looser external spacing between distinct sections.

### Border Radius Scale

- **Minimal (3px):** Buttons and small interactive elements; subtle rounding for refined appearance
- **Subtle (4px):** Navigation items, small cards, form states
- **Standard (8px):** Primary cards, standard inputs, moderate-sized components
- **Large (30px):** Fully rounded buttons (rare); accent elements

### Border Widths

- **Thin (1px):** Table borders, card outlines, subtle dividers, input focus states
- **Medium (2px):** Button borders, active states, prominent interactive elements
- **Thick (3px):** Not currently in use; reserved for future prominent dividers

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| **Base (No Shadow)** | No box-shadow | Flat components, text, static containers |
| **Raised (Small)** | `0px 1px 3px rgba(0, 0, 0, 0.08)` | Standard cards, subtle elevation for depth |
| **Elevated (Medium)** | `0px 4px 12px rgba(0, 0, 0, 0.12)` | Card hover states, dropdown menus appearing |
| **High (Large)** | `0px 5px 50px rgba(0, 0, 0, 0.15)` | Dropdown navigation, modals, overlays |
| **Modal (Highest)** | `0px 8px 25px rgba(0, 0, 0, 0.04)` | Navigation bars, sticky elements |

**Shadow Philosophy:**
Shadows are used sparingly and subtly to enhance usability rather than decorate. The system employs soft, realistic shadows that suggest gentle elevation without dramatic depth. Shadows increase in blur and spread at higher elevations, creating a clear visual hierarchy. The darkest shadows (dropdown, modal) are reserved for interactive surfaces that require distinction from the background. Neutral color at the base (`rgba(0, 0, 0, ...)`) ensures shadows work across all background colors. Shadow opacity ranges from 0.04 (subtle navigation) to 0.15 (prominent dropdowns), providing visual feedback without overwhelming the interface.

### Opacity Levels

- **Disabled State:** 0.5 opacity on button text/icons, indicating unavailable interaction
- **Hover Overlay:** 0.05–0.08 opacity dark overlay on hover backgrounds, subtle feedback
- **Transparent Background:** 0 opacity backgrounds for interactive elements
- **Disabled Input Background:** #F0F0F0 (equivalent to ~90% opacity white on neutral background)

### Z-index / Layering

- **Base (1):** Standard content, cards, sections
- **Elevated (2–3):** Floating elements, tooltips, minor overlays
- **Sticky (9):** Sticky header, fixed navigation elements not requiring modal priority
- **Dropdown/Popover (99):** Dropdown menus, contextual popovers, position-relative overlays
- **Sticky Navigation (100):** Primary sticky navigation bar, maintained above most content
- **Modal/Overlay (1000):** Modal dialogs, full-screen overlays, maximum visual priority

## 7. Do's and Don'ts

### Do
- **Use `#FFB606` consistently** for all primary calls-to-action, buttons, and interactive highlights across the institution
- **Maintain `#002147` as the dominant structural color** for headers, navigation, and major containers—it anchors the institutional brand
- **Follow the spacing scale rigorously:** Always use values from the 4px base unit scale (8px, 12px, 16px, 20px, 24px, 32px, 36px, 52px, 60px, 64px, 136px, 196px) to ensure consistency
- **Prioritize readability:** Use `#333333` for body text (14px–18px), `#666666` for secondary text, and maintain minimum 1.5 line-height ratio for all text
- **Apply shadows subtly:** Use the designated shadow levels only (no custom shadow values); graduated shadow depth indicates elevation hierarchy
- **Nest interaction states logically:** Hover → Active → Disabled progression with clear visual distinction at each stage
- **Test multicolor text rendering:** Ensure both English and Bengali text render clearly, maintaining line-height and letter-spacing consistency
- **Use border-radius consistently:** Stick to 3px, 4px, 8px, or 30px—no intermediate values
- **Maintain button hierarchy:** Primary buttons use `#FFB606` with border, secondary buttons use text-only styling, tertiary buttons use icons with minimal visual weight

### Don't
- **Introduce new colors outside the palette:** The system contains only 12 colors by design—custom colors break consistency and accessibility
- **Mix font families:** Poppins is the single font family throughout—no serif fonts, script fonts, or system fallbacks except for monospace code
- **Deviate from typography sizes:** Only use the specified hierarchy (12px, 14px, 18px, 24px, 30px); intermediate sizes fragment visual consistency
- **Create arbitrary spacing:** Do not use spacing values outside the scale; this breaks rhythm and grid alignment
- **Stack shadows:** Never combine multiple box-shadows; use only the designated elevation levels
- **Overuse the golden accent:** `#FFB606` is reserved for interactive elements and highlights—don't use it for passive backgrounds or large blocks
- **Neglect contrast ratios:** Ensure 4.5:1 minimum contrast for body text on all backgrounds; test with WCAG AA standards
- **Create rounded corners outside the scale:** Border-radius must be 3px, 4px, 8px, or 30px—no custom values like 5px, 6px, or 12px
- **Place text directly on images without overlay:** Always apply semi-transparent dark overlay (`rgba(0, 33, 71, 0.5)`) behind text on photographic backgrounds
- **Use more than 2 font weights per line:** Mix only 400 (regular) with 600 or 700 (bold); avoid weight changes within a single text block

## 8. Responsive Behavior

### Breakpoints

| Breakpoint | Width | Key Changes |
|------------|-------|-------------|
| **Mobile** | < 640px | Single column layout, full-width containers, stacked navigation, reduced padding (16px–20px) |
| **Tablet** | 640px–1024px | Two-column grid, compact navigation drawer, moderate padding (20px–32px), adjusted font sizes (14px body base) |
| **Desktop** | 1024px–1440px | Full 12-column grid, expanded navigation, standard padding (36px), full typography scale |
| **Large Desktop** | > 1440px | Bounded 1440px container, centered layout, maximum spacing (60px–64px) |

**Navigation Changes:**
- **Mobile:** Hamburger menu (collapsible), stacked links, top bar only
- **Tablet:** Horizontal menu with dropdown support, reduced font sizes (12px for nav items)
- **Desktop:** Full horizontal navigation, dropdowns on hover, 14px nav font

**Typography Scaling:**
- **Mobile:** Body 16px, headings 20px–24px
- **Tablet:** Body 16px, headings 22px–28px
- **Desktop:** Body 18px, headings 24px–30px

### Touch Targets

- **Minimum button size:** 44px × 44px (comfortable tap target for mobile devices)
- **Navigation link tap area:** 44px height minimum, 16px horizontal padding
- **Form inputs:** 44px minimum height (34px specified, add 5px padding top/bottom)
- **Icon buttons:** 40px × 40px minimum
- **Checkbox/radio:** 24px × 24px with 12px padding around
- **Spacing between touch targets:** Minimum 8px to prevent accidental interaction

### Collapsing Strategy

**Header/Navigation:**
- Desktop: Horizontal navbar with submenus (110px height); at tablet width, convert to horizontal with drawer menu; at mobile, collapse to hamburger with full-screen overlay menu

**Cards:**
- Desktop: 3–4 cards per row (12-column grid); tablet: 2 cards per row (6 columns); mobile: single column full-width

**Typography:**
- Desktop: Full hierarchy preserved (12px–30px range); tablet: compress secondary sizes (12px → 11px, 14px stays); mobile: reduce display sizes (30px → 24px, 24px → 20px)

**Padding/Margins:**
- Desktop: 36px–60px section padding; tablet: 24px section padding; mobile: 16px section padding, compact inter-element spacing

**Images/Media:**
- Desktop: Full aspect ratio, max 100% width within container; tablet/mobile: 100% width of container, aspect ratio maintained

**Button States:**
- Desktop: Hover states on interactive elements; mobile: remove hover states (not applicable to touch), enhance active/focus states for clarity

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA:** Golden Amber (`#FFB606`) — Use for buttons, active links, and interactive highlights
- **Primary Navigation/Structure:** Navy Blue (`#002147`) — Use for headers, navigation bars, and dominant container backgrounds
- **Body Text:** Dark Gray (`#333333`) — Primary text content
- **Secondary Text:** Medium Gray (`#666666`) — Metadata, helper text, secondary navigation
- **Background/Surfaces:** Pure White (`#FFFFFF`) — Card backgrounds, input fields, content containers
- **Subtle Backgrounds:** Off-White (`#F7F7F7`) — Section backgrounds, subtle differentiation
- **Accent/Links:** Sky Blue (`#428BCA`) — Secondary links, hover states, focus indicators
- **Error/Alert:** Error Red (`#FF0000`) — Validation errors and critical alerts
- **Borders:** Border Gray (`#E7E7E7`) — Dividers, table lines, subtle borders
- **Disabled/Muted:** Light Gray (`#777777`) — Disabled text, reduced-emphasis elements

### Iteration Guide

1. **Always use Poppins font family** with fallback to Open Sans; maintain the specified font sizes and weights exactly (12px, 14px, 18px, 24px, 30px with 400, 500, 600, 700 weights only)

2. **Apply spacing from the 4px scale exclusively:** 8px, 12px, 16px, 20px, 24px, 32px, 36px, 52px, 60px, 64px, 136px, 196px—no arbitrary values

3. **Implement button hierarchy with three distinct styles:** (a) Primary action: `#FFB606` background, `#002147` text, 2px border, 3px radius; (b) Secondary: transparent background, inherited text color, 4px radius; (c) Tertiary: text-only with icon support, no visible background or border

4. **Use the Navy Blue (`#002147`) as the structural foundation** for all major navigation, headers, and container backgrounds—it should dominate the layout hierarchy

5. **Apply elevation via box-shadow only, never through borders or color:** Use designated shadow values (0px 1px 3px, 0px 4px 12px, 0px 5px 50px rgba(0,0,0,0.15), 0px 8px 25px) to create depth without additional visual elements

6. **Maintain contrast ratios above 4.5:1** for all text content (WCAG AA compliance); use `#333333` on white, `#666666` on white, `#002147` on white—these pairs are pre-tested

7. **Implement responsive layouts using 12-column grid:** Mobile (single column), tablet (6-column/2-column), desktop (12-column full spread)—adjust container max-width to 1440px only on desktop, remove on mobile/tablet

8. **Golden Amber (`#FFB606`) is reserved exclusively for interactive elements:** Buttons, active links, hover highlights, attention-drawing badges—never use for passive backgrounds or large blocks of color

9. **Support multilingual content:** Ensure 1.5–1.8 line-height ratio for all text, maintain consistent letterspacing (0px standard), test both English and Bengali text rendering

10. **Border-radius values are fixed to four options:** 3px (buttons), 4px (inputs/nav items), 8px (cards/containers), 30px (fully rounded accents)—do not use intermediate values like 5px, 6px, or 12px
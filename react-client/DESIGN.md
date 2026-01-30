# Sui DCA Design System

A refined, institutional fintech design system inspired by Ondo Finance. Light theme with elegant serif typography balanced by modern sans-serif UI elements.

## Design Principles

| Principle | Description |
|-----------|-------------|
| **Trust** | Professional, institutional aesthetic that builds confidence |
| **Clarity** | Clean layouts with generous whitespace for financial data |
| **Elegance** | Refined serif typography balanced with modern sans-serif |
| **Openness** | Transparent, approachable despite institutional positioning |

## Typography

### Font Families

| Family | Font | Usage |
|--------|------|-------|
| **Serif** | Cormorant Garamond | Headings, display text, hero sections |
| **Sans** | Inter | Body text, UI elements, labels |
| **Mono** | JetBrains Mono | Code, addresses, numbers, financial data |

### Type Scale

| Name | Size | Line Height | Usage |
|------|------|-------------|-------|
| `display` | 4rem (64px) | 1.1 | Hero headlines |
| `h1` | 3rem (48px) | 1.15 | Page titles |
| `h2` | 2.25rem (36px) | 1.2 | Section headings |
| `h3` | 1.5rem (24px) | 1.3 | Card titles |
| `h4` | 1.25rem (20px) | 1.4 | Subsection headings |
| `body-lg` | 1.125rem (18px) | 1.6 | Lead paragraphs |
| `body` | 1rem (16px) | 1.6 | Body text |
| `body-sm` | 0.875rem (14px) | 1.5 | Secondary text |
| `caption` | 0.75rem (12px) | 1.4 | Labels, hints |
| `overline` | 0.75rem (12px) | 1.4 | Section labels (uppercase) |

## Colors

### Semantic Tokens

```
Background
├── primary:   #FFFFFF  (main background)
├── secondary: #FAFAFA  (cards, elevated surfaces)
├── tertiary:  #F5F5F5  (inputs, hover states)
└── inverse:   #0A0A0A  (dark backgrounds)

Foreground
├── primary:   #0A0A0A  (headings, primary text)
├── secondary: #404040  (body text)
├── tertiary:  #737373  (secondary text)
├── muted:     #A3A3A3  (placeholders, disabled)
└── inverse:   #FFFFFF  (text on dark backgrounds)

Border
├── default:   #E5E5E5  (standard borders)
├── subtle:    #F0F0F0  (dividers)
└── strong:    #D4D4D4  (emphasized borders)

Accent
├── primary:   #0A0A0A  (buttons, links)
├── hover:     #262626  (hover states)
└── subtle:    #F5F5F5  (subtle highlights)

Status
├── success:   #166534 / #F0FDF4  (text / background)
├── error:     #991B1B / #FEF2F2
├── warning:   #92400E / #FFFBEB
└── info:      #1E40AF / #EFF6FF
```

## Components

### Buttons

```jsx
// Primary - main actions
<button className="btn-primary">Create DCA</button>

// Secondary - secondary actions
<button className="btn-secondary">Cancel</button>

// Ghost - tertiary actions
<button className="btn-ghost">Learn More</button>
```

### Cards

```jsx
<div className="card">
  <h3 className="text-h3 font-serif">Card Title</h3>
  <p className="text-body text-foreground-secondary">Content</p>
</div>
```

### Inputs

```jsx
<input
  type="text"
  className="input w-full"
  placeholder="Enter amount"
/>
```

### Badges

```jsx
<span className="badge badge-success">Active</span>
<span className="badge badge-error">Failed</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-info">Processing</span>
```

## Layout Guidelines

### Spacing

Use Tailwind's spacing scale (4px base):
- `gap-2` (8px) - tight spacing
- `gap-4` (16px) - default spacing
- `gap-6` (24px) - section spacing
- `gap-8` (32px) - large section spacing

### Border Radius

- `rounded-sm` (4px) - small elements
- `rounded-md` (8px) - buttons, inputs
- `rounded-lg` (12px) - small cards
- `rounded-xl` (16px) - cards, modals
- `rounded-2xl` (24px) - large cards

### Shadows

Use sparingly for elevation:
- `shadow-sm` - subtle depth
- `shadow-md` - cards
- `shadow-lg` - dropdowns, modals
- `shadow-xl` - large modals

## Financial Data Display

For numbers and financial data, use monospace font:

```jsx
<span className="font-mono tabular-nums">
  {balance.toLocaleString()} SUI
</span>
```

## Animation

Keep animations subtle and fast:
- Duration: 150-200ms
- Easing: `ease-out` for entrances, `ease-in-out` for state changes

```jsx
<div className="animate-fade-in">Content</div>
<div className="transition-colors duration-150">Hover me</div>
```

## Accessibility

- Maintain WCAG 2.1 AA contrast ratios
- All interactive elements have visible focus states
- Use semantic HTML elements
- Provide alt text for images
- Support keyboard navigation

## File Structure

```
src/
├── index.css          # Global styles, CSS variables, component classes
├── design-system.json # Token definitions (source of truth)
└── tailwind.config.js # Tailwind theme configuration
```

# UI Component Guidelines

This document defines the standard usage and rules for all UI components in the project. All developers and AI code generation must follow these guidelines to ensure consistency, maintainability, and scalability of the UI/UX.

---

## 1. Component Usage Principles

- **Always use components from `@/components/ui` for all UI elements** (inputs, buttons, modals, tables, etc.).
- **Do not create custom HTML or duplicate UI logic** for elements that already have a component in this folder.
- **If a new UI pattern is needed, add a new component to `@/components/ui` first, then use it.**
- **Customize via props, className, or variants** provided by the component. Do not override styles with external CSS unless absolutely necessary.
- **All components are designed for accessibility, responsiveness, dark mode, and animation.**

---

## 2. Component Categories & Examples

### Form Controls
- `Input`, `Textarea`, `Checkbox`, `Switch`, `Select`, `Label`, `Skeleton`
- Use these for all forms and data entry.

### Navigation & Layout
- `Tabs`, `Pagination`, `Breadcrumb`, `Sidebar`, `Separator`
- Use for navigation, page structure, and dividing content.

### Overlay & Popup
- `Dialog`, `AlertDialog`, `Sheet`, `DropdownMenu`, `Tooltip`, `Sonner (Toaster)`
- Use for modals, popups, notifications, and tooltips.

### Data Display
- `Table`, `Card`, `Badge`, `Progress`, `Avatar`, `Chart`
- Use for displaying data, status, and visualizations.

### Utility
- `Resizable`, `ScrollArea`
- Use for advanced layouts and scrollable areas.

---

## 3. General Rules

- **Never use raw HTML for UI elements that have a component.**
- **If you need to extend or modify a component, do it inside `@/components/ui` and document the change.**
- **All new UI code (manual or AI-generated) must import and use these components.**
- **If a component does not exist for your use case, create it in `@/components/ui` first.**
- **Use provided props, slots, and variants for customization.**
- **Do not override component styles with global CSS.**

---

## 4. Accessibility & Theming

- All components are built with accessibility and theming in mind.
- Use `className` and variant props for theming and custom styles.
- Do not break accessibility by removing ARIA attributes or keyboard navigation.

---

## 5. Contribution & Extension

- When adding a new component, follow the code style and structure of existing components.
- Document new components and their props clearly in code and update this guideline if needed.
- Prefer composition and reusability.

---

## 6. Example

```tsx
import { Input, Button, Dialog } from "@/components/ui";

function ExampleForm() {
  return (
    <Dialog>
      <form>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" />
        <Button type="submit">Submit</Button>
      </form>
    </Dialog>
  );
}
```

---

## 7. Enforcement

- All code reviews and AI code generation must check for compliance with these guidelines.
- If you find code that does not follow these rules, refactor it to use the standard components.

---

**This document is the single source of truth for UI component usage in this project.** 
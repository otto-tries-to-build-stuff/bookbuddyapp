

# Render Table of Contents as Plain Text

## Overview
Replace the numbered list (with circled numbers) in the Table of Contents section with a simple plain text block. The AI response will be displayed as-is, preserving any natural formatting (numbering, parts, sections) the model includes.

## Changes

**File: `src/pages/BookDetail.tsx`**

Replace the current `<ol>` with numbered circle badges:
```
<ol className="space-y-2">
  {book.table_of_contents.map((chapter, i) => (
    <li key={i} className="flex gap-3">
      <span className="...rounded-full...">{i + 1}</span>
      <span>...</span>
    </li>
  ))}
</ol>
```

With a simple pre-formatted text block (same style as the Summary section):
```
<p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
  {book.table_of_contents.join("\n")}
</p>
```

This joins the array back into a newline-separated string and renders it exactly as the AI returned it -- no extra numbering or styling added by the UI.

No backend or prompt changes required.


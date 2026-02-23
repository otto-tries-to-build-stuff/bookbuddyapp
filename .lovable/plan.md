
## Make the 3-Dot Menu Always Visible

### What Changes

The chat item's 3-dot menu button will always be visible instead of only appearing on hover. This makes it accessible on all devices including touch/mobile.

### Technical Details

**File: `src/components/ChatSidebar.tsx` (line 237)**

Remove `opacity-0 group-hover:opacity-100 transition-opacity` from the menu button's class list so it is always rendered at full opacity.

Before:
```
className="absolute right-1 top-1/2 -translate-y-1/2 shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-secondary transition-opacity"
```

After:
```
className="absolute right-1 top-1/2 -translate-y-1/2 shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary"
```

One file, one line change.

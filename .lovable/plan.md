

## Avatar Crop & Position Adjustment

When the user selects a new profile photo, instead of uploading immediately, we'll show a **dialog with an interactive cropper** that lets them pan and zoom the image within a circular frame before confirming.

### Approach

1. **New component: `AvatarCropDialog.tsx`**
   - Opens as a Dialog when a file is selected
   - Displays the selected image in a draggable/zoomable container
   - Circular crop mask overlay (CSS-based)
   - Zoom slider control
   - Pan by click-and-drag on the image
   - "Cancel" and "Confirm" buttons
   - On confirm, uses an off-screen `<canvas>` to crop the visible area into a square image, converts to a Blob, and returns it

2. **Update `Profile.tsx`**
   - `handleFileChange` no longer uploads immediately — instead stores the raw file in state and opens the crop dialog
   - On dialog confirm, receives the cropped Blob, wraps it as a File, and passes it to the existing `avatarMutation`
   - On cancel, clears the file state

3. **No new dependencies** — built with native browser APIs:
   - `<canvas>` for cropping
   - CSS `object-fit` + `transform: translate/scale` for pan/zoom
   - Pointer events for drag interaction
   - Radix Dialog (already installed) for the modal

### Crop Dialog UX
- Image fills the dialog with a **circular semi-transparent mask** showing the crop area
- **Zoom**: slider at the bottom (1x–3x)
- **Pan**: click and drag the image
- Output: 400×400px square PNG cropped from the visible circle area


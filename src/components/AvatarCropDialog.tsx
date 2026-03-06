import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn } from "lucide-react";

interface AvatarCropDialogProps {
  file: File | null;
  open: boolean;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
}

const CROP_SIZE = 400;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

const AvatarCropDialog = ({ file, open, onConfirm, onCancel }: AvatarCropDialogProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Create object URL when file changes
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(null);
    }
  }, [file]);

  const handleImageLoad = () => {
    if (imgRef.current) {
      setImgNaturalSize({
        w: imgRef.current.naturalWidth,
        h: imgRef.current.naturalHeight,
      });
    }
  };

  // Clamp offset so image can't be dragged out of the crop circle
  const clampOffset = useCallback(
    (x: number, y: number, currentZoom: number) => {
      const container = containerRef.current;
      if (!container) return { x, y };
      const containerSize = container.clientWidth;
      // The image is scaled to cover the container, then zoomed
      // Max pan = how far the image extends beyond the container
      const maxPan = (containerSize * (currentZoom - 1)) / 2;
      return {
        x: Math.max(-maxPan, Math.min(maxPan, x)),
        y: Math.max(-maxPan, Math.min(maxPan, y)),
      };
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setOffset(clampOffset(newX, newY, zoom));
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const handleZoomChange = (value: number[]) => {
    const newZoom = value[0];
    setZoom(newZoom);
    // Re-clamp offset at new zoom level
    setOffset((prev) => clampOffset(prev.x, prev.y, newZoom));
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !containerRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    const containerSize = container.clientWidth;

    const img = imgRef.current;
    const { naturalWidth, naturalHeight } = img;

    // The image is displayed with object-fit: cover behavior
    // Calculate how the image maps to the container
    const imgAspect = naturalWidth / naturalHeight;
    let renderedW: number, renderedH: number;
    if (imgAspect > 1) {
      // Landscape: height fits, width overflows
      renderedH = containerSize;
      renderedW = containerSize * imgAspect;
    } else {
      // Portrait: width fits, height overflows
      renderedW = containerSize;
      renderedH = containerSize / imgAspect;
    }

    // Apply zoom
    renderedW *= zoom;
    renderedH *= zoom;

    // Center of container = center of crop
    // Image is drawn centered, then offset
    const drawX = (containerSize - renderedW) / 2 + offset.x;
    const drawY = (containerSize - renderedH) / 2 + offset.y;

    // Scale factor from rendered to natural
    const scaleX = naturalWidth / renderedW;
    const scaleY = naturalHeight / renderedH;

    // Crop area in rendered coords is the container itself (0, 0, containerSize, containerSize)
    // In natural coords:
    const srcX = (0 - drawX) * scaleX;
    const srcY = (0 - drawY) * scaleY;
    const srcW = containerSize * scaleX;
    const srcH = containerSize * scaleY;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, CROP_SIZE, CROP_SIZE);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], "avatar.png", { type: "image/png" });
          onConfirm(croppedFile);
        }
      },
      "image/png",
      1
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust photo</DialogTitle>
          <DialogDescription>
            Drag to reposition and use the slider to zoom.
          </DialogDescription>
        </DialogHeader>

        {/* Crop area */}
        <div className="flex flex-col items-center gap-4">
          <div
            ref={containerRef}
            className="relative h-64 w-64 overflow-hidden rounded-full border-2 border-border bg-muted cursor-grab active:cursor-grabbing select-none touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {imageUrl && (
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop preview"
                onLoad={handleImageLoad}
                draggable={false}
                className="pointer-events-none absolute h-full w-full object-cover"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                }}
              />
            )}
          </div>

          {/* Zoom slider */}
          <div className="flex w-full max-w-[256px] items-center gap-3">
            <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Slider
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.05}
              value={[zoom]}
              onValueChange={handleZoomChange}
              className="flex-1"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropDialog;

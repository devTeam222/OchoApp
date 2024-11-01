import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Minus, Plus, RotateCcw } from "lucide-react";

interface ZoomableComponentProps {
  children: React.ReactNode;
  zoomable?: boolean;
  clasName?: string;
}

export default function ZoomableComponent({
  children,
  zoomable = true,
  clasName,
}: ZoomableComponentProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startPoint = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const initialDistance = useRef(0); // To store initial distance between touches

  const handleWheelZoom = (e: WheelEvent) => {
    if (!zoomable) return;
    e.preventDefault(); // Prevent page scrolling
    const zoomStep = 0.1;
    setScale((prevScale) =>
      Math.max(1, Math.min(5, prevScale + (e.deltaY > 0 ? -zoomStep : zoomStep)))
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Calculate the initial distance between the two touches
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      initialDistance.current = dist; // Store the initial distance
    } else if (e.touches.length === 1) {
      handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );

      const zoomFactor = 0.01; // Adjust this factor for sensitivity
      const scaleChange = dist - initialDistance.current; // Change in distance
      setScale((prevScale) =>
        Math.max(1, Math.min(5, prevScale + scaleChange * zoomFactor)) // Limit to 10
      );

      initialDistance.current = dist;
    } else if (e.touches.length === 1) {
      handleDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) =>
    handleStartDrag(e.clientX, e.clientY);
  const handleMouseMove = (e: React.MouseEvent) =>
    handleDrag(e.clientX, e.clientY);
  const handleMouseUp = () => setDragging(false);

  const handleStartDrag = (x: number, y: number) => {
    if (!zoomable || scale <= 1) return;
    setDragging(true);
    startPoint.current = { x: x - translate.x, y: y - translate.y };
  };

  const handleDrag = (x: number, y: number) => {
    if (!dragging || !zoomable || scale <= 1 || !containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const element =
      containerRef.current.firstElementChild?.getBoundingClientRect();

    if (element) {
      const newX = x - startPoint.current.x;
      const newY = y - startPoint.current.y;

      // Calculate the visible boundaries based on the current scale
      const visibleWidth = container.width;
      const visibleHeight = container.height;

      // Calculate the effective dimensions of the element considering the scale
      const effectiveWidth = element.width * scale;
      const effectiveHeight = element.height * scale;

      // Calculate the limits for translation
      const minX = Math.min(0, visibleWidth - effectiveWidth); // Right edge
      const maxX = effectiveWidth; // Left edge
      const minY = Math.min(0, visibleHeight - effectiveHeight); // Bottom edge
      const maxY = effectiveHeight; // Top edge

      // Constrain new translate values within the limits
      const constrainedX = Math.min(maxX, Math.max(minX, newX));
      const constrainedY = Math.min(maxY, Math.max(minY, newY));

      setTranslate({ x: constrainedX, y: constrainedY });
    }
  };

  const handleTouchEnd = () => setDragging(false);

  const zoomIn = () => {
    if (zoomable) setScale((prevScale) => Math.min(5, prevScale + 0.5));
  };

  const zoomOut = () => {
    if (zoomable && scale > 1)
      setScale((prevScale) => Math.max(1, prevScale - 0.5));
  };

  const resetZoom = ()=>scale !== 1 && setScale(1);

  useEffect(() => {
    if (!zoomable || scale <= 1) {
      setTranslate({ x: 0, y: 0 });
      setScale(1);
    }
  }, [scale, zoomable]);

  useEffect(() => {
    const container = containerRef.current;

    if (container) {
      // Use addEventListener for the wheel event
      container.addEventListener("wheel", handleWheelZoom, { passive: false });

      // Cleanup the event listener on unmount
      return () => {
        container.removeEventListener("wheel", handleWheelZoom);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomable]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative select-none overflow-hidden bg-background",
        clasName,
      )}
    >
      <div
        className={cn(
          zoomable && scale > 1 && "cursor-grab",
          "h-full w-full transition-transform duration-150",
        )}
        draggable
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transition: "transform 0.1s ease-out",
        }}
      >
        {children}
      </div>
      {zoomable && (
        <div className="absolute bottom-16 right-4 flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={resetZoom}
            title="Reinitialiser"
            disabled={scale === 1}
          >
            <RotateCcw />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={zoomOut}
            title="Réduire"
            disabled={scale <= 1}
          >
            <Minus />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={zoomIn}
            title="Agrandir"
            disabled={scale >= 5}
          >
            <Plus />
          </Button>
        </div>
      )}
    </div>
  );
}

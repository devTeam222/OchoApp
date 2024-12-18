import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DraggableProps {
  draggable?: boolean;
  children: React.ReactNode;
  direction: "left" | "right" | "up" | "down";
  onDrag: (distance: number) => void;
  className?: string;
  contentClassName?: string;
}

export default function Draggable({
  draggable = true,
  children,
  direction,
  onDrag,
  className,
  contentClassName,
}: DraggableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const startPoint = useRef({ x: 0, y: 0 });
  const dragThreshold = 50; // Threshold to trigger `onDrag`

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable) return;
    setDragging(true);
    startPoint.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    if (!draggable) return;

    const deltaX = e.clientX - startPoint.current.x;
    const deltaY = e.clientY - startPoint.current.y;

    setTranslate((prev) => {
      const newTranslate = { ...prev };

      if (direction === "left" || direction === "right") {
        newTranslate.x = direction === "left" ? Math.min(deltaX, 0) : Math.max(deltaX, 0);
        newTranslate.y = 0; // Lock vertical movement
      } else if (direction === "up" || direction === "down") {
        newTranslate.y = direction === "up" ? Math.min(deltaY, 0) : Math.max(deltaY, 0);
        newTranslate.x = 0; // Lock horizontal movement
      }

      return newTranslate;
    });
  };

  const handleMouseUp = () => {
    setDragging(false);

    const draggedDistance = Math.abs(
      direction === "left" || direction === "right" ? translate.x : translate.y
    );

    // Trigger callback if threshold is reached
    if (draggedDistance >= dragThreshold) {
      onDrag(draggedDistance);
    }

    // Reset position
    setTranslate({ x: 0, y: 0 });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!draggable) return;
    const touch = e.touches[0];
    setDragging(true);
    startPoint.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggable) return;
    if (!dragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPoint.current.x;
    const deltaY = touch.clientY - startPoint.current.y;

    setTranslate((prev) => {
      const newTranslate = { ...prev };

      if (direction === "left" || direction === "right") {
        newTranslate.x = direction === "left" ? Math.min(deltaX, 0) : Math.max(deltaX, 0);
        newTranslate.y = 0; // Lock vertical movement
      } else if (direction === "up" || direction === "down") {
        newTranslate.y = direction === "up" ? Math.min(deltaY, 0) : Math.max(deltaY, 0);
        newTranslate.x = 0; // Lock horizontal movement
      }

      return newTranslate;
    });
  };

  const handleTouchEnd = () => {
    handleMouseUp(); // Use the same logic as mouse events
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={cn("transition-transform duration-200 ease-out select-none overflow-auto w-full h-full", contentClassName)}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px)`,
          cursor: draggable ? (dragging ? "grabbing" : "grab") : "default",
        }}
      >
        {children}
      </div>
    </div>
  );
}

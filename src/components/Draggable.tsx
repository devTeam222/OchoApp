/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useRef, useState } from "react";
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
  // const containerRef = useRef<HTMLDivElement>(null);
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
    if (!dragging || !draggable) return;

    e.preventDefault(); // Empêche le comportement par défaut
    const deltaX = e.clientX - startPoint.current.x;
    const deltaY = e.clientY - startPoint.current.y;

    setTranslate((prev) => {
      const newTranslate = { ...prev };

      if (direction === "left" || direction === "right") {
        newTranslate.x =
          direction === "left" ? Math.min(deltaX, 0) : Math.max(deltaX, 0);
        newTranslate.y = 0; // Lock vertical movement
      } else if (direction === "up" || direction === "down") {
        newTranslate.y =
          direction === "up" ? Math.min(deltaY, 0) : Math.max(deltaY, 0);
        newTranslate.x = 0; // Lock horizontal movement
      }

      return newTranslate;
    });
  };

  const handleMouseUp = () => {
    if (!dragging) return;

    setDragging(false);
    const draggedDistance = Math.abs(
      direction === "left" || direction === "right" ? translate.x : translate.y,
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
    if (!dragging || !draggable) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPoint.current.x;
    const deltaY = touch.clientY - startPoint.current.y;

    // Vérification des limites de défilement de l'élément concerné
    const container = e.currentTarget as HTMLElement;
    const canScrollVertically = container.scrollHeight > container.clientHeight;
    const canScrollHorizontally = container.scrollWidth > container.clientWidth;

    const atTop = canScrollVertically && container.scrollTop === 0;
    const atBottom =
      canScrollVertically &&
      container.scrollHeight === container.scrollTop + container.clientHeight;
    const atLeft = canScrollHorizontally && container.scrollLeft === 0;
    const atRight =
      canScrollHorizontally &&
      container.scrollWidth === container.scrollLeft + container.clientWidth;

    // Bloque le comportement par défaut si la limite est atteinte
    if (
      e.cancelable &&
      ((canScrollVertically && (atTop || atBottom)) ||
        (canScrollHorizontally && (atLeft || atRight)))
    ) {
      e.preventDefault(); // Empêche le comportement de défilement uniquement si la limite est atteinte
    } else {
      setTranslate((prev) => {
        const newTranslate = { ...prev };

        if (direction === "left" || direction === "right") {
          newTranslate.x =
            direction === "left" ? Math.min(deltaX, 0) : Math.max(deltaX, 0);
          newTranslate.y = 0; // Lock vertical movement
        } else if (direction === "up" || direction === "down") {
          newTranslate.y =
            direction === "up" ? Math.min(deltaY, 0) : Math.max(deltaY, 0);
          newTranslate.x = 0; // Lock horizontal movement
        }

        return newTranslate;
      });
    }
  };

  const handleTouchEnd = () => {
    handleMouseUp(); // Use the same logic as mouse events
  };

  // Add event listeners
  const containerRef = useCallback(
    (node: any) => {
      if (node == null) return;

      // Mouse events
      node.addEventListener("mousedown", handleMouseDown);
      node.addEventListener("mousemove", handleMouseMove);
      node.addEventListener("mouseup", handleMouseUp);
      node.addEventListener("mouseleave", handleMouseUp);

      // Touch events
      node.addEventListener("touchstart", handleTouchStart);
      node.addEventListener("touchmove", handleTouchMove, { passive: false });
      node.addEventListener("touchend", handleTouchEnd);
    },
    [
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    ],
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
    >
      <div
        className={cn(
          "h-full w-full select-none transition-transform duration-200 ease-out",
          contentClassName,
        )}
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

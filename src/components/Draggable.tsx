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

  const findScrollableElement = (element: HTMLElement): HTMLElement | null => {
    // Si l'élément est défilable, on le retourne
    if (
      (element.scrollHeight > element.clientHeight ||
        element.scrollWidth > element.clientWidth) &&
      getComputedStyle(element).overflow !== "hidden"
    ) {
      return element;
    }

    // Sinon, on cherche récursivement dans les enfants
    for (let child of element.children) {
      const scrollableChild = findScrollableElement(child as HTMLElement);
      if (scrollableChild) {
        return scrollableChild;
      }
    }

    return null; // Aucun élément défilable trouvé
  };

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

    const container = e.currentTarget as HTMLElement;

    // Trouver l'élément défilable dans le conteneur (y compris les enfants)
    const scrollableElement = findScrollableElement(container);

    if (scrollableElement) {
      console.table({
        scrollLeft: scrollableElement.scrollLeft,
        scrollWidth: scrollableElement.scrollWidth,
        clientWidth: scrollableElement.clientWidth,
        scrollTop: scrollableElement.scrollTop,
        scrollHeight: scrollableElement.scrollHeight,
        clientHeight: scrollableElement.clientHeight,
      });

      let canScroll = false;

      // Déterminer la direction du mouvement (horizontal ou vertical)
      const isHorizontalMove = Math.abs(deltaX) > Math.abs(deltaY); // Si le mouvement horizontal est plus grand, c'est un déplacement horizontal
      const isVerticalMove = !isHorizontalMove; // Sinon, c'est un déplacement vertical

      // Vérification du défilement en fonction de la direction du mouvement
      if (isHorizontalMove) {
        // Vérifier si l'élément peut défiler horizontalement (gauche/droite)
        const canScrollLeft = scrollableElement.scrollLeft > 0;
        const canScrollRight =
          scrollableElement.scrollWidth - scrollableElement.clientWidth >
          scrollableElement.scrollLeft;

        // Déterminer si on peut défiler dans la direction du mouvement horizontal
        canScroll = deltaX < 0 ? canScrollLeft : canScrollRight;
      } else if (isVerticalMove) {
        // Vérifier si l'élément peut défiler verticalement (haut/bas)
        const canScrollUp = scrollableElement.scrollTop > 0;
        const canScrollDown =
          scrollableElement.scrollHeight - scrollableElement.clientHeight >
          scrollableElement.scrollTop;

        // Déterminer si on peut défiler dans la direction du mouvement vertical
        canScroll = deltaY < 0 ? canScrollUp : canScrollDown;
      }

      return; // Si on peut encore défiler, on ne fait rien de plus ici
    }
    e.preventDefault(); // Empêcher le défilement si l'élément ne peut plus défiler

    setTranslate((prev) => {
      const newTranslate = { ...prev };

      // Appliquer le translate en fonction de la direction du drag
      if (direction === "left" || direction === "right") {
        newTranslate.x =
          direction === "left" ? Math.min(deltaX, 0) : Math.max(deltaX, 0);
        newTranslate.y = 0; // Verrouille le mouvement vertical
      } else if (direction === "up" || direction === "down") {
        newTranslate.y =
          direction === "up" ? Math.min(deltaY, 0) : Math.max(deltaY, 0);
        newTranslate.x = 0; // Verrouille le mouvement horizontal
      }

      return newTranslate;
    });
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

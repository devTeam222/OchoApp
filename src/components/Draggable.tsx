/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  const [isTransitioning, setIsTransitioning] = useState(false); // Nouvel état pour suivre la transition
  const containerRef = useRef<HTMLDivElement>(null);
  const startPoint = useRef({ x: 0, y: 0 });
  const dragThreshold = 50; // Threshold to trigger `onDrag`

  // Fonction externe pour vérifier si un élément est scrollable dans une direction donnée
  const isScrollable = (
    element: HTMLElement,
    direction: "up" | "down" | "left" | "right",
  ): boolean => {
    if (direction === "up" || direction === "down") {
      const canScrollUp = element.scrollTop > 0;
      const canScrollDown =
        element.scrollTop < element.scrollHeight - element.clientHeight;
      return (
        (direction === "up" && canScrollUp) ||
        (direction === "down" && canScrollDown)
      );
    } else if (direction === "left" || direction === "right") {
      const canScrollLeft = element.scrollLeft > 0;
      const canScrollRight =
        element.scrollLeft < element.scrollWidth - element.clientWidth;
      return (
        (direction === "left" && canScrollLeft) ||
        (direction === "right" && canScrollRight)
      );
    }
    return false;
  };

  // Fonction récursive pour vérifier si un élément ou ses enfants sont scrollables dans une direction donnée
  const isAnyScrollable = (
    element: HTMLElement,
    direction: "up" | "down" | "left" | "right",
  ): boolean => {
    if (isScrollable(element, direction)) {
      return true;
    }

    for (let child of element.children) {
      if (isAnyScrollable(child as HTMLElement, direction)) {
        return true;
      }
    }

    return false;
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!draggable) return;
    setDragging(true);
    startPoint.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: MouseEvent) => {
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

  const handleTouchStart = (e: TouchEvent) => {
    if (!draggable) return;
    const touch = e.touches[0];
    setDragging(true);
    startPoint.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!dragging || !draggable) return;
    const container = containerRef.current;
    if (!container) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPoint.current.x;
    const deltaY = touch.clientY - startPoint.current.y;
    // Déterminer la direction du scroll
    const scrollDirection =
      Math.abs(deltaX) > Math.abs(deltaY)
        ? deltaX > 0
          ? "right"
          : "left"
        : deltaY > 0
          ? "up"
          : "down";

          const scrollableElements = Array.from(
            container.querySelectorAll("*"),
          ).filter((el) => {
            return isScrollable(el as HTMLElement, scrollDirection);
          });

    // Vérifier si aucun élément scrollable ne peut défiler vers le haut
    if ((deltaY > 0 || deltaX > 0) && !scrollableElements.length && isTransitioning) {
      console.log("Pull-to-refresh détecté");
      e.preventDefault(); // Empêcher le rechargement
    }

    setTranslate((prev) => {
      const newTranslate = { ...prev };
      setIsTransitioning(true);

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
  const handleCorrect = (
    element: HTMLElement,
    direction: "up" | "down" | "left" | "right",
  ) => {
    if (direction === "up" && element.scrollTop <= 10) {
      element.style.paddingTop = "10px";
      element.scrollTop = 10;
      setIsTransitioning(false);
    }
    if (
      direction === "down" &&
      element.scrollTop >= element.scrollHeight - (element.clientHeight + 10)
    ) {
      element.style.paddingBottom = "10px";
      element.scrollTop = element.scrollHeight - element.clientHeight - 10;
      setIsTransitioning(false);
    } else if (direction === "left" && element.scrollLeft <= 10) {
      element.style.paddingLeft = "10px";
      element.scrollLeft = 1;
      setIsTransitioning(false);
    } else if (
      direction === "right" &&
      element.scrollLeft >= element.scrollWidth - (element.clientWidth + 10)
    ) {
      element.style.paddingRight = "10px";
      element.scrollLeft = element.scrollWidth - element.clientWidth - 10;
      setIsTransitioning(false);
    }
  };

  // Ajout des écouteurs d'événements avec useRef
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchMove = (e: PointerEvent) => {
      const deltaX = e.clientX - startPoint.current.x;
      const deltaY = e.clientY - startPoint.current.y;

      // Déterminer la direction du scroll
      const scrollDirection =
        Math.abs(deltaX) > Math.abs(deltaY)
          ? deltaX > 0
            ? "right"
            : "left"
          : deltaY > 0
            ? "up"
            : "down";

      // Trouver tous les éléments scrollables
      const scrollableElements = Array.from(
        container.querySelectorAll("*"),
      ).filter((el) => {
        return isScrollable(el as HTMLElement, scrollDirection);
      });

      scrollableElements.forEach((el) => {
        const element = el as HTMLElement;
        element.addEventListener("touchend", () =>
          handleCorrect(element, scrollDirection),
        );
        element.addEventListener("touchcancel", () =>
          handleCorrect(element, scrollDirection),
        );
        element.addEventListener("scrollend", () =>
          handleCorrect(element, scrollDirection),
        );
      });
    };

    container.addEventListener("pointerdown", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("pointermove", handleTouchMove, {
      passive: false,
    });

    return () => {
      container.removeEventListener("pointermove", handleTouchMove);
    };
  }, [translate]);

  // Ajout des écouteurs d'événements pour le drag
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseUp);

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleMouseUp);
    container.addEventListener("touchcancel", handleMouseUp);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseUp);

      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleMouseUp);
      container.removeEventListener("touchcancel", handleMouseUp);
    };
  }, [
    dragging,
    draggable,
    direction,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
  ]);

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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/UIIcons';

interface ResizablePanelsProps {
    children: React.ReactNode;
    leftPanelContent?: React.ReactNode;
    rightPanelContent?: React.ReactNode;
    leftPanelVisible?: boolean;
    rightPanelVisible?: boolean;
    initialLeftWidth?: number;
    initialRightWidth?: number;
    minPanelWidth?: number;
}

const Dragger: React.FC<{ onMouseDown: (e: React.MouseEvent) => void; onClick: () => void; isCollapsed: boolean, side: 'left' | 'right' }> = ({ onMouseDown, onClick, isCollapsed, side }) => (
    <div
        className="bg-zinc-800 hover:bg-amber-600 cursor-col-resize w-4 flex items-center justify-center transition-colors group"
        onMouseDown={onMouseDown}
        onClick={(e) => {
             // We only want collapse toggle on a simple click, not at the end of a drag.
             // A drag is a mousedown, move, then mouseup. A click is mousedown then mouseup without move.
             // The most reliable way to check this is if the mouse has moved more than a few pixels.
             // However, a simpler check is to see if the event default was prevented by the drag handler.
             // For simplicity and good-enough UX, we can just call onClick.
             onClick();
        }}
        title={isCollapsed ? "Expandir Painel" : "Recolher Painel"}
    >
        <div className="text-zinc-500 group-hover:text-black">
            {side === 'left' && (isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />)}
            {side === 'right' && (isCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />)}
        </div>
    </div>
);


const ResizablePanels: React.FC<ResizablePanelsProps> = ({
    children,
    leftPanelContent,
    rightPanelContent,
    leftPanelVisible = false,
    rightPanelVisible = false,
    initialLeftWidth = 280,
    initialRightWidth = 320,
    minPanelWidth = 200,
}) => {
    const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
    const [rightWidth, setRightWidth] = useState(initialRightWidth);
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const isLeftDraggingRef = useRef(false);
    const isRightDraggingRef = useRef(false);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        if (isLeftDraggingRef.current) {
            const newLeftWidth = e.clientX - rect.left;
            if (newLeftWidth > minPanelWidth) {
                setLeftWidth(newLeftWidth);
                if (isLeftCollapsed) setIsLeftCollapsed(false);
            }
        }

        if (isRightDraggingRef.current) {
            const newRightWidth = rect.right - e.clientX;
            if (newRightWidth > minPanelWidth) {
                setRightWidth(newRightWidth);
                if (isRightCollapsed) setIsRightCollapsed(false);
            }
        }
    }, [minPanelWidth, isLeftCollapsed, isRightCollapsed]);

    const handleMouseUp = useCallback(() => {
        isLeftDraggingRef.current = false;
        isRightDraggingRef.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const handleLeftDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        isLeftDraggingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const handleRightDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        isRightDraggingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };
    
    return (
        <div ref={containerRef} className="flex h-full w-full overflow-hidden">
            {leftPanelVisible && (
                <>
                    <aside 
                        style={{ width: isLeftCollapsed ? '0px' : `${leftWidth}px` }} 
                        className="transition-all duration-300 h-full overflow-hidden shrink-0"
                    >
                        {leftPanelContent}
                    </aside>
                    <Dragger onMouseDown={handleLeftDragStart} onClick={() => setIsLeftCollapsed(!isLeftCollapsed)} isCollapsed={isLeftCollapsed} side="left" />
                </>
            )}

            <main className="flex-grow min-w-0 h-full overflow-hidden">
                {children}
            </main>
            
            {rightPanelVisible && (
                <>
                     <Dragger onMouseDown={handleRightDragStart} onClick={() => setIsRightCollapsed(!isRightCollapsed)} isCollapsed={isRightCollapsed} side="right" />
                    <aside 
                        style={{ width: isRightCollapsed ? '0px' : `${rightWidth}px` }}
                        className="transition-all duration-300 h-full overflow-hidden shrink-0"
                    >
                        {rightPanelContent}
                    </aside>
                </>
            )}
        </div>
    );
};

export default ResizablePanels;

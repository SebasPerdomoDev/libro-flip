declare module "react-pageflip" {
  import * as React from "react";

  export interface FlipEvent {
    data: number;
  }

  export interface HTMLFlipBookProps extends React.HTMLAttributes<HTMLDivElement> {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
    onFlip?: (e: FlipEvent) => void;
    startPage?: number;
    singlePage?: boolean;
  }

  export interface PageFlip {
    flipNext: () => void;
    flipPrev: () => void;
    flip: (page: number) => void;
  }

  export interface HTMLFlipBookType {
    pageFlip: () => PageFlip;
  }

  export default class HTMLFlipBook extends React.Component<HTMLFlipBookProps> {}
}

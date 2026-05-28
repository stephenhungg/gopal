"use client";

import Image from "next/image";

/**
 * CuteAccent — single absolutely-positioned kawaii sticker accent.
 *
 *   <CuteAccent kind="bow" pos="top-right" size={120} rotate={-12} />
 *
 * all accents collapse into the gopal orb so post-corruption does not leak
 * old angel stickers.
 *
 * Floating accents — absolute pos with optional rotate, ignores pointer events.
 */

const ASSETS = {
  bow: "/gopal/gopal-orb-icon.png",
  boba: "/gopal/gopal-orb-icon.png",
  strawberry: "/gopal/gopal-orb-icon.png",
  cake: "/gopal/gopal-orb-icon.png",
  blossom: "/gopal/gopal-orb-icon.png",
  cloud: "/gopal/gopal-orb-icon.png",
  hearts: "/gopal/gopal-orb-icon.png",
  moon: "/gopal/gopal-orb-icon.png",
  donut: "/gopal/gopal-orb-icon.png",
  popsicle: "/gopal/gopal-orb-icon.png",
  crystal: "/gopal/gopal-orb-icon.png",
  pudding: "/gopal/gopal-orb-icon.png",
} as const;

type Kind = keyof typeof ASSETS;

type Props = {
  kind: Kind;
  /** css size in px (square) */
  size?: number;
  /** rotation in degrees */
  rotate?: number;
  /** css positioning props */
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  /** opacity 0..1 */
  opacity?: number;
  className?: string;
  /** drop-shadow strength */
  shadow?: number;
};

export function CuteAccent({
  kind,
  size = 120,
  rotate = 0,
  top,
  left,
  right,
  bottom,
  opacity = 1,
  className = "",
  shadow = 0.25,
}: Props) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute select-none ${className}`}
      style={{
        top,
        left,
        right,
        bottom,
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        opacity,
        filter: `drop-shadow(0 8px 0 rgba(54, 104, 21, ${shadow * 0.6})) drop-shadow(0 18px 28px rgba(112, 200, 32, ${shadow * 0.4}))`,
      }}
    >
      <Image
        src={ASSETS[kind]}
        alt=""
        width={size * 2}
        height={size * 2}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

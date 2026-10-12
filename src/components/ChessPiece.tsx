import type { Color, PieceSymbol } from 'chess.js';

// Adapted Cburnett artwork; attribution and CC BY-SA 3.0 terms in /chesspieces-license.txt.

interface Props {
  type: PieceSymbol;
  color: Color;
  className?: string;
}

export default function ChessPiece({ type, color, className = '' }: Props) {
  const fill = color === 'w' ? '#fffef7' : '#292e2b';
  const stroke = '#242a25';
  const detail = color === 'w' ? '#42483e' : '#e0e2d6';
  return (
    <svg className={className} viewBox="0 0 45 45" fill={fill} stroke={stroke} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {type === 'p' && <>
        <path d="M22.5 8.1a4.2 4.2 0 0 0-3.15 7 6.5 6.5 0 0 0-.9 11.7c-4.2 1.8-6.45 5.8-6.45 10.7h21c0-4.9-2.25-8.9-6.45-10.7a6.5 6.5 0 0 0-.9-11.7 4.2 4.2 0 0 0-3.15-7Z" />
        <path d="M14 34.7h17" stroke={detail} strokeWidth="1.1" />
      </>}
      {type === 'r' && <>
        <path d="M9 39h27v-3H9zM12 36v-4h21v4M14 29.5V17h17v12.5M11 14V9h5v4h4V9h5v4h4V9h5v5l-3 3H14zM14 29.5l-2 2.5h21l-2-2.5Z" />
        <path d="M14 18h17M14 29h17M12 34h21" stroke={detail} strokeWidth="1" />
      </>}
      {type === 'n' && <>
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
        <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.04-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.99-.5-2-.5-3.5 1-1 3 2.5 3 2.5h2s.78-1.99 2.5-3c1 0 1 3 1 3" />
        <path d="M26 13c5 2 9 9 9 21M16 16l-1 3M9.5 25.5l.5-1" fill="none" stroke={detail} strokeWidth="1.8" />
        <path d="M16 36h20" stroke={detail} strokeWidth="1" />
      </>}
      {type === 'b' && <>
        <path d="M9 36c3.4-1 10.1.4 13.5-2 3.4 2.4 10.1 1 13.5 2v3H9z" />
        <path d="M15 32c2.5-3.5 3-7 3-7h9s.5 3.5 3 7c-4.2 1.5-10.8 1.5-15 0Z" />
        <path d="M22.5 8c-2.5 4-10 7.5-10 13.2 0 3.3 4.1 5.8 10 5.8s10-2.5 10-5.8C32.5 15.5 25 12 22.5 8Z" />
        <path d="M22.5 12v8M19.5 17h6M17 24h11M16 32h13" stroke={detail} strokeWidth="1.3" fill="none" />
        <circle cx="22.5" cy="7.3" r="2.1" />
      </>}
      {type === 'q' && <>
        <path d="m9 12 4.5 17c5 2.7 13 2.7 18 0L36 12l-8.5 11L27 9l-4.5 13L18 9l-.5 14Z" />
        <path d="M13.5 29c0 2 0 4-2.5 7 6.5 3.3 16.5 3.3 23 0-2.5-3-2.5-5-2.5-7M11 36v3h23v-3" />
        <path d="M14 30c4 2 13 2 17 0M13 34c5 2 14 2 19 0" fill="none" stroke={detail} strokeWidth="1.1" />
        <circle cx="9" cy="10.5" r="2" /><circle cx="18" cy="7.5" r="2" /><circle cx="27" cy="7.5" r="2" /><circle cx="36" cy="10.5" r="2" />
      </>}
      {type === 'k' && <>
        <path d="M22.5 11V4.5M19.5 7h6" fill="none" strokeWidth="2.1" />
        <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2-3-2s-3 2-3 2c-1.5 3 3 10.5 3 10.5Z" />
        <path d="M11.5 30S6 24 8.5 19c3.5-6 11.5-2 14 6 2.5-8 10.5-12 14-6 2.5 5-3 11-3 11v7c-5.5 3.5-16.5 3.5-22 0Z" />
        <path d="M11.5 30c5.5-2 16.5-2 22 0M11.5 33.5c5.5-2 16.5-2 22 0M11.5 37c5.5-2 16.5-2 22 0" fill="none" stroke={detail} strokeWidth="1.2" />
      </>}
    </svg>
  );
}

export function KnightMark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 40 44" fill="none" aria-hidden="true">
    <path d="M16 7 18 3l3 5c11 2 15 12 13 27H13c0-8 9-8 8-15l-8 8-7-2V20l7-10V6l3 1Z" fill="currentColor" />
    <path d="m20 12-4 4m10 0c4 5 5 10 4 15" stroke="var(--sidebar-bg, #f5f6f0)" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M11 39h25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>;
}
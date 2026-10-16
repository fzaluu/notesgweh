import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Latar belakang modal: hitam pekat (ubah angka terakhir untuk lebih terang/gelap)
export const MODAL_BACKDROP = 'rgba(0, 0, 0, 0.8)';

// Penghitung agar scroll baru dibuka lagi setelah SEMUA modal tertutup
let lockCount = 0;
let prevBodyOverflow = '';
let prevHtmlOverflow = '';

function lockScroll() {
  if (lockCount === 0) {
    prevBodyOverflow = document.body.style.overflow;
    prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
  lockCount += 1;
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = prevBodyOverflow;
    document.documentElement.style.overflow = prevHtmlOverflow;
  }
}

interface ModalOverlayProps {
  children: ReactNode;
  zIndex?: number;
}

/**
 * Latar modal layar penuh.
 *
 * Kenapa pakai portal (render langsung ke <body>)?
 * Halaman dibungkus elemen .page-transition yang beranimasi `transform ... forwards`.
 * Elemen ber-transform menjadi "acuan" bagi position: fixed di dalamnya, sehingga
 * overlay yang ditaruh di dalam halaman ikut ter-scroll dan tidak menutupi seluruh
 * layar (sidebar tidak ikut gelap). Dengan portal, overlay selalu menempel ke layar.
 */
export default function ModalOverlay({ children, zIndex = 10000 }: ModalOverlayProps) {
  useEffect(() => {
    lockScroll();
    return unlockScroll;
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        backgroundColor: MODAL_BACKDROP,
        backdropFilter: 'blur(3px)',
        display: 'flex',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* margin: auto = tepat di tengah; kalau dialog lebih tinggi dari layar, bisa di-scroll */}
      <div
        style={{
          margin: 'auto',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

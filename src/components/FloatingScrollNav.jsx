import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";

const SCROLL_MARGIN = 8;

function viewportIntersectionArea(el) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const top = Math.max(r.top, 0);
  const left = Math.max(r.left, 0);
  const bottom = Math.min(r.bottom, vh);
  const right = Math.min(r.right, vw);
  return Math.max(0, right - left) * Math.max(0, bottom - top);
}

function shouldExcludeScroller(el) {
  if (!el || el === document.documentElement) return false;
  if (
    el.closest(
      '[role="listbox"], [role="menu"], [data-floating-scroll-ignore]'
    )
  ) {
    return true;
  }
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const r = el.getBoundingClientRect();
  const visH = Math.min(r.bottom, vh) - Math.max(r.top, 0);
  const visW = Math.min(r.right, vw) - Math.max(r.left, 0);
  if (visH < Math.min(96, vh * 0.16)) return true;
  if (visW < Math.min(96, vw * 0.22)) return true;
  return false;
}

function isYOverflowScrollable(el) {
  if (!el) return false;
  const st = window.getComputedStyle(el);
  if (!["auto", "scroll", "overlay"].includes(st.overflowY)) return false;
  return el.scrollHeight > el.clientHeight + SCROLL_MARGIN;
}

function gatherOverflowElements() {
  const set = new Set();

  const add = (nodeList) => {
    nodeList?.forEach?.((n) => set.add(n));
  };

  add(document.querySelectorAll("main.flex-1.overflow-y-auto"));
  add(document.querySelectorAll("main.overflow-y-auto, main.overflow-y-scroll"));
  add(
    document.querySelectorAll(
      '[class*="overflow-y-auto"], [class*="overflow-y-scroll"]'
    )
  );
  add(document.querySelectorAll(".overflow-auto"));

  return [...set];
}

function dropScrollAncestors(candidates) {
  return candidates.filter(
    (el) =>
      !candidates.some((other) => other !== el && el.contains(other))
  );
}

function getScrollRoot() {
  const doc = document.scrollingElement || document.documentElement;

  const candidates = gatherOverflowElements().filter(
    (el) =>
      isYOverflowScrollable(el) &&
      !shouldExcludeScroller(el)
  );

  if (isYOverflowScrollable(doc) && !shouldExcludeScroller(doc)) {
    candidates.push(doc);
  }

  const filtered = dropScrollAncestors(candidates);
  if (filtered.length === 0) return null;
  if (filtered.length === 1) return filtered[0];

  filtered.sort(
    (a, b) => viewportIntersectionArea(b) - viewportIntersectionArea(a)
  );
  return filtered[0];
}

function isWindowDrivenScroll(el) {
  return el === document.documentElement || el === document.body;
}

function computeVisibility(root) {
  if (!root) return { showTop: false, showBottom: false };
  const { scrollTop, scrollHeight, clientHeight } = root;
  const canScroll = scrollHeight > clientHeight + SCROLL_MARGIN;
  if (!canScroll) return { showTop: false, showBottom: false };
  const atTop = scrollTop <= SCROLL_MARGIN;
  const atBottom = scrollTop + clientHeight >= scrollHeight - SCROLL_MARGIN;
  return {
    showTop: !atTop,
    showBottom: !atBottom,
  };
}

export default function FloatingScrollNav() {
  const location = useLocation();
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  useEffect(() => {
    let scrollTarget = null;
    let useWindow = false;

    const applyVisibility = (root) => {
      const v = computeVisibility(root);
      setShowTop(v.showTop);
      setShowBottom(v.showBottom);
    };

    const onScroll = () => {
      applyVisibility(getScrollRoot());
    };

    const sync = () => {
      const root = getScrollRoot();

      if (useWindow) {
        window.removeEventListener("scroll", onScroll);
        useWindow = false;
      }
      if (scrollTarget) {
        scrollTarget.removeEventListener("scroll", onScroll);
        scrollTarget = null;
      }

      if (!root) {
        applyVisibility(null);
        return;
      }

      if (isWindowDrivenScroll(root)) {
        window.addEventListener("scroll", onScroll, { passive: true });
        useWindow = true;
      } else {
        root.addEventListener("scroll", onScroll, { passive: true });
        scrollTarget = root;
      }

      applyVisibility(root);
    };

    sync();
    const raf = requestAnimationFrame(sync);
    const t0 = window.setTimeout(sync, 0);
    const t1 = window.setTimeout(sync, 250);
    const t2 = window.setTimeout(sync, 750);

    window.addEventListener("resize", sync);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => sync())
        : null;
    if (ro) {
      ro.observe(document.documentElement);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", sync);
      if (useWindow) window.removeEventListener("scroll", onScroll);
      if (scrollTarget) scrollTarget.removeEventListener("scroll", onScroll);
      ro?.disconnect();
    };
  }, [location.pathname]);

  const scrollToTop = useCallback(() => {
    const root = getScrollRoot();
    root?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    const root = getScrollRoot();
    if (!root) return;
    root.scrollTo({ top: root.scrollHeight, behavior: "smooth" });
  }, []);

  if (!showTop && !showBottom) return null;

  return (
    <div className="pointer-events-none fixed end-4 bottom-4 z-50 flex flex-col gap-2 md:end-6 md:bottom-6">
      {showTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-gray-200/80 bg-white/95 text-gray-800 shadow-lg backdrop-blur-sm transition hover:bg-white hover:shadow-md dark:border-border dark:bg-background/95 dark:text-foreground"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-6 w-6" strokeWidth={2.25} aria-hidden />
        </button>
      )}
      {showBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-gray-200/80 bg-white/95 text-gray-800 shadow-lg backdrop-blur-sm transition hover:bg-white hover:shadow-md dark:border-border dark:bg-background/95 dark:text-foreground"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-6 w-6" strokeWidth={2.25} aria-hidden />
        </button>
      )}
    </div>
  );
}

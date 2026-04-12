<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    onClose: () => void;
    children: Snippet;
    center?: boolean;
  }

  let { onClose, children, center = false }: Props = $props();

  /* Swipe-down to close */
  let touchStartY = 0;
  let touchStartX = 0;
  let swiping = false;

  function onTouchStart(e: TouchEvent) {
    const el = e.currentTarget as HTMLElement;
    // Only enable swipe-to-close when scrolled to top
    if (el.scrollTop > 0) return;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    swiping = true;
  }

  function onTouchEnd(e: TouchEvent) {
    if (!swiping) return;
    swiping = false;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartX);
    // Swipe down > 80px and mostly vertical
    if (deltaY > 80 && deltaY > deltaX * 1.5) {
      onClose();
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    role="button"
    tabindex="0"
    class="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-800 overflow-y-auto cursor-pointer backdrop-blur-md {center ? 'flex items-center justify-center' : ''}"
    onclick={onClose}
    onkeydown={(e) => (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && onClose()}
    ontouchstart={onTouchStart}
    ontouchend={onTouchEnd}
>
    <div class="{center ? 'w-full' : ''} py-8 md:py-12">
        {@render children()}
    </div>
</div>

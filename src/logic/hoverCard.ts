export interface HoverElement {
  style: { transform: string };
  dataset?: { scale?: string | number };
  getBoundingClientRect: () => { x: number; y: number; width: number; height: number };
}

export const DEFAULT_CONSTRAIN = 5;

export function transforms(
  x: number,
  y: number,
  el: HoverElement,
  constrain = DEFAULT_CONSTRAIN
): string {
  el.style.transform = "";
  const box = el.getBoundingClientRect();
  const scale = el.dataset?.scale == 2 ? 2 : 1;

  const calcX = -(y - box.y - box.height / 2) / (constrain * scale);
  const calcY = (x - box.x - (box.width ? box.width : 71) / 2) / (constrain * scale);

  if (box.width === 0) {
    return `translate(35.5px) perspective(94px) rotateX(${calcX}deg) rotateY(${calcY}deg) translate(-35.5px)`;
  }

  return `perspective(94px) rotateX(${calcX}deg) rotateY(${calcY}deg)`;
}

export function hoverCard(event: { clientX: number; clientY: number; target: HoverElement }): void {
  const { clientX, clientY, target } = event;
  target.style.transform = transforms(clientX, clientY, target);
}

export function noHoverCard(event: { target: HoverElement }): void {
  event.target.style.transform = "";
}

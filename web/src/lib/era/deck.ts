/**
 * 조언 버튼용 카드 더미: 한 바퀴를 다 돌기 전에는 같은 조언이 다시 나오지 않는다.
 * 다 돌면 새로 섞되, 방금 본 것이 바로 다시 첫 장이 되지 않게 한다.
 */
export interface Deck {
  order: number[];
  next: number;
}

export type Rng = () => number;

export function shuffled(count: number, rng: Rng = Math.random): number[] {
  const a = Array.from({ length: count }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createDeck(count: number, rng: Rng = Math.random): Deck {
  return { order: shuffled(count, rng), next: 0 };
}

/** 다음 한 장. 더미는 바꾸지 않고 새 더미를 돌려준다 */
export function draw(deck: Deck, rng: Rng = Math.random): { index: number; deck: Deck } {
  const count = deck.order.length;
  if (count === 0) throw new Error("빈 더미에서는 뽑을 수 없어요");
  if (deck.next < count) {
    return { index: deck.order[deck.next], deck: { order: deck.order, next: deck.next + 1 } };
  }
  const last = deck.order[count - 1];
  const order = shuffled(count, rng);
  if (count > 1 && order[0] === last) [order[0], order[1]] = [order[1], order[0]];
  return { index: order[0], deck: { order, next: 1 } };
}

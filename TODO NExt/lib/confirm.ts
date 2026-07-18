export function confirmFullyDone(topicTitle: string): Promise<boolean> {
  const message = `"${topicTitle}" is bigger than this slot.\n\nDid you fully cover this topic?`;
  const fullyDone = window.confirm(
    `${message}\n\nOK = Yes, fully covered\nCancel = Not yet — carry it to the next slot`
  );
  return Promise.resolve(fullyDone);
}

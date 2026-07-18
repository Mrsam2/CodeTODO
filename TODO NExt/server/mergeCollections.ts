interface HasId {
  id: string;
  updatedAt?: number;
  createdAt?: number;
  [key: string]: unknown;
}

/** Merge arrays of objects by their custom 'id' field, using timestamps for resolution. */
export function mergeCollections<T extends HasId>(serverArr: T[], clientArr: T[], deletedIds: string[] = []): T[] {
  const serverMap = new Map<string, T>(serverArr.map((item) => [item.id, item]));

  deletedIds.forEach((id) => serverMap.delete(id));

  clientArr.forEach((clientItem) => {
    if (deletedIds.includes(clientItem.id)) return;

    const serverItem = serverMap.get(clientItem.id);
    if (!serverItem) {
      serverMap.set(clientItem.id, clientItem);
    } else {
      const serverTime = serverItem.updatedAt || serverItem.createdAt || 0;
      const clientTime = clientItem.updatedAt || clientItem.createdAt || 0;
      if (clientTime >= serverTime) {
        serverMap.set(clientItem.id, { ...serverItem, ...clientItem });
      }
    }
  });

  return Array.from(serverMap.values());
}

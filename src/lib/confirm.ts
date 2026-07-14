import { Alert, Platform } from 'react-native';

/**
 * Ask whether a roadmap topic that's bigger than its assigned slot was
 * actually finished. Resolves true = fully done, false = continue next slot.
 */
export function confirmFullyDone(topicTitle: string): Promise<boolean> {
  const message = `"${topicTitle}" is bigger than this slot.\n\nDid you fully cover this topic?`;

  if (Platform.OS === 'web') {
    const fullyDone = window.confirm(
      `${message}\n\nOK = Yes, fully covered\nCancel = Not yet — carry it to the next slot`
    );
    return Promise.resolve(fullyDone);
  }

  return new Promise((resolve) => {
    Alert.alert(
      'Did you finish this topic?',
      message,
      [
        { text: 'Not yet — next slot', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Yes, fully covered', onPress: () => resolve(true) },
      ]
    );
  });
}

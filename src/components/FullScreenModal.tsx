import React from 'react';
import { Modal, type ModalProps } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Drop-in replacement for React Native Modal that always wraps content in
 * SafeAreaProvider.
 *
 * WHY: Modal creates a new UIViewController/native window root on iOS and a
 * new Activity Window on Android. The SafeAreaProvider mounted in App.tsx does
 * NOT propagate its measurements into a Modal — each Modal needs its own
 * provider to get correct inset values for notch, Dynamic Island, and gesture
 * bar. Using this component everywhere prevents the "content behind status bar"
 * regression from reoccurring when new modals are added.
 *
 * Usage: import FullScreenModal and use it exactly like Modal. Keep your
 * SafeAreaView inside as normal — this component only adds the SafeAreaProvider
 * wrapper around Modal content.
 */
export function FullScreenModal({ children, ...props }: ModalProps & { children?: React.ReactNode }) {
  return (
    <Modal {...props}>
      <SafeAreaProvider>
        {children}
      </SafeAreaProvider>
    </Modal>
  );
}

import posthog from "posthog-js";
import { useCallback } from "react";

export function usePostHogEvents(userEmail: string | null) {
  const captureEvent = useCallback(
    (eventName: string, properties: Record<string, any> = {}) => {
      if (userEmail) {
        posthog.identify(userEmail); // Set user identity
        posthog.capture(eventName, {
          ...properties,
          userEmail, // Include user email in every event
        });
      } else {
        console.warn(
          "User email not provided. Event captured without user identification."
        );
        posthog.capture(eventName, properties);
      }
    },
    [userEmail]
  );

  return { captureEvent };
}

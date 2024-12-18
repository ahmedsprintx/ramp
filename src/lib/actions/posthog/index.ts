import posthog from "@/lib/posthog-server";

export async function captureEventServer(
  eventName: string,
  userEmail: string,
  properties: Record<string, any>
) {
  try {
    posthog.identify({ distinctId: userEmail });
    await posthog.capture({
      distinctId: userEmail || "server",
      event: eventName,
      properties: properties,
    });
    console.log(`Event captured: ${eventName}`);
  } catch (error) {
    console.error(`Failed to capture event ${eventName}:`, error);
  }
}

import { router } from "expo-router";

/**
 * Safely navigate back. If there is no screen to go back to,
 * fall back to the provided route (defaults to the main tabs).
 */
export function safeBack(fallback: string = "/(tabs)") {
    if (router.canGoBack()) {
        router.back();
    } else {
        router.replace(fallback as any);
    }
}

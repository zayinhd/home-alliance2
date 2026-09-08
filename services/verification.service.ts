interface VerifyFacesInput {
    selfieUri: string;
    nationalId: string;
    userId: string;
}

interface VerifyFacesResponse {
    matched: boolean;
    similarityScore: number;
}

const VERIFICATION_REQUEST_TIMEOUT_MS = 90000;

const getVerificationApiUrl = () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

    if (!apiUrl) {
        throw new Error(
            "EXPO_PUBLIC_API_URL is missing. Configure your backend verification endpoint.",
        );
    }

    const normalized = apiUrl.replace(/\/+$/, "");

    if (normalized.includes("localhost") || normalized.includes("127.0.0.1")) {
        throw new Error(
            "EXPO_PUBLIC_API_URL cannot use localhost on iPhone. Use your computer's LAN IP instead.",
        );
    }

    if (normalized.endsWith("/api/verification/verify")) {
        return normalized;
    }

    if (normalized.endsWith("/api/verification")) {
        return `${normalized}/verify`;
    }

    return `${normalized}/api/verification/verify`;
};

export const verifyFaces = async ({
    selfieUri,
    nationalId,
    userId,
}: VerifyFacesInput): Promise<VerifyFacesResponse> => {
    const endpoint = getVerificationApiUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(
        () => controller.abort(),
        VERIFICATION_REQUEST_TIMEOUT_MS,
    );

    const formData = new FormData();

    formData.append("nationalId", nationalId);
    formData.append("userId", userId);
    formData.append("selfie", {
        uri: selfieUri,
        name: `selfie-${Date.now()}.jpg`,
        type: "image/jpeg",
    } as any);

    let response: Response;

    try {
        response = await fetch(endpoint, {
            method: "POST",
            body: formData,
            signal: controller.signal,
        });
    } catch (error: any) {
        if (error?.name === "AbortError") {
            throw new Error(
                "Verification request timed out. The identity server is taking too long to respond. Check Railway health and try again.",
            );
        }

        const networkMessage =
            typeof error?.message === "string" ? error.message : "";

        if (
            /network request failed|load failed|fetch failed/i.test(
                networkMessage,
            )
        ) {
            throw new Error(
                "Could not reach the identity server from the phone. Confirm the Expo app was restarted after updating EXPO_PUBLIC_API_URL and that Railway is online.",
            );
        }

        throw new Error(
            `Verification request failed before the server responded${
                networkMessage ? `: ${networkMessage}` : "."
            }`,
        );
    } finally {
        clearTimeout(timeoutId);
    }

    let payload: any = null;

    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        throw new Error(
            payload?.message ||
                `Identity server returned ${response.status}.`,
        );
    }

    const matched = payload?.matched ?? payload?.verified;
    const similarityScore = payload?.similarityScore ?? payload?.similarity;

    if (typeof matched !== "boolean" || typeof similarityScore !== "number") {
        throw new Error(
            "Identity server returned an unexpected response. Confirm the Railway deployment is running the latest backend code.",
        );
    }

    return { matched, similarityScore };
};

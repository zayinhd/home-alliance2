interface VerifyFacesInput {
    selfieUri: string;
    nationalId: string;
    userId: string;
}

interface VerifyFacesResponse {
    matched: boolean;
    similarityScore: number;
}

const VERIFICATION_REQUEST_TIMEOUT_MS = 20000;

const getVerificationApiUrl = () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

    if (!apiUrl) {
        throw new Error(
            "EXPO_PUBLIC_API_URL is missing. Configure your backend verification endpoint.",
        );
    }

    return apiUrl.replace(/\/+$/, "");
};

export const verifyFaces = async ({
    selfieUri,
    nationalId,
    userId,
}: VerifyFacesInput): Promise<VerifyFacesResponse> => {
    const endpoint = `${getVerificationApiUrl()}/verify`;
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
                "Verification request timed out. Confirm EXPO_PUBLIC_API_URL is reachable from your phone.",
            );
        }

        throw new Error(
            "Could not reach verification server. Check EXPO_PUBLIC_API_URL and backend availability.",
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
                `Face verification request failed with status ${response.status}.`,
        );
    }

    const matched = payload?.matched ?? payload?.verified;
    const similarityScore = payload?.similarityScore ?? payload?.similarity;

    if (typeof matched !== "boolean" || typeof similarityScore !== "number") {
        throw new Error(
            "Verification service returned an invalid response payload.",
        );
    }

    return { matched, similarityScore };
};

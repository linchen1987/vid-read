export const PROXY_URL = "https://api-proxy-cloudflare.link-lin-1987.workers.dev";

interface FetchProxyOptions extends RequestInit {
    params?: Record<string, string>;
}

export async function fetchProxy(targetUrl: string, options: FetchProxyOptions = {}) {
    const { params, headers, ...rest } = options;

    // Append query params to target URL if present
    let finalTargetUrl = targetUrl;
    if (params) {
        const url = new URL(targetUrl);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        finalTargetUrl = url.toString();
    }

    const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(finalTargetUrl)}`;

    return fetch(proxyUrl, {
        ...rest,
        headers: headers,
    });
}

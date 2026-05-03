export async function getAppSecretProof(accessToken: string, appSecret: string): Promise<string> {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(appSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(accessToken))
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
}

export async function withAppSecretProof(url: string, accessToken: string, appSecret: string): Promise<string> {
    const urlObj = new URL(url)
    urlObj.searchParams.set('appsecret_proof', await getAppSecretProof(accessToken, appSecret))
    return urlObj.toString()
}

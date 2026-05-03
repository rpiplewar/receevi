import crypto from 'crypto'

export function getAppSecretProof(): string {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!
    const appSecret = process.env.FACEBOOK_APP_SECRET!
    return crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex')
}

export function withAppSecretProof(url: string): string {
    const urlObj = new URL(url)
    urlObj.searchParams.set('appsecret_proof', getAppSecretProof())
    return urlObj.toString()
}

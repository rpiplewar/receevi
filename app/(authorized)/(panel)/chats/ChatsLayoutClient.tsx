'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

export default function ChatsLayoutClient({ children }: { children: ReactNode }) {
    const pathname = usePathname()

    // On mobile: hide when we're inside a specific chat (/chats/[wa_id])
    // On desktop (md:): always show
    const isInsideChat = pathname !== '/chats' && (pathname?.startsWith('/chats/') ?? false)

    return (
        <div className={`
            ${isInsideChat ? 'hidden' : 'flex'}
            md:flex
            w-full md:w-80 flex-shrink-0 flex-col
            border-r border-gray-200
        `}>
            {children}
        </div>
    )
}

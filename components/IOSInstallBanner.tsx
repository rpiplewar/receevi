'use client'

import { useEffect, useState } from 'react'
import { Share2, X } from 'lucide-react'

const DISMISSED_KEY = 'ios-install-banner-dismissed'

export default function IOSInstallBanner() {
    const [show, setShow] = useState(false)

    useEffect(() => {
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
        const isStandalone = (window.navigator as any).standalone === true
        const isDismissed = localStorage.getItem(DISMISSED_KEY) === 'true'

        if (isIOS && !isStandalone && !isDismissed) {
            const t = setTimeout(() => setShow(true), 2500)
            return () => clearTimeout(t)
        }
    }, [])

    function dismiss() {
        setShow(false)
        localStorage.setItem(DISMISSED_KEY, 'true')
    }

    if (!show) return null

    return (
        <div className="md:hidden fixed bottom-20 left-3 right-3 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
            <button
                onClick={dismiss}
                aria-label="Dismiss install banner"
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
                <X size={18} />
            </button>
            <div className="flex items-start gap-3 pr-6">
                <img src="/assets/img/icon.svg" className="w-10 h-10 flex-shrink-0 rounded-xl mt-0.5" alt="Receevi" />
                <div>
                    <p className="font-semibold text-sm text-gray-900">Add Receevi to Home Screen</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Tap <Share2 size={11} className="inline mx-0.5 -mt-0.5" />
                        {' '}<strong className="text-gray-700">Share</strong> then{' '}
                        <strong className="text-gray-700">&quot;Add to Home Screen&quot;</strong> for the full app experience.
                    </p>
                </div>
            </div>
        </div>
    )
}

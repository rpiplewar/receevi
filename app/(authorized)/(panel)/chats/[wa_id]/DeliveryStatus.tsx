'use client'

import { AlertCircleIcon, CheckIcon, ClockIcon } from "lucide-react"

type DeliveryStatusProps = {
    message: DBMessage
}

export default function DeliveryStatus({ message }: DeliveryStatusProps) {
    if (message.failed_at) {
        const tooltip = message.error_code
            ? `Error ${message.error_code}: ${message.error_message || 'Failed'}`
            : 'Failed'
        return (
            <span title={tooltip} className="inline-flex items-center ml-1">
                <AlertCircleIcon className="w-3.5 h-3.5 text-red-500" />
            </span>
        )
    }

    if (message.read_at) {
        return (
            <span className="inline-flex items-center ml-1">
                <CheckIcon className="w-3.5 h-3.5 text-[#53bdeb] -mr-1.5" />
                <CheckIcon className="w-3.5 h-3.5 text-[#53bdeb]" />
            </span>
        )
    }

    if (message.delivered_at) {
        return (
            <span className="inline-flex items-center ml-1">
                <CheckIcon className="w-3.5 h-3.5 text-bubble-meta -mr-1.5" />
                <CheckIcon className="w-3.5 h-3.5 text-bubble-meta" />
            </span>
        )
    }

    if (message.sent_at) {
        return (
            <span className="inline-flex items-center ml-1">
                <CheckIcon className="w-3.5 h-3.5 text-bubble-meta" />
            </span>
        )
    }

    // Pending — sent to API but no status callback yet
    return (
        <span className="inline-flex items-center ml-1">
            <ClockIcon className="w-3 h-3 text-bubble-meta" />
        </span>
    )
}

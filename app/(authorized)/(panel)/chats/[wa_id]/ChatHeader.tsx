'use client'

import { useSupabase } from '@/components/supabase-provider'
import { useUserRole } from '@/components/supabase-user-provider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import UserLetterIcon from '@/components/users/UserLetterIcon'
import { Contact } from '@/types/contact'
import { useCallback, useEffect, useState } from 'react'
import { useAgents } from '../AgentContext'
import BlankUser from '../BlankUser'
import { ArrowLeft, Phone } from 'lucide-react'
import Link from 'next/link'

export default function ChatHeader({ contact }: { contact: Contact | undefined }) {
    const agentState = useAgents()
    const { supabase } = useSupabase()
    const userRole = useUserRole()
    const [roleAssigned, setRoleAssigned] = useState<string | null | undefined>(contact?.assigned_to || undefined)
    useEffect(() => {
        setRoleAssigned(contact?.assigned_to || undefined)
    }, [contact])
    const assignToAgent = useCallback(async (agentId: string | null) => {
        if (contact?.wa_id) {
            const { data } = await supabase.from('contacts').update({ assigned_to: agentId }).eq('wa_id', contact.wa_id)
            setRoleAssigned(agentId)
            if (contact) {
                contact.assigned_to = agentId
            }
        }
    }, [supabase, contact])
    return (
        <div className="bg-panel-header-background">
            <header className="px-4 py-2 flex flex-row gap-4 items-center">
                {/* Back button: mobile only */}
                <Link
                    href="/chats"
                    className="md:hidden flex items-center justify-center w-8 h-8 -ml-1"
                    aria-label="Back to contacts"
                >
                    <ArrowLeft size={20} className="text-panel-header-icon" />
                </Link>
                <BlankUser className="w-10 h-10" />
                <div className='text-primary-strong flex-grow'>
                    {contact?.profile_name}
                </div>
                {contact?.wa_id && (
                    <a
                        href={`tel:+${contact.wa_id}`}
                        className="md:hidden flex items-center justify-center w-8 h-8 text-panel-header-icon"
                        aria-label={`Call ${contact.profile_name}`}
                    >
                        <Phone size={20} />
                    </a>
                )}
                {(() => {
                    if (userRole == 'admin') {
                        return (
                            <div className='flex flex-row items-center gap-2'>
                                <div className='text-sm font-medium text-gray-700'>Assign to:</div>
                                <div>
                                    <Select value={roleAssigned || undefined} onValueChange={(value) => { assignToAgent(value) }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an agent" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {agentState?.agents.map((ag) => {
                                                return (
                                                    <SelectItem key={ag.id} value={ag.id}>
                                                        <div className='flex flex-row gap-2 items-center'>
                                                            <UserLetterIcon user={ag} className='' />
                                                            <div className='flex-shrink-0'>
                                                                <div>{ag.firstName + ' ' + ag.lastName}</div>
                                                                <div>{ag.email}</div>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                )
                                            })}
                                            {(() => {
                                                if (agentState?.agents.length === 0) {
                                                    return (
                                                        <div className='flex flex-row gap-2 items-center'>
                                                            <div className='flex-shrink-0 p-2'>
                                                                <div className='text-sm text-gray-500'>No agents found</div>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            })()}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {roleAssigned && (
                                    <div>
                                        <Button variant="outline" onClick={() => { assignToAgent(null) }} size="sm" className='rounded-full'>Unassign</Button>
                                    </div>
                                )}
                            </div>
                        )
                    }
                })()}
            </header>
        </div>
    )
}

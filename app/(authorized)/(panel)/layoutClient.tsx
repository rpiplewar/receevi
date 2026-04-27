'use client';

import { useSupabase } from "@/components/supabase-provider";
import { useSupabaseUser, useUserRole } from "@/components/supabase-user-provider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import UserLetterIcon from "@/components/users/UserLetterIcon";
import IOSInstallBanner from "@/components/IOSInstallBanner";
import { ContactIcon, LogOut, MessageCircleIcon, RadioIcon, UsersIcon } from "lucide-react";
import Link from 'next/link';
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect } from "react";

export default function PanelClient({ children }: { children: ReactNode }) {
    const activePath = usePathname();
    const { user } = useSupabaseUser();
    const userRole = useUserRole()
    const supabase = useSupabase()
    const router = useRouter()
    const logout = useCallback(() => {
        supabase.supabase.auth.signOut().then(() => {
            console.log("logout successful")
            router.push('/login')
        }).catch(console.error);
    }, [router, supabase])
    useEffect(() => {
        supabase.supabase.auth.getSession().then(res => {
            if (res.data.session?.access_token) {
                supabase.supabase.realtime.setAuth(res.data.session?.access_token)
            }
        })
    }, [supabase])

    return (
        <div className="flex flex-col h-screen">
            {/* TOP NAV — desktop only */}
            <div className="hidden md:flex h-16 flex-row justify-between px-4 flex-shrink-0">
                <div className="flex flex-row">
                    <div className="flex flex-row gap-2 items-center">
                        <img src="/assets/img/icon.svg" className="w-8 h-8" />
                        <div className="text-lg">Receevi</div>
                    </div>
                </div>
                <div className="flex flex-row items-center">
                    <Link href="/chats"><Button variant={activePath?.startsWith('/chats') ? "secondary" : "ghost"} className="px-4 justify-start"> <MessageCircleIcon />&nbsp;&nbsp;Chats</Button></Link>
                    <Link href="/contacts"><Button variant={activePath?.startsWith('/contacts') ? "secondary" : "ghost"} className="px-4 justify-start ml-2"><ContactIcon />&nbsp;&nbsp;Contacts</Button></Link>
                    {userRole === 'admin' && (
                        <>
                            <Link href="/bulk-send"><Button variant={activePath?.startsWith('/bulk-send') ? "secondary" : "ghost"} className="px-4 justify-start ml-2"> <RadioIcon />&nbsp;&nbsp;Bulk Send</Button></Link>
                            <Link href="/users"><Button variant={activePath?.startsWith('/users') ? "secondary" : "ghost"} className="px-4 justify-start ml-2"> <UsersIcon />&nbsp;&nbsp;Users</Button></Link>
                        </>
                    )}
                </div>
                <div className="flex flex-row items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button>
                                <UserLetterIcon user={{ firstName: user?.user_metadata.first_name, lastName: user?.user_metadata.last_name }} className="cursor-pointer h-10 w-10" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.user_metadata.first_name} {user?.user_metadata.last_name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={logout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* MAIN CONTENT — pb-16 on mobile to clear fixed bottom nav */}
            <div className="h-full overflow-y-auto bg-gray-100 flex-grow pb-16 md:pb-0">
                {children}
            </div>

            {/* iOS install banner — position: fixed, sits above bottom nav */}
            <IOSInstallBanner />

            {/* BOTTOM NAV — mobile only, fixed */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-panel-header-background border-t border-gray-200 flex h-16 safe-pb">
                <Link href="/chats" className="flex-1 flex flex-col items-center justify-center gap-1 pt-2">
                    <MessageCircleIcon size={22} className={activePath?.startsWith('/chats') ? 'text-button-primary-background' : 'text-gray-500'} />
                    <span className={`text-xs ${activePath?.startsWith('/chats') ? 'text-button-primary-background font-medium' : 'text-gray-500'}`}>Chats</span>
                </Link>
                <Link href="/contacts" className="flex-1 flex flex-col items-center justify-center gap-1 pt-2">
                    <ContactIcon size={22} className={activePath?.startsWith('/contacts') ? 'text-button-primary-background' : 'text-gray-500'} />
                    <span className={`text-xs ${activePath?.startsWith('/contacts') ? 'text-button-primary-background font-medium' : 'text-gray-500'}`}>Contacts</span>
                </Link>
                {userRole === 'admin' && (
                    <>
                        <Link href="/bulk-send" className="flex-1 flex flex-col items-center justify-center gap-1 pt-2">
                            <RadioIcon size={22} className={activePath?.startsWith('/bulk-send') ? 'text-button-primary-background' : 'text-gray-500'} />
                            <span className={`text-xs ${activePath?.startsWith('/bulk-send') ? 'text-button-primary-background font-medium' : 'text-gray-500'}`}>Broadcast</span>
                        </Link>
                        <Link href="/users" className="flex-1 flex flex-col items-center justify-center gap-1 pt-2">
                            <UsersIcon size={22} className={activePath?.startsWith('/users') ? 'text-button-primary-background' : 'text-gray-500'} />
                            <span className={`text-xs ${activePath?.startsWith('/users') ? 'text-button-primary-background font-medium' : 'text-gray-500'}`}>Users</span>
                        </Link>
                    </>
                )}
                <button onClick={logout} className="flex-1 flex flex-col items-center justify-center gap-1 pt-2">
                    <LogOut size={22} className="text-gray-500" />
                    <span className="text-xs text-gray-500">Logout</span>
                </button>
            </nav>
        </div>
    )
}

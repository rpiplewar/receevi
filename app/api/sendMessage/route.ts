import { NextRequest, NextResponse } from "next/server";
import { DBTables } from "@/lib/enums/Tables";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createClient } from "@/utils/supabase-server";
import { TemplateRequest } from "@/types/message-template-request";
import { sendTemplateMessage } from "@/lib/communication/communication";

type Media = {
    id?: string;
    filename?: string;
    caption?: string | null | undefined;
};


type Message = {
    recipient_type: "individual";
    messaging_product: "whatsapp";
    to: string;
    type?: "document" | "image" | "text" | "video" | "template";
    audio?: Media;
    document?: Media;
    video?: Media;
    image?: Media;
    sticker?: Media;
    text?: {
        body: string,
    },
    template?: TemplateRequest
};

function getFileExtention(fileName: string): (string | null) {
    const fileNameRegexRes = (/[.]/.exec(fileName)) ? /[^.]+$/.exec(fileName) : undefined;
    if (fileNameRegexRes && fileNameRegexRes.length) {
        return fileNameRegexRes[0]
    }
    return null
}

async function uploadFile(file: File, to: string) {
    const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_API_PHONE_NUMBER_ID}/media`;
    const headers = {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
    };
    const formData = new FormData();
    formData.set('type', file.type);
    formData.set('messaging_product', 'whatsapp');
    formData.set('file', file);
    const res = await fetch(WHATSAPP_API_URL, {
        method: 'POST',
        headers,
        body: formData
    });
    if (!res.ok) {
        const responseStatus = await res.status
        const response = await res.text()
        throw new Error(responseStatus + response);
    }
    const response = await res.json()

    let extension = getFileExtention(file.name);

    const supabase = createServiceClient()

    const { data, error } = await supabase
        .storage
        .from('media')
        .upload(`${to}/${response.id}.${extension}`, file, {
            cacheControl: '3600',
            contentType: file.type,
            upsert: false,
            duplex: 'half',
        })
    if (error) throw error
    return [response.id, data.path];
}

async function sendWhatsAppMediaOrTextMessage(to: string, message: string | null | undefined, fileType: string | undefined | null, file: File | undefined | null) {
    const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_API_PHONE_NUMBER_ID}/messages`;
    const payload: Message = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
    };
    let mediaUrl: (string | null) = null
    if (file) {
        let mediaId;
        [mediaId, mediaUrl] = await uploadFile(file, to)
        switch (fileType) {
            case 'image':
                payload['type'] = 'image'
                payload['image'] = {
                    id: mediaId,
                }
                if (message) {
                    payload['image']['caption'] = message
                }
                break;
            case 'video':
                payload['type'] = 'video'
                payload['video'] = {
                    id: mediaId,
                }
                if (message) {
                    payload['video']['caption'] = message
                }
                break;
            case 'file':
            default:
                payload['type'] = 'document'
                payload['document'] = {
                    id: mediaId,
                    filename: file.name,
                }
                if (message) {
                    payload['document']['caption'] = message
                }
                break;
        }
    } else {
        payload['type'] = 'text'
        payload['text'] = {
            body: message!!
        }
    }
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
    };
    const res = await fetch(WHATSAPP_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const responseStatus = await res.status
        const response = await res.text()
        throw new Error(responseStatus + response);
    }
    const msgToPut: any = structuredClone(payload)
    delete msgToPut.messaging_product;
    const response = await res.json()
    const wamId = response.messages[0].id;
    msgToPut['id'] = wamId
    const supabase = createServiceClient()
    const supabaseResponse = await supabase
        .from(DBTables.Messages)
        .insert({
            message: msgToPut,
            wam_id: wamId,
            chat_id: Number.parseInt(response.contacts[0].wa_id),
            media_url: mediaUrl,
        })
}

export async function POST(request: NextRequest) {
    const supabase = createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return new NextResponse(null, { status: 401 })
    }
    const reqFormData = await request.formData()
    const message = reqFormData.get('message')?.toString()
    const fileType = reqFormData.get('fileType')?.toString()
    const file: (File | null) = reqFormData.get('file') as (File | null)

    const reqFormDataTemplate = reqFormData.get('template')?.toString()
    const template: (TemplateRequest | null | undefined) = reqFormDataTemplate && JSON.parse(reqFormDataTemplate)
    const to = reqFormData.get('to')?.toString()
    if (!to) {
        return new NextResponse(null, { status: 400 })
    }
    if (!message && !file && !template) {
        return new NextResponse(null, { status: 400 })
    }
    if (template) {
        await sendTemplateMessage(to, template)
    } else {
        await sendWhatsAppMediaOrTextMessage(to, message, fileType, file)
    }
    let { error } = await supabase
        .from(DBTables.Contacts)
        .update({
            last_message_at: new Date(),
        })
        .eq('wa_id', to)
    if (error) console.error('error while updating last message field')
    return new NextResponse()
}

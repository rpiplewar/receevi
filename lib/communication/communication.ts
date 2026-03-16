import { TemplateRequest, TextParameter } from "@/types/message-template-request";
import { MessageTemplateComponent } from "@/types/message-template";
import { createServiceClient } from "@/lib/supabase/service-client";
import { DBTables } from "@/lib/enums/Tables";

async function post<T>(url: string, body: T) {
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
    })
}

function regexSearchTextReplace(input: string, replacement: { text: string }[]) {
    // Match both numbered ({{1}}) and named ({{document_name}}) template variables
    const varsRegex = /{{(\d+|\w+)}}/g
    const allVars = [...input.matchAll(varsRegex)]
    let replacementIndex = 0
    for (const varMatch of allVars) {
        const varKey = varMatch[1]
        // For numbered vars, use the number as index; for named vars, use sequential order
        const varIndex = /^\d+$/.test(varKey) ? Number.parseInt(varKey) - 1 : replacementIndex
        if (varIndex < replacement.length) {
            const replacementText = replacement[varIndex].text
            if (replacementText) {
                input = input.replace(varMatch[0], replacementText)
            }
        }
        replacementIndex++
    }
    return input;
}

function replaceVarsInTemplate(components: MessageTemplateComponent[], vars: TemplateRequest['components']) {
    components.forEach(c => {
        switch (c.type) {
            case 'HEADER':
                const headerVarValue = vars.find((v) => v.type === 'header')
                if (headerVarValue) {
                    if (c.format === 'TEXT') {
                        c.text = regexSearchTextReplace(c.text, headerVarValue.parameters as { text: string }[])
                    } else if (c.format === 'IMAGE' && headerVarValue.parameters && headerVarValue.parameters[0].type === 'image') {
                        c.image = headerVarValue.parameters[0].image
                    } else if (c.format === 'VIDEO' && headerVarValue.parameters && headerVarValue.parameters[0].type === 'video') {
                        c.video = headerVarValue.parameters[0].video
                    } else if (c.format === 'DOCUMENT' && headerVarValue.parameters && headerVarValue.parameters[0].type === 'document') {
                        c.document = headerVarValue.parameters[0].document
                    }
                }
                break;
            case 'BODY':
                const bodyVarValue = vars.find((v) => v.type === 'body')
                if (bodyVarValue) {
                    c.text = regexSearchTextReplace(c.text, bodyVarValue.parameters as TextParameter[])
                }
                break;
            case 'BUTTONS':
                const buttonPayloads = vars.filter((v) => v.type === 'button')
                if (buttonPayloads) {
                    c.buttons.forEach((b, bIndex) => {
                        if (b.type === 'URL' && b.url.endsWith('{{1}}')) {
                            const payloadObj = buttonPayloads.find(x => 'index' in x && Number.parseInt(x.index) === bIndex)
                            if (payloadObj && 'sub_type' in payloadObj && payloadObj?.sub_type === 'url') {
                                const replacement = payloadObj.parameters && payloadObj.parameters[0].payload
                                b.url = b.url.replace('{{1}}', replacement)
                            }
                        }
                    })
                }
                break;
        }
    })
}

type TemplateMessagePayload = {
    messaging_product: "whatsapp";
    recipient_type: "individual";
    to: string;
    type: "template";
    template: TemplateRequest;
};

export async function sendTemplateMessage(to: string, template: TemplateRequest) {
    const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_API_PHONE_NUMBER_ID}/messages`;
    const payload: TemplateMessagePayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template,
    };
    const res = await fetch(WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const responseStatus = res.status
        const response = await res.text()
        throw new Error(responseStatus + response);
    }
    const response = await res.json()
    const wamId = response.messages[0].id;

    // Build message object for DB storage
    const msgToPut: any = {
        id: wamId,
        to,
        type: 'template',
        template: structuredClone(template),
    }

    // Fetch template from DB and replace variables to get resolved content
    const supabase = createServiceClient()
    const { data: templateArrFromDB } = await supabase
        .from('message_template')
        .select('*')
        .eq('name', template.name)
        .eq('language', template.language.code)
    const templateFromDB = templateArrFromDB && templateArrFromDB[0]
    if (templateFromDB) {
        const templateComponents = templateFromDB.components as MessageTemplateComponent[]
        replaceVarsInTemplate(templateComponents, template.components)
        msgToPut.template.components = templateComponents
    }

    // Store message in DB
    const { error } = await supabase
        .from(DBTables.Messages)
        .insert({
            message: msgToPut,
            wam_id: wamId,
            chat_id: Number.parseInt(response.contacts[0].wa_id),
            is_received: false,
        })
    if (error) {
        console.error('Error storing template message:', error)
        throw error
    }

    // Update contact's last message timestamp
    await supabase
        .from(DBTables.Contacts)
        .upsert({
            wa_id: response.contacts[0].wa_id,
            last_message_at: new Date(),
            in_chat: true,
        }, { onConflict: 'wa_id' })

    return { wamId, waId: response.contacts[0].wa_id }
}

export { post }

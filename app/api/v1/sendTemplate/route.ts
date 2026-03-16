import { NextRequest, NextResponse } from "next/server";
import { TemplateRequest } from "@/types/message-template-request";
import { sendTemplateMessage } from "@/lib/communication/communication";

type SendTemplateBody = {
    to: string;
    template: TemplateRequest;
};

export async function POST(request: NextRequest) {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: SendTemplateBody;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.to || !body.template?.name || !body.template?.language?.code) {
        return NextResponse.json({ error: 'Missing required fields: to, template.name, template.language.code' }, { status: 400 });
    }

    try {
        const result = await sendTemplateMessage(body.to, body.template);
        return NextResponse.json({
            success: true,
            message_id: result.wamId,
            wa_id: result.waId,
        });
    } catch (error: any) {
        console.error('Error sending template message:', error);
        return NextResponse.json({ error: error.message || 'Failed to send template message' }, { status: 500 });
    }
}

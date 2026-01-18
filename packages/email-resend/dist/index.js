import { APIError } from 'payload';
/**
 * Email adapter for [Resend](https://resend.com) REST API
 */ export const resendAdapter = (args)=>{
    const { apiKey, defaultFromAddress, defaultFromName } = args;
    const adapter = ()=>({
            name: 'resend-rest',
            defaultFromAddress,
            defaultFromName,
            sendEmail: async (message)=>{
                // Map the Payload email options to Resend email options
                const sendEmailOptions = mapPayloadEmailToResendEmail(message, defaultFromAddress, defaultFromName);
                const res = await fetch('https://api.resend.com/emails', {
                    body: JSON.stringify(sendEmailOptions),
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    method: 'POST'
                });
                const data = await res.json();
                if ('id' in data) {
                    return data;
                } else {
                    const statusCode = data.statusCode || res.status;
                    let formattedError = `Error sending email: ${statusCode}`;
                    if (data.name && data.message) {
                        formattedError += ` ${data.name} - ${data.message}`;
                    }
                    throw new APIError(formattedError, statusCode);
                }
            }
        });
    return adapter;
};
function mapPayloadEmailToResendEmail(message, defaultFromAddress, defaultFromName) {
    return {
        // Required
        from: mapFromAddress(message.from, defaultFromName, defaultFromAddress),
        subject: message.subject ?? '',
        to: mapAddresses(message.to),
        // Other To fields
        bcc: mapAddresses(message.bcc),
        cc: mapAddresses(message.cc),
        reply_to: mapAddresses(message.replyTo),
        // Optional
        attachments: mapAttachments(message.attachments),
        html: message.html?.toString() || '',
        text: message.text?.toString() || ''
    };
}
function mapFromAddress(address, defaultFromName, defaultFromAddress) {
    if (!address) {
        return `${defaultFromName} <${defaultFromAddress}>`;
    }
    if (typeof address === 'string') {
        return address;
    }
    return `${address.name} <${address.address}>`;
}
function mapAddresses(addresses) {
    if (!addresses) {
        return '';
    }
    if (typeof addresses === 'string') {
        return addresses;
    }
    if (Array.isArray(addresses)) {
        return addresses.map((address)=>typeof address === 'string' ? address : address.address);
    }
    return [
        addresses.address
    ];
}
function mapAttachments(attachments) {
    if (!attachments) {
        return [];
    }
    return attachments.map((attachment)=>{
        if (!attachment.filename || !attachment.content) {
            throw new APIError('Attachment is missing filename or content', 400);
        }
        if (typeof attachment.content === 'string') {
            return {
                content: Buffer.from(attachment.content),
                filename: attachment.filename
            };
        }
        if (attachment.content instanceof Buffer) {
            return {
                content: attachment.content,
                filename: attachment.filename
            };
        }
        throw new APIError('Attachment content must be a string or a buffer', 400);
    });
}

//# sourceMappingURL=index.js.map
import { Contact, LinkPrecedence } from "../../generated/prisma";

interface ContactResponse {
    contact: {
        primaryContactId: number;
        emails: string[];  // first element being email of primary contact
        phoneNumbers: string[]; // first element being phoneNumber of primary contact
        secondaryContactIds: number[]; // Array of all Contact IDs that are "secondary" to the primary contact
    };
}

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
    return [...new Set(values.filter((v): v is string => !!v && v.trim() !== ""))];
}

export function buildResponse(contacts: Contact[]): ContactResponse {
    const primary = contacts.find(c => c.linkPrecedence === LinkPrecedence.primary)!;
    const emails = uniqueNonEmpty([primary.email, ...contacts.filter((c) => c.id !== primary.id).map(({ email }) => email)])
    const phoneNumbers = uniqueNonEmpty([primary.phoneNumber, ...contacts.filter((c) => c.id !== primary.id).map(({ phoneNumber }) => phoneNumber)])
    const secondaryContactIds = contacts.filter(c => c.id !== primary.id).map(c => c.id)

    return {
        contact: {
            primaryContactId: primary.id,
            emails,
            phoneNumbers,
            secondaryContactIds,
        },
    };
}

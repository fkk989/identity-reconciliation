import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import { prismaClient } from "./lib/db"
import { buildResponse, getOldestPrimary } from "./utils/helpers"
import { LinkPrecedence, PrismaPromise } from "../generated/prisma"

dotenv.config()

const app = express()

app.use(cors(), express.json())

/* 
flow of this route 
-> getAllContacts 
-> link all the primary and secondary contact to the oldest primary 
-> decide if you want update a missing filed of primary contact or need to crate a secondary
*/
app.post("/identify", async (req, res) => {
    try {
        const { email, phoneNumber } = req.body

        if (!email && !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least an email or a phone number.",
            });
        }

        const contacts = await prismaClient.contact.findMany({
            where: {
                OR: [
                    { email },
                    { phoneNumber }
                ]
            },
            orderBy: {
                createdAt: "asc",
            }
        })

        //If no existing contacts, create new primary and return the response
        if (contacts.length === 0) {
            const newContact = await prismaClient.contact.create({
                data: {
                    email,
                    phoneNumber,
                    linkPrecedence: "primary",
                },
            });
            return res.json(buildResponse([newContact]));
        }

        const ids = contacts.map(c => c.id);
        const linkedIds = contacts
            .map(c => c.linkedId)
            .filter(Boolean) as number[];

        // getting all contacts linked to the contacts that we fetched earlier
        const allContacts = await prismaClient.contact.findMany({
            where: {
                OR: [
                    { id: { in: [...ids, ...linkedIds] } },
                    { linkedId: { in: [...ids, ...linkedIds] } },
                ],
            },
        });

        // we will push all the update in this and create a transaction with it
        const updates: PrismaPromise<any>[] = [];

        const primaries = allContacts.filter(c => c.linkPrecedence === LinkPrecedence.primary);
        const oldestPrimary = getOldestPrimary(primaries)

        // linking all other primaries as secondaries to the oldesPrimary
        const othersPrimariesIds = primaries.filter(p => p.id !== oldestPrimary.id).map(p => p.id)

        if (othersPrimariesIds.length) {
            updates.push(
                prismaClient.contact.updateMany({
                    where: { id: { in: othersPrimariesIds } },
                    data: {
                        linkPrecedence: LinkPrecedence.secondary,
                        linkedId: oldestPrimary.id,
                    },
                })
            );
        }

        const allUnlinkedSecondaryIds = allContacts.filter(c => c.linkPrecedence === LinkPrecedence.secondary && c.linkedId !== oldestPrimary.id).map(c => c.id)

        // linking all the secondary which are not linked to oldestPrimary
        if (allUnlinkedSecondaryIds.length) {
            updates.push(
                prismaClient.contact.updateMany({
                    where: { id: { in: allUnlinkedSecondaryIds } },
                    data: { linkedId: oldestPrimary.id },
                })
            );
        }

        // creating a transaction for our updates
        if (updates.length) {
            await prismaClient.$transaction(updates);
        }

        // fetching final state for the contacts
        const finalContacts = await prismaClient.contact.findMany({
            where: {
                OR: [{ id: oldestPrimary.id }, { linkedId: oldestPrimary.id }],
            },
        });

        return res.json(buildResponse(finalContacts));
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Internel server error"
        })
    }
})

app.get("/health", (req, res) => {
    res.json({
        message: "Server running fine"
    })
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT || 8080}`)
})
import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import { prismaClient } from "./lib/db"
import { buildResponse } from "./utils/helpers"

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
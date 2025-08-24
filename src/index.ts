import dotenv from "dotenv"
import express from "express"
import cors from "cors"

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
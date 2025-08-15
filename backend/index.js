import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Client, AccountBalanceQuery, TransferTransaction, Hbar } from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// FIXED: Remove wildcard route that causes path-to-regexp error
// DO NOT use app.get("/.well-known/*")
// Optional: Skip handling if not needed
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Check required env vars
const requiredEnv = ["HEDERA_NETWORK", "OPERATOR_ID", "OPERATOR_KEY"];
for (const key of requiredEnv) {
    if (!process.env[key]) {
        console.error(`❌ Missing environment variable: ${key}`);
        process.exit(1);
    }
}

//  Hedera client setup
const client = Client.forName(process.env.HEDERA_NETWORK);
client.setOperator(process.env.OPERATOR_ID, process.env.OPERATOR_KEY);

//  Balance route
app.get("/balance/:accountId", async (req, res) => {
    try {
        const balance = await new AccountBalanceQuery()
            .setAccountId(req.params.accountId)
            .execute(client);

        res.json({
            accountId: req.params.accountId,
            balance: balance.hbars.toString()
        });
    } catch (err) {
        console.error("❌ Balance error:", err);
        res.status(500).json({ error: err.message });
    }
});

//  Transfer route
app.post("/transfer", async (req, res) => {
    const { toAccountId, amount } = req.body;
    const amountNum = Number(amount);

    console.log("🔁 Transfer request:", { toAccountId, amount, parsedAmount: amountNum });

    if (!toAccountId || isNaN(amountNum) || amountNum <= 0) {
        console.warn("❌ Invalid transfer parameters:", { toAccountId, amount });
        return res.status(400).json({ error: "Invalid transfer parameters" });
    }

    try {
        const tx = await new TransferTransaction()
            .addHbarTransfer(process.env.OPERATOR_ID, new Hbar(-amountNum))
            .addHbarTransfer(toAccountId, new Hbar(amountNum))
            .execute(client);

        const receipt = await tx.getReceipt(client);
        res.json({ status: receipt.status.toString() });
    } catch (err) {
        console.error("❌ Transfer error:", err);
        res.status(500).json({ error: err.message });
    }
});

//  Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});

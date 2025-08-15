const API_URL = "http://localhost:3000";

async function checkBalance() {
    const accountId = document.getElementById("accountId").value;
    const res = await fetch(`${API_URL}/balance/${accountId}`);
    const data = await res.json();
    document.getElementById("balanceOutput").innerText = 
        data.balance ? `Balance: ${data.balance} HBAR` : `Error: ${data.error}`;
}

async function sendHBAR() {
    const toAccountId = document.getElementById("toAccount").value;
    const amount = parseFloat(document.getElementById("amount").value);

    const res = await fetch(`${API_URL}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toAccountId, amount })  // Correct key name
    });

    const data = await res.json();
    document.getElementById("sendOutput").innerText = 
        data.status ? `✅ Transaction successful: ${data.status}` : `❌ Error: ${data.error}`;
}

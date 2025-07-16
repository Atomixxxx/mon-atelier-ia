import React, { useState } from "react";

const API_URL = "http://localhost:8000/agent"; // adapte si besoin

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(e) {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    // Ajoute le message utilisateur
    setMessages(prev => [...prev, { user: true, text: input }]);
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: input,
          agent: "assistant" // Ou "general" selon ta config
        }),
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { user: false, text: data.response }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { user: false, text: "[Erreur connexion agent]" }
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  }

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#141618"
    }}>
      {/* Historique du chat */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        fontSize: 14
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            marginBottom: 12,
            textAlign: msg.user ? "right" : "left"
          }}>
            <div style={{
              display: "inline-block",
              background: msg.user ? "#00ff4166" : "#232627",
              color: msg.user ? "#111" : "#fff",
              padding: "8px 12px",
              borderRadius: "12px"
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ color: "#00ff41" }}>L’IA réfléchit…</div>
        )}
      </div>

      {/* Saisie utilisateur */}
      <form onSubmit={sendMessage} style={{
        display: "flex",
        gap: 6,
        padding: "10px 14px",
        borderTop: "1px solid #222"
      }}>
        <input
          type="text"
          placeholder="Votre message à l’IA…"
          value={input}
          disabled={loading}
          onChange={e => setInput(e.target.value)}
          style={{
            flex: 1,
            background: "#212325",
            border: "none",
            color: "#fff",
            padding: "10px",
            borderRadius: "7px"
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#00ff41",
            color: "#111",
            border: "none",
            borderRadius: "7px",
            padding: "0 18px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >Envoyer</button>
      </form>
    </div>
  );
}

import React, { useState } from 'react';
import { styles } from './styles';
import { Send, Bot } from 'lucide-react';

export default function ChatbotModule({ plantData }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { text: "I'm SproutAI. I'm connected to your sensors. Ask me anything!", isBot: true }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { text: input, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // AI Logic connected to database data
    setTimeout(() => {
      let response = "I'm analyzing your request...";
      const q = input.toLowerCase();

      if (q.includes("status") || q.includes("how is my plant")) {
        response = `Your plant is at ${plantData.moisture}% moisture and ${plantData.temp}°C. It looks ${plantData.moisture < 30 ? "thirsty!" : "healthy!"}`;
      } else if (q.includes("water")) {
        response = plantData.isPumpActive ? "The pump is currently running." : `Would you like me to start watering? Your moisture is currently ${plantData.moisture}%.`;
      } else if (q.includes("hello") || q.includes("hi")) {
        response = "Hello! Ready to grow some plants today?";
      }

      setMessages(prev => [...prev, { text: response, isBot: true }]);
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, i) => (
          <div key={i} style={m.isBot ? styles.chatBubbleBot : styles.chatBubbleUser}>
            {m.isBot && <Bot size={14} style={{marginBottom: 5}} />}
            <div>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={styles.chatInputWrapper}>
        <input 
          style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '14px' }}
          placeholder="Type to SproutAI..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} style={{ border: 'none', background: '#2E7D32', color: '#fff', borderRadius: '12px', padding: '8px' }}><Send size={18}/></button>
      </div>
    </div>
  );
}
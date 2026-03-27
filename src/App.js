import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from './firebaseConfig';
import { styles } from './styles';

import logoLocal from './logo.png'; 

import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { 
  Home, BarChart2, User, Power, Thermometer, 
  Sun, MessageCircle, Send, X, Loader2 
} from 'lucide-react';

export default function App() {
  const [view, setView] = useState('splash');
  const [authMode, setAuthMode] = useState('login'); 
  const [activeTab, setActiveTab] = useState('home');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [user, setUser] = useState(null);
  const chatEndRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Initialize with hardware-aligned defaults
  const [data, setData] = useState({ 
    moisture: 0, 
    temp: 0, 
    humidity: 0, 
    isPumpActive: false, 
    isAutoMode: true 
  });

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm Sprout AI. I'm connected to your plant's sensors. Ask me anything about its status!" }
  ]);

  const appTagline = "Growing smarter, together";

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- HARDWARE SYNC LOGIC ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && u.emailVerified) {
        setUser(u);
        
        // Listen to the specific document the ESP32 is updating
        const dataUnsub = onSnapshot(doc(db, "users", u.uid), (s) => {
          if (s.exists()) {
            const cloudData = s.data();
            setData(prev => ({ ...prev, ...cloudData }));
            
            // AUTOMATION LOGIC: If AutoMode is ON, React handles the threshold
            // This ensures the Pump stays in sync with the Cloud even if ESP32 restarts
            if (cloudData.isAutoMode) {
                const shouldBeWatering = cloudData.moisture < 30;
                if (shouldBeWatering !== cloudData.isPumpActive) {
                    updateDoc(doc(db, "users", u.uid), { isPumpActive: shouldBeWatering });
                }
            }
          }
        });

        if (view === 'auth') {
          setView('postLoginSplash');
          setTimeout(() => setView('dashboard'), 2500);
        } else if (view === 'splash') {
          setTimeout(() => setView('dashboard'), 2500);
        }

        return () => dataUnsub();
      } else {
        setUser(null);
        if (view !== 'dashboard' && view !== 'postLoginSplash') {
           setTimeout(() => setView('auth'), 2500);
        }
      }
    });
    return () => unsub();
  }, [view]);

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email address first!");
      return;
    }
    setIsBusy(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset link sent! Check your Gmail.");
    } catch (err) {
      alert(err.message);
    }
    setIsBusy(false);
  };

  const handleChat = () => {
    if (!chatInput.trim() || isBusy) return;
    const userMessage = { role: 'user', text: chatInput.trim() };
    const query = chatInput.toLowerCase();
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsBusy(true);

    setTimeout(() => {
      let response = "";
      if (query.includes("hi") || query.includes("hello") || query.includes("hey")) {
        response = "Hi there! I'm Sprout AI, your plant's personal assistant. How can I help you today?";
      }
      else if (query.includes("status") || query.includes("how") || query.includes("doing")) {
        response = `The plant is doing great! Moisture: ${data.moisture}%, Temp: ${data.temp}°C, Humidity: ${data.humidity}%. ${data.moisture < 30 ? "It looks a bit thirsty though!" : "Conditions are optimal."}`;
      } 
      else if (query.includes("pump") || query.includes("water")) {
        if (data.isAutoMode) {
          response = `Auto-Mode is ON. I'll water the plant automatically if moisture drops below 30%. Currently it's at ${data.moisture}%.`;
        } else {
          response = data.isPumpActive ? "The water pump is currently running." : `The pump is off. Soil moisture is currently ${data.moisture}%. Shall I turn it on?`;
        }
      } 
      else if (query.includes("temp") || query.includes("hot") || query.includes("cold")) {
        response = `The ambient temperature is ${data.temp}°C. Most indoor plants prefer between 18°C and 24°C, so this is ${data.temp > 25 ? "a bit warm." : "just right!"}`;
      }
      else if (query.includes("humidity") || query.includes("air")) {
        response = `The humidity is currently ${data.humidity}%. High humidity is great for tropical plants!`;
      }
      else if (query.includes("tip") || query.includes("help") || query.includes("advice")) {
        const tips = ["Don't overwater!", "Rotate your plant!", "Dust the leaves!", "Talk to your plants!"];
        response = tips[Math.floor(Math.random() * tips.length)];
      }
      else {
        response = "I'm not sure I understand. Ask about 'status' or 'temperature'!";
      }
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      setIsBusy(false);
    }, 600);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsBusy(true);
    try {
      if (authMode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          await signOut(auth);
          alert("Please verify your email!");
          setIsBusy(false);
          return;
        }
      } else {
        if (password !== confirmPassword) {
          alert("Passwords do not match!");
          setIsBusy(false);
          return;
        }
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(res.user);
        await setDoc(doc(db, "users", res.user.uid), {
          moisture: 0, temp: 0, humidity: 0, isPumpActive: false, 
          isAutoMode: true, email: email, isVerified: false
        });
        alert("Verification link sent!");
        await signOut(auth);
        setAuthMode('login');
      }
    } catch (err) { alert(err.message); }
    setIsBusy(false);
  };

  // Sends the command to Firestore for the ESP32 to read
  const handleUpdate = async (update) => {
    if (!user) return;
    setIsBusy(true);
    try {
        await updateDoc(doc(db, "users", user.uid), update);
    } catch (e) {
        console.error("Cloud Sync Error:", e);
    }
    setTimeout(() => setIsBusy(false), 300);
  };

  const handleLogout = async () => {
    setIsBusy(true);
    await signOut(auth);
    setView('auth');
    setIsBusy(false);
  };

  const handleNavAction = (tab) => {
    if (tab === 'chat') setIsChatOpen(!isChatOpen);
    else { setActiveTab(tab); setIsChatOpen(false); }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes loading { 0% { width: 0% } 100% { width: 100% } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
      `}</style>

      <div style={styles.phoneFrame}>
        {view === 'splash' || view === 'postLoginSplash' ? (
          <div style={{...styles.splashBg, background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <img src={logoLocal} alt="Logo" style={{ width: 140, height: 140, marginBottom: 15, animation: 'fadeIn 0.8s ease-out' }} />
            <h1 style={{color: '#1B5E20', fontWeight: '900', fontSize: 28, margin: 0}}>{view === 'postLoginSplash' ? 'Connecting...' : 'SmartSprout'}</h1>
            <p style={{ color: '#666', fontSize: 14, marginTop: 5 }}>{appTagline}</p>
            <div style={{width: '150px', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden', marginTop: 25}}>
              <div style={{height: '100%', background: '#1B5E20', animation: 'loading 2s infinite'}} />
            </div>
          </div>
        ) : view === 'auth' ? (
          <div style={styles.scrollArea}>
            <div style={{...styles.authHeader, marginTop: 50, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <img src={logoLocal} alt="Auth" style={{ width: 100, height: 100, marginBottom: 10 }} />
              <h2 style={{fontWeight: '900', color: '#1B5E20', fontSize: 28}}>{authMode === 'login' ? 'Welcome Back' : 'Join Us'}</h2>
            </div>
            <form onSubmit={handleAuth} style={{marginTop: 30}}>
              <input style={styles.inputField} type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
              <input style={{...styles.inputField, marginTop: 10}} type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
              {authMode === 'login' && <p onClick={handleForgotPassword} style={{textAlign: 'right', color: '#1B5E20', cursor: 'pointer', fontSize: 12, marginTop: 8}}>Forgot Password?</p>}
              {authMode === 'register' && <input style={{...styles.inputField, marginTop: 10}} type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required />}
              <button type="submit" style={{...styles.primaryBtn, marginTop: 20}} disabled={isBusy}>{isBusy ? <Loader2 style={{animation:'spin 1s linear infinite'}}/> : (authMode === 'login' ? 'Login' : 'Register')}</button>
            </form>
            <p onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{textAlign:'center', color:'#1B5E20', cursor:'pointer', fontSize: 13, marginTop: 15}}>{authMode === 'login' ? "Need an account? Register" : "Have an account? Login"}</p>
          </div>
        ) : (
          <>
            <div style={{padding: '30px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff'}}>
              <div style={{fontWeight: 900, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 8}}><img src={logoLocal} alt="H" style={{width: 28}} /> SmartSprout</div>
            </div>

            <div style={styles.scrollArea}>
              {activeTab === 'home' && (
                <>
                  <div style={{...styles.hero, background: data.isPumpActive ? '#1565C0' : '#1B5E20', padding: 40, borderRadius: 30, color: '#fff', textAlign: 'center', marginBottom: 20}}>
                    <h1 style={{fontSize: '72px', fontWeight: '900', margin: 0}}>{data.moisture}%</h1>
                    <p style={{fontSize: 12, letterSpacing: 2, opacity: 0.8}}>SOIL MOISTURE</p>
                  </div>
                  <div style={styles.grid}>
                    <div style={styles.card}><Thermometer color="#1B5E20" size={24}/><h3>{data.temp}°C</h3></div>
                    <div style={styles.card}><Sun color="#1B5E20" size={24}/><h3>{data.humidity}%</h3></div>
                  </div>
                  <div style={styles.controlBox}>
                    <span style={{fontWeight: 'bold'}}>Auto Mode</span>
                    <div style={{...styles.toggle, background: data.isAutoMode ? '#1B5E20' : '#ccc'}} onClick={() => handleUpdate({isAutoMode: !data.isAutoMode})}>
                      <div style={{...styles.toggleDot, transform: data.isAutoMode ? 'translateX(27px)' : 'translateX(0px)'}} />
                    </div>
                  </div>
                  <button disabled={data.isAutoMode || isBusy} style={{...styles.actionBtn, backgroundColor: data.isAutoMode ? '#EEE' : data.isPumpActive ? '#D32F2F' : '#1B5E20', color: data.isAutoMode ? '#AAA' : '#fff'}} onClick={() => handleUpdate({isPumpActive: !data.isPumpActive})}>
                    {isBusy ? <Loader2 style={{animation:'spin 1s linear infinite'}}/> : <Power size={20}/>}
                    <span>{data.isPumpActive ? "STOP PUMP" : "START PUMP"}</span>
                  </button>
                </>
              )}

              {activeTab === 'stats' && (
                <div style={{ padding: '10px 20px', animation: 'fadeIn 0.5s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ color: '#1B5E20' }}>Analytics</h3>
                    <div style={{ fontSize: 11, color: '#4CAF50', fontWeight: 'bold' }}>LIVE SYNC</div>
                  </div>
                  <div style={{ background: '#fff', padding: 20, borderRadius: 20, marginBottom: 20, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div><div style={{ fontSize: 20, fontWeight: '900' }}>{data.moisture}%</div><div style={{ fontSize: 10 }}>AVG MOISTURE</div></div>
                    <div><div style={{ fontSize: 20, fontWeight: '900' }}>{data.temp}°C</div><div style={{ fontSize: 10 }}>AVG TEMP</div></div>
                  </div>
                  <div style={{ background: '#fff', padding: 30, borderRadius: 25, border: '2px dashed #E0E0E0', textAlign: 'center' }}>
                    <BarChart2 size={40} color="#CCC" />
                    <p style={{ fontSize: 12, color: '#999' }}>History charts will appear here as the ESP32 logs data.</p>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <div style={{textAlign: 'center', paddingTop: 20}}>
                  <div style={{width: 80, height: 80, background: '#F0F0F0', borderRadius: 40, margin: '20px auto'}}><User size={40} color="#1B5E20"/></div>
                  <h3>{user ? user.email : "Guest"}</h3>
                  <button style={{...styles.primaryBtn, backgroundColor: '#FF5252', width: '80%'}} onClick={handleLogout}>Sign Out</button>
                </div>
              )}
            </div>

            <div style={styles.chatHead} onClick={() => setIsChatOpen(!isChatOpen)}>
              {isChatOpen ? <X color="#fff" size={28}/> : <MessageCircle color="#fff" size={28}/>}
            </div>

            {isChatOpen && (
              <div style={styles.chatWindow}>
                <div style={{padding: 15, background: '#1B5E20', color: '#fff', fontWeight: 'bold'}}>Sprout AI</div>
                <div style={{flex: 1, padding: 15, background: '#f9f9f9', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10}}>
                    {messages.map((m, i) => (
                      <div key={i} style={{alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? '#1B5E20' : '#E8F5E9', color: m.role === 'user' ? '#fff' : '#1B5E20', padding: '10px', borderRadius: '12px'}}>{m.text}</div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div style={{padding: 10, display: 'flex', gap: 8}}>
                  <input style={{flex: 1, background: '#F0F0F0', padding: 10, borderRadius: 20}} placeholder="Ask about status..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleChat()}/>
                  <div onClick={handleChat}><Send size={16} color="#fff"/></div>
                </div>
              </div>
            )}

            <nav style={styles.navbar}>
              <div style={activeTab === 'home' ? styles.navActive : styles.navItem} onClick={() => handleNavAction('home')}><Home size={24}/><span>Home</span></div>
              <div style={activeTab === 'stats' ? styles.navActive : styles.navItem} onClick={() => handleNavAction('stats')}><BarChart2 size={24}/><span>Stats</span></div>
              <div style={activeTab === 'account' ? styles.navActive : styles.navItem} onClick={() => handleNavAction('account')}><User size={24}/><span>Account</span></div>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
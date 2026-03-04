import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from './firebaseConfig';
import { styles } from './styles';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail // Added for forgot password
} from "firebase/auth";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { 
  Leaf, Home, BarChart2, User, Power, Thermometer, 
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
  
  const [data, setData] = useState({ moisture: 35, temp: 26, humidity: 60, isPumpActive: false, isAutoMode: true });

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm Sprout AI. I'm connected to your plant's sensors. Ask me anything about its status!" }
  ]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && u.emailVerified) {
        setUser(u);
        const dataUnsub = onSnapshot(doc(db, "users", u.uid), (s) => {
          if (s.exists()) setData(s.data());
        });
        setTimeout(() => setView('dashboard'), 2500);
        return () => dataUnsub();
      } else {
        setUser(null);
        if (view !== 'dashboard') setTimeout(() => setView('auth'), 2500);
      }
    });
    return () => unsub();
  }, [view]);

  // --- NEW: FORGOT PASSWORD LOGIC ---
  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email address first!");
      return;
    }
    setIsBusy(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset link sent! Please check your Gmail (including Spam and Promotions).");
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
      if (query.includes("status") || query.includes("how") || query.includes("doing") || query.includes("health")) {
        response = `Current stats: Moisture is at ${data.moisture}%, Temp is ${data.temp}°C. `;
        if (data.moisture < 30) response += "I recommend starting the pump, the soil is dry!";
        else if (data.moisture > 75) response += "The soil is very well hydrated.";
        else response += "Everything looks healthy!";
      } 
      else if (query.includes("pump") || query.includes("water")) {
        response = data.isPumpActive 
          ? "The water pump is currently running." 
          : `The pump is off. Moisture level is ${data.moisture}%.`;
      } 
      else if (query.includes("temp") || query.includes("humidity") || query.includes("weather")) {
        response = `It's currently ${data.temp}°C with ${data.humidity}% humidity.`;
      } 
      else if (query.includes("hello") || query.includes("hi")) {
        response = "Hi there! I'm your SmartSprout assistant. How can I help your plant today?";
      } 
      else {
        response = "I can help with plant vitals! Try asking 'How is my plant?'";
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
          alert("Please verify your email via Gmail before logging in!");
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
          moisture: 35, temp: 26, humidity: 60, isPumpActive: false, 
          isAutoMode: true, email: email, isVerified: false
        });

        alert("Success! A verification link has been sent to your Gmail. Please check your inbox and spam folder.");
        await signOut(auth);
        setAuthMode('login');
      }
    } catch (err) { 
      alert(err.message); 
    }
    setIsBusy(false);
  };

  const handleUpdate = async (update) => {
    if (!user) { setData(prev => ({...prev, ...update})); return; }
    setIsBusy(true);
    await updateDoc(doc(db, "users", user.uid), update);
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
      `}</style>

      <div style={styles.phoneFrame}>
        {view === 'splash' ? (
          <div style={styles.splashBg}>
            <Leaf size={70} color="#fff" fill="#fff" />
            <h1 style={{color: '#fff', fontWeight: '900'}}>SmartSprout</h1>
            <div style={{width: '150px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: 10, overflow: 'hidden', marginTop: 20}}>
              <div style={{height: '100%', background: '#fff', animation: 'loading 2s infinite'}} />
            </div>
          </div>
        ) : view === 'auth' ? (
          <div style={styles.scrollArea}>
            <div style={{...styles.authHeader, marginTop: 50}}>
              <Leaf size={60} color="#1B5E20" />
              <h2 style={{fontWeight: '900', color: '#1B5E20', fontSize: 28}}>{authMode === 'login' ? 'Welcome Back' : 'Join Us'}</h2>
            </div>
            <form onSubmit={handleAuth} style={{marginTop: 30}}>
              <input style={styles.inputField} type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
              <input style={{...styles.inputField, marginTop: 10}} type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
              
              {/* FORGOT PASSWORD LINK - Only shows on Login Mode */}
              {authMode === 'login' && (
                <p 
                  onClick={handleForgotPassword} 
                  style={{textAlign: 'right', color: '#1B5E20', cursor: 'pointer', fontSize: 12, marginTop: 8, fontWeight: '600'}}
                >
                  Forgot Password?
                </p>
              )}

              {authMode === 'register' && (
                <input style={{...styles.inputField, marginTop: 10}} type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required />
              )}

              <button type="submit" style={{...styles.primaryBtn, marginTop: 20}} disabled={isBusy}>
                {isBusy ? <Loader2 style={{animation:'spin 1s linear infinite'}}/> : (authMode === 'login' ? 'Login' : 'Register')}
              </button>
            </form>
            <p onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{textAlign:'center', color:'#1B5E20', cursor:'pointer', fontSize: 13, marginTop: 15}}>
              {authMode === 'login' ? "Need an account? Register" : "Have an account? Login"}
            </p>
          </div>
        ) : (
          <>
            <div style={{padding: '30px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontWeight: 900, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 5}}>
                <Leaf size={20} fill="#1B5E20"/> SmartSprout
              </div>
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
                <div style={{padding: 20}}>
                    <h3 style={{color: '#1B5E20'}}>Environment Stats</h3>
                    <p>System Online. Firestore sync active for: {user?.email}</p>
                </div>
              )}

              {activeTab === 'account' && (
                <div style={{textAlign: 'center', paddingTop: 20}}>
                  <div style={{width: 80, height: 80, background: '#F0F0F0', borderRadius: 40, margin: '20px auto', display: 'flex', justifyContent: 'center', alignItems: 'center'}}><User size={40} color="#1B5E20"/></div>
                  <h3>{user ? user.email : "Guest"}</h3>
                  <button style={{...styles.primaryBtn, backgroundColor: '#FF5252', width: '80%', margin: '20px auto'}} onClick={handleLogout}>Sign Out</button>
                </div>
              )}
            </div>

            <div style={styles.chatHead} onClick={() => setIsChatOpen(!isChatOpen)}>
              {isChatOpen ? <X color="#fff" size={28}/> : <MessageCircle color="#fff" size={28}/>}
            </div>

            {isChatOpen && (
              <div style={styles.chatWindow}>
                <div style={{padding: 15, background: '#1B5E20', color: '#fff', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between'}}>
                  Sprout AI <X size={18} style={{cursor: 'pointer'}} onClick={() => setIsChatOpen(false)}/>
                </div>
                <div style={{flex: 1, padding: 15, fontSize: 13, background: '#f9f9f9', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10}}>
                    {messages.map((m, i) => (
                      <div key={i} style={{
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        background: m.role === 'user' ? '#1B5E20' : '#E8F5E9',
                        color: m.role === 'user' ? '#fff' : '#1B5E20',
                        padding: '10px', borderRadius: '12px', maxWidth: '85%'
                      }}>{m.text}</div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div style={{padding: 10, display: 'flex', gap: 8, borderTop: '1px solid #eee'}}>
                  <input style={{flex: 1, border: 'none', background: '#F0F0F0', padding: 10, borderRadius: 20}} placeholder="Ask about your plant..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleChat()}/>
                  <div style={{width: 35, height: 35, background: '#1B5E20', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer'}} onClick={handleChat}><Send size={16} color="#fff"/></div>
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
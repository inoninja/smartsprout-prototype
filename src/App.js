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
  Home, BookOpen, User, Power, Thermometer, 
  Sun, MessageCircle, Send, X, Loader2, Droplet, AlertCircle 
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
  // IMPLEMENTATION: Set isAutoMode to false by default to prevent accidental pumping
  const [data, setData] = useState({ 
    moisture: 0, 
    temp: 0, 
    humidity: 0, 
    isPumpActive: false, 
    isAutoMode: false 
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
            // IMPLEMENTATION: Added check (moisture > 5) so the pump won't trigger if the sensor is in the air or unplugged
            if (cloudData.isAutoMode) {
                const shouldBeWatering = cloudData.moisture > 5 && cloudData.moisture < 30;
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
        response = `The plant is doing great! Moisture: ${data.moisture}%, Temp: ${data.temp.toFixed(1)}°C, Humidity: ${data.humidity.toFixed(1)}%. ${data.moisture < 30 ? "It looks a bit thirsty though!" : "Conditions are optimal."}`;
      } 
      else if (query.includes("pump") || query.includes("water")) {
        if (data.isAutoMode) {
          response = `Auto-Mode is ON. I'll water the plant automatically if moisture drops below 30%. Currently it's at ${data.moisture}%.`;
        } else {
          response = data.isPumpActive ? "The water pump is currently running." : `The pump is off. Soil moisture is currently ${data.moisture}%. Shall I turn it on?`;
        }
      } 
      else if (query.includes("temp") || query.includes("hot") || query.includes("cold")) {
        response = `The ambient temperature is ${data.temp.toFixed(1)}°C. Most indoor plants prefer between 18°C and 24°C, so this is ${data.temp > 25 ? "a bit warm." : "just right!"}`;
      }
      else if (query.includes("humidity") || query.includes("air")) {
        response = `The humidity is currently ${data.humidity.toFixed(1)}%. High humidity is great for tropical plants!`;
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
        // IMPLEMENTATION: Default isAutoMode to false for new users
        await setDoc(doc(db, "users", res.user.uid), {
          moisture: 0, temp: 0, humidity: 0, isPumpActive: false, 
          isAutoMode: false, email: email, isVerified: false
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
        
        /* Responsive Design */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        
        /* Mobile First - Default styles */
        .responsive-container {
          width: 100%;
          min-height: 100vh;
          background: #F5F5F5;
          position: relative;
          box-shadow: none;
          border-radius: 0;
        }
        
        /* Smooth scrolling for all scrollable areas */
        .scroll-area-landscape, 
        .responsive-container [style*="overflowY: auto"] {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          overscroll-behavior: contain;
        }
        
        /* For very small screens (under 600px height) */
        @media (max-height: 600px) {
          .scroll-area-landscape {
            max-height: calc(100vh - 140px) !important;
          }
        }
        
        /* Small phones (iPhone SE, etc.) - up to 375px */
        @media (min-width: 320px) and (max-width: 375px) {
          .responsive-container {
            max-width: 100%;
          }
          .moisture-number {
            font-size: 56px !important;
          }
          .card-value {
            font-size: 20px !important;
          }
          .hero-padding {
            padding: 30px !important;
          }
        }
        
        /* Medium phones (iPhone 12/13/14, Pixel) - 376px to 428px */
        @media (min-width: 376px) and (max-width: 428px) {
          .responsive-container {
            max-width: 100%;
          }
          .moisture-number {
            font-size: 64px !important;
          }
        }
        
        /* Large phones (iPhone Plus, Android large) - 429px to 500px */
        @media (min-width: 429px) and (max-width: 500px) {
          .responsive-container {
            max-width: 100%;
          }
          .moisture-number {
            font-size: 72px !important;
          }
        }
        
        /* Tablets (iPad mini, iPad) - 501px to 768px */
        @media (min-width: 501px) and (max-width: 768px) {
          .responsive-container {
            max-width: 550px;
            border-radius: 30px;
            margin: 20px auto;
            min-height: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }
          .moisture-number {
            font-size: 80px !important;
          }
          .grid-gap {
            gap: 20px !important;
          }
        }
        
        /* Small desktops - 769px to 1024px */
        @media (min-width: 769px) and (max-width: 1024px) {
          .responsive-container {
            max-width: 650px;
            border-radius: 35px;
            margin: 30px auto;
            min-height: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          }
          .moisture-number {
            font-size: 88px !important;
          }
          .grid-gap {
            gap: 25px !important;
          }
        }
        
        /* Desktop / Large screens - 1025px and above */
        @media (min-width: 1025px) {
          .responsive-container {
            max-width: 750px;
            border-radius: 40px;
            margin: 40px auto;
            min-height: auto;
            box-shadow: 0 30px 80px rgba(0,0,0,0.25);
          }
          .moisture-number {
            font-size: 96px !important;
          }
          .grid-gap {
            gap: 30px !important;
          }
        }
        
        /* Landscape mode detection */
        @media (orientation: landscape) and (max-height: 500px) {
          .responsive-container {
            max-width: 80%;
            margin: 10px auto;
          }
          .moisture-number {
            font-size: 40px !important;
          }
          .hero-padding {
            padding: 20px !important;
          }
          .scroll-area-landscape {
            max-height: 60vh !important;
            overflow-y: auto !important;
          }
        }
      `}</style>

      <div className="responsive-container">
        {view === 'splash' || view === 'postLoginSplash' ? (
          <div style={{...styles.splashBg, background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
            <img src={logoLocal} alt="Logo" style={{ width: 'auto', height: 140, marginBottom: 15, animation: 'fadeIn 0.8s ease-out', objectFit: 'contain' }} />
            <h1 style={{color: '#1B5E20', fontWeight: '900', fontSize: 28, margin: 0}}>{view === 'postLoginSplash' ? 'Connecting...' : 'SmartSprout'}</h1>
            <p style={{ color: '#666', fontSize: 14, marginTop: 5 }}>{appTagline}</p>
            <div style={{width: '150px', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden', marginTop: 25}}>
              <div style={{height: '100%', background: '#1B5E20', animation: 'loading 2s infinite'}} />
            </div>
          </div>
        ) : view === 'auth' ? (
          <div style={styles.scrollArea}>
            <div style={{...styles.authHeader, marginTop: 50, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <img src={logoLocal} alt="Auth" style={{ width: 'auto', height: 100, marginBottom: 10, objectFit: 'contain' }} />
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
              <div style={{fontWeight: 900, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 8}}><img src={logoLocal} alt="H" style={{width: 28, height: 'auto', objectFit: 'contain'}} /> SmartSprout</div>
            </div>

            <div style={{...styles.scrollArea, ...(window.innerHeight < 500 ? { maxHeight: '60vh', overflowY: 'auto' } : {})}} className="scroll-area-landscape">
              {activeTab === 'home' && (
                <>
                  <div style={{...styles.hero, background: data.isPumpActive ? '#1565C0' : '#1B5E20', padding: 40, borderRadius: 30, color: '#fff', textAlign: 'center', marginBottom: 20}} className="hero-padding">
                    <h1 style={{fontSize: '72px', fontWeight: '900', margin: 0}} className="moisture-number">{data.moisture}%</h1>
                    <p style={{fontSize: 12, letterSpacing: 2, opacity: 0.8}}>SOIL MOISTURE</p>
                  </div>
                  <div style={{...styles.grid, gap: 15}} className="grid-gap">
                    <div style={styles.card}><Thermometer color="#1B5E20" size={24}/><h3 className="card-value">{data.temp.toFixed(1)}°C</h3></div>
                    <div style={styles.card}><Sun color="#1B5E20" size={24}/><h3 className="card-value">{data.humidity.toFixed(1)}%</h3></div>
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

              {activeTab === 'manual' && (
                <div style={{ padding: '10px 20px', animation: 'fadeIn 0.5s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ color: '#1B5E20' }}>User Manual</h3>
                    <div style={{ fontSize: 11, color: '#4CAF50', fontWeight: 'bold' }}>GUIDE</div>
                  </div>
                  
                  <div style={{ background: '#fff', padding: 20, borderRadius: 20, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                      <Power size={20} color="#1B5E20" />
                      <h4 style={{ color: '#333', margin: 0 }}>Pump Control</h4>
                    </div>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 10 }}>
                      • <strong>Manual Mode:</strong> Tap START PUMP to water manually (10 sec max)
                    </p>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                      • <strong>Auto Mode:</strong> Toggle ON - Pump activates when moisture &lt; 30%
                    </p>
                  </div>

                  <div style={{ background: '#fff', padding: 20, borderRadius: 20, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                      <Droplet size={20} color="#1B5E20" />
                      <h4 style={{ color: '#333', margin: 0 }}>Moisture Levels</h4>
                    </div>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>
                      • <strong>0-20%:</strong> Very Dry - Water immediately
                    </p>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>
                      • <strong>21-40%:</strong> Dry - Good time to water
                    </p>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>
                      • <strong>41-60%:</strong> Moist - Optimal range
                    </p>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                      • <strong>61-100%:</strong> Wet - Don't water
                    </p>
                  </div>

                  <div style={{ background: '#fff', padding: 20, borderRadius: 20, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                      <Thermometer size={20} color="#1B5E20" />
                      <h4 style={{ color: '#333', margin: 0 }}>Ideal Conditions</h4>
                    </div>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>
                      • <strong>Temperature:</strong> 18-24°C (65-75°F)
                    </p>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>
                      • <strong>Humidity:</strong> 40-60% for most houseplants
                    </p>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                      • <strong>Light:</strong> Bright indirect sunlight
                    </p>
                  </div>

                  <div style={{ background: '#FFF3E0', padding: 20, borderRadius: 20, borderLeft: '4px solid #FF9800' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                      <AlertCircle size={20} color="#FF9800" />
                      <h4 style={{ color: '#333', margin: 0 }}>Troubleshooting</h4>
                    </div>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>
                      ❌ <strong>Pump not working?</strong> Check WiFi and power
                    </p>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>
                      ❌ <strong>No sensor data?</strong> Ensure ESP32 is powered
                    </p>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                      💡 <strong>Tip:</strong> Use chat assistant for real-time help!
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '15px'}}>
                  <div style={{width: 100, height: 100, background: '#E8F5E9', borderRadius: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 15}}>
                    <User size={50} color="#1B5E20"/>
                  </div>
                  <h3 style={{color: '#333', marginBottom: 20, fontSize: 18}}>{user ? user.email : "Guest"}</h3>
                  <button style={{...styles.primaryBtn, backgroundColor: '#FF5252', width: '200px', padding: '12px 24px'}} onClick={handleLogout}>Sign Out</button>
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
              <div style={activeTab === 'manual' ? styles.navActive : styles.navItem} onClick={() => handleNavAction('manual')}><BookOpen size={24}/><span>Manual</span></div>
              <div style={activeTab === 'account' ? styles.navActive : styles.navItem} onClick={() => handleNavAction('account')}><User size={24}/><span>Account</span></div>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
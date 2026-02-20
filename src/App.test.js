import React, { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { styles } from './styles';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Leaf, Home, BarChart2, User, Power, Thermometer, Sun, MessageCircle, Send, X, Loader2, LogIn } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('splash'); 
  const [activeTab, setActiveTab] = useState('home');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('qrblopez@tip.edu.ph'); // Default as per your req
  const [password, setPassword] = useState('123456');
  const [data, setData] = useState({ moisture: 0, temp: 0, humidity: 0, isPumpActive: false, isAutoMode: true });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        const dataUnsub = onSnapshot(doc(db, "users", u.uid), (s) => {
          if (s.exists()) setData(s.data());
        });
        setTimeout(() => setView('dashboard'), 2000);
        return () => dataUnsub();
      } else {
        setUser(null);
        setTimeout(() => setView('auth'), 2000);
      }
    });
    return () => unsub();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // setView('dashboard') happens automatically in useEffect
    } catch (error) {
      alert("Login Failed: " + error.message);
    }
    setIsBusy(false);
  };

  const handleUpdate = async (update) => {
    setIsBusy(true);
    await updateDoc(doc(db, "users", user.uid), update);
    setTimeout(() => setIsBusy(false), 500);
  };

  const handleLogout = async () => {
    setIsBusy(true);
    await signOut(auth);
    setView('auth'); // Forces back to login
    setIsBusy(false);
  };

  // 1. SPLASH SCREEN
  if (view === 'splash') return (
    <div style={styles.container}>
      <div style={styles.phoneFrame}>
        <div style={styles.splashBg}>
          <Leaf size={70} color="#fff" fill="#fff" />
          <h1 style={{color: '#fff', fontSize: '32px', fontWeight: '900', margin: '15px 0'}}>SmartSprout</h1>
          <div style={{width: '150px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: 10, overflow: 'hidden'}}>
            <div style={{height: '100%', background: '#fff', animation: 'loading 2s infinite'}} />
          </div>
        </div>
      </div>
      <style>{` @keyframes loading { 0% { width: 0% } 100% { width: 100% } } `}</style>
    </div>
  );

  // 2. AUTH SCREEN (LOGIN)
  if (view === 'auth') return (
    <div style={styles.container}>
      <div style={styles.phoneFrame}>
        <div style={{padding: '50px 30px', textAlign: 'center'}}>
          <Leaf size={60} color="#1B5E20" />
          <h2 style={{color: '#1B5E20', fontWeight: '900', fontSize: '24px'}}>Welcome Back</h2>
          <p style={{color: '#666', fontSize: '14px'}}>Login to manage your plants</p>
          
          <form onSubmit={handleLogin} style={{marginTop: '40px'}}>
            <div style={styles.inputGroup}>
              <input 
                style={styles.inputField} type="email" placeholder="Email Address"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
            <div style={styles.inputGroup}>
              <input 
                style={styles.inputField} type="password" placeholder="Password"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>
            <button type="submit" style={styles.primaryBtn} disabled={isBusy}>
              {isBusy ? <Loader2 style={{animation:'spin 1s linear infinite'}}/> : <><LogIn size={20}/> Sign In</>}
            </button>
          </form>
        </div>
      </div>
      <style>{` @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } } `}</style>
    </div>
  );

  // 3. DASHBOARD
  return (
    <div style={styles.container}>
      <div style={styles.phoneFrame}>
        
        {/* HEADER */}
        <div style={{padding: '30px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{fontWeight: 900, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 5}}>
            <Leaf size={20} fill="#1B5E20"/> SmartSprout
          </div>
          {isBusy && <Loader2 size={18} color="#1B5E20" style={{animation:'spin 1s linear infinite'}}/>}
        </div>

        <div style={styles.scrollArea}>
          {activeTab === 'home' && (
            <>
              <div style={{...styles.hero, background: data.isPumpActive ? '#1565C0' : '#1B5E20', transition: '0.5s'}}>
                <h1 style={{fontSize: '60px', fontWeight: '900', margin: 0}}>{data.moisture}%</h1>
                <p style={{fontSize: 12, letterSpacing: 2, opacity: 0.8}}>SOIL MOISTURE</p>
              </div>

              <div style={{display:'flex', gap: '10px', marginBottom: 15}}>
                <div style={{flex:1, background:'#F9FBF9', padding:15, borderRadius:25, textAlign:'center', border:'1px solid #EEE'}}>
                  <Thermometer color="#1B5E20" size={20}/> <h3>{data.temp}°C</h3>
                </div>
                <div style={{flex:1, background:'#F9FBF9', padding:15, borderRadius:25, textAlign:'center', border:'1px solid #EEE'}}>
                  <Sun color="#1B5E20" size={20}/> <h3>{data.humidity}%</h3>
                </div>
              </div>

              <div style={{display:'flex', justifyContent:'space-between', padding: 15, background: '#F5F5F5', borderRadius: 20, marginBottom: 15}}>
                <span style={{fontWeight: 'bold'}}>Auto Mode</span>
                <input type="checkbox" checked={data.isAutoMode} onChange={(e) => handleUpdate({isAutoMode: e.target.checked})}/>
              </div>

              <button 
                disabled={data.isAutoMode || isBusy} 
                style={{
                  width: '100%', padding: '18px', borderRadius: '22px', border: 'none', fontWeight: '900',
                  backgroundColor: data.isAutoMode ? '#EEE' : data.isPumpActive ? '#FFCDD2' : '#C8E6C9',
                  color: data.isPumpActive ? '#D32F2F' : '#2E7D32',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10
                }}
                onClick={() => handleUpdate({isPumpActive: !data.isPumpActive})}
              >
                {isBusy ? <Loader2 style={{animation:'spin 1s linear infinite'}}/> : <><Power size={20}/> {data.isPumpActive ? "STOP PUMP" : "START PUMP"}</>}
              </button>
            </>
          )}

          {activeTab === 'account' && (
            <div style={{textAlign: 'center'}}>
              <div style={{width: 80, height: 80, background: '#F0F0F0', borderRadius: 50, margin: '20px auto', display: 'flex', justifyContent: 'center', alignItems: 'center'}}><User size={40}/></div>
              <h3>{user?.email}</h3>
              <p style={{color: '#666', fontSize: '12px'}}>Member since 2026</p>
              <button style={{...styles.primaryBtn, backgroundColor: '#FF5252', marginTop: 30}} onClick={handleLogout}>
                {isBusy ? <Loader2 style={{animation:'spin 1s linear infinite'}}/> : "Sign Out"}
              </button>
            </div>
          )}
        </div>

        {/* CHAT HEAD (FLOATING BUBBLE) */}
        <div style={styles.chatHead} onClick={() => setIsChatOpen(!isChatOpen)}>
          {isChatOpen ? <X color="#fff"/> : <MessageCircle color="#fff"/>}
        </div>

        {isChatOpen && (
          <div style={{...styles.chatWindow, position: 'absolute', bottom: '170px', right: '20px', width: '85%', height: '400px', backgroundColor: '#fff', borderRadius: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 1001, overflow: 'hidden', border: '1px solid #eee'}}>
            <div style={{padding: 15, background: '#1B5E20', color: '#fff', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between'}}>
              Sprout AI Chat
              <X size={18} style={{cursor: 'pointer'}} onClick={() => setIsChatOpen(false)}/>
            </div>
            <div style={{flex: 1, padding: 15, overflowY: 'auto', background: '#F9FBF9'}}>
              <div style={{background: '#E8F5E9', padding: 12, borderRadius: '15px 15px 15px 0', marginBottom: 10, fontSize: 13, color: '#1B5E20'}}>
                Hi! Monitoring moisture... currently at <b>{data.moisture}%</b>.
              </div>
            </div>
            <div style={{padding: 10, display: 'flex', gap: 5, borderTop: '1px solid #eee'}}>
              <input style={{flex: 1, border: 'none', outline: 'none'}} placeholder="Ask Sprout..."/>
              <button style={{border: 'none', background: 'none'}}><Send size={20} color="#1B5E20"/></button>
            </div>
          </div>
        )}

        {/* NAVBAR */}
        <nav style={styles.navbar}>
          <div style={activeTab === 'home' ? styles.navActive : styles.navItem} onClick={() => setActiveTab('home')}><Home size={24}/></div>
          <div style={activeTab === 'stats' ? styles.navActive : styles.navItem} onClick={() => setActiveTab('stats')}><BarChart2 size={24}/></div>
          <div style={activeTab === 'account' ? styles.navActive : styles.navItem} onClick={() => setActiveTab('account')}><User size={24}/></div>
        </nav>
      </div>
      <style>{` @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } } `}</style>
    </div>
  );
}
export const styles = {
  container: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh', 
    backgroundColor: '#E8EBE8', 
    margin: 0 
  },
  phoneFrame: { 
    width: '100%', 
    maxWidth: '380px', 
    height: '100vh', 
    maxHeight: '820px', 
    backgroundColor: '#fff', 
    borderRadius: window.innerWidth > 500 ? '45px' : '0px', 
    border: window.innerWidth > 500 ? '10px solid #222' : 'none', 
    display: 'flex', 
    flexDirection: 'column', 
    position: 'relative', 
    overflow: 'hidden',
    boxShadow: '0 30px 60px rgba(0,0,0,0.15)'
  },
  splashBg: { 
    height: '100%', 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#1B5E20' 
  },
  scrollArea: { 
    flex: 1, 
    overflowY: 'auto', 
    padding: '20px', 
    paddingBottom: '120px' // Increased to prevent navbar overlap
  },
  
  // Auth Layout
  authHeader: { textAlign: 'center', marginTop: '20px', marginBottom: '20px' },
  inputGroup: { marginBottom: '12px' },
  inputField: { 
    width: '100%', 
    padding: '15px', 
    borderRadius: '15px', 
    border: '1.5px solid #222', 
    backgroundColor: '#F9F9F9', 
    outline: 'none', 
    boxSizing: 'border-box', 
    fontSize: '14px', 
    fontWeight: 'bold'
  },
  primaryBtn: { 
    width: '100%', 
    backgroundColor: '#1B5E20', 
    color: '#fff', 
    padding: '16px', 
    border: 'none', 
    borderRadius: '15px', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: '10px'
  },
  guestBtn: { 
    width: '100%', 
    backgroundColor: 'transparent', 
    color: '#1B5E20', 
    padding: '12px', 
    border: '2px solid #1B5E20', 
    borderRadius: '15px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    marginTop: '10px' 
  },

  // Dashboard - Homepage Layout Fixes
  hero: { 
    padding: '40px 20px', // Adjusted for centered look in image
    borderRadius: '35px', 
    color: '#fff', 
    textAlign: 'center', 
    marginBottom: '25px',
    boxSizing: 'border-box'
  },
  heroVal: { 
    fontSize: '72px', 
    fontWeight: '900', 
    margin: 0,
    lineHeight: '1'
  },
  heroLabel: { 
    fontSize: '12px', 
    letterSpacing: '2px', 
    opacity: 0.8, 
    fontWeight: 'bold',
    marginTop: '5px',
    textTransform: 'uppercase'
  },
  
  grid: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    marginBottom: '20px', 
    gap: '15px' 
  },
  card: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: '20px 15px', 
    borderRadius: '25px', 
    textAlign: 'center', 
    border: '1px solid #F0F0F0', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
  },

  controlBox: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '20px', 
    backgroundColor: '#F5F5F5', 
    borderRadius: '25px', 
    marginBottom: '15px' 
  },
  toggle: { 
    width: '55px', 
    height: '28px', 
    borderRadius: '20px', 
    padding: '3px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    transition: '0.3s' 
  },
  toggleDot: { 
    width: '22px', 
    height: '22px', 
    backgroundColor: '#fff', 
    borderRadius: '50%', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)', 
    transition: '0.3s' 
  },

  actionBtn: { 
    width: '100%', 
    padding: '22px', 
    borderRadius: '25px', 
    border: 'none', 
    fontWeight: '900', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: '12px', 
    cursor: 'pointer', 
    transition: '0.2s',
    boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
  },

  navbar: { 
    position: 'absolute', 
    bottom: '0', 
    left: '0', 
    right: '0', 
    height: '85px', 
    backgroundColor: '#fff', 
    borderTop: '1px solid #F0F0F0', 
    display: 'flex', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    zIndex: 10, 
    paddingBottom: '15px' 
  },
  navItem: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: '6px', 
    cursor: 'pointer', 
    fontSize: '11px', 
    color: '#AAA',
    transition: '0.2s'
  },
  navActive: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: '6px', 
    cursor: 'pointer', 
    fontSize: '11px', 
    color: '#1B5E20',
    fontWeight: 'bold'
  },
  
  // Floating Chat System (Fixed to match Image)
  chatHead: {
    position: 'absolute', 
    bottom: '105px', // Sits perfectly above navbar
    right: '20px', 
    width: '60px', 
    height: '60px',
    backgroundColor: '#1B5E20', 
    borderRadius: '50%', 
    display: 'flex', 
    justifyContent: 'center',
    alignItems: 'center', 
    boxShadow: '0 8px 25px rgba(0,0,0,0.2)', 
    zIndex: 1000,
    cursor: 'pointer'
  },
  chatWindow: { 
    position: 'absolute', 
    bottom: '175px', 
    left: '20px', 
    right: '20px', 
    height: '420px', // Taller to fit the conversation in image
    backgroundColor: '#fff', 
    borderRadius: '25px', 
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)', 
    display: 'flex', 
    flexDirection: 'column', 
    zIndex: 1001, 
    overflow: 'hidden',
    animation: 'slideUp 0.3s ease-out'
  }
};
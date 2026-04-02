'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password,    setPassword]    = useState('')
  const [showPwd,     setShowPwd]     = useState(false)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Mot de passe incorrect.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:       '100vh',
      background:      '#f4f3ef',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      fontFamily:      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        width:        '100%',
        maxWidth:     '380px',
        padding:      '0 24px',
      }}>

        {/* Logo + titre */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width:          '52px',
            height:         '52px',
            borderRadius:   '14px',
            background:     '#378ADD',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 18px',
            boxShadow:      '0 4px 16px rgba(55,138,221,0.35)',
          }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="white">
              <rect x="3"  y="3"  width="9" height="9" rx="2"/>
              <rect x="14" y="3"  width="9" height="9" rx="2"/>
              <rect x="3"  y="14" width="9" height="9" rx="2"/>
              <rect x="14" y="14" width="9" height="9" rx="2"/>
            </svg>
          </div>
          <h1 style={{
            fontSize:   '22px',
            fontWeight: 600,
            color:      '#1a1a18',
            margin:     '0 0 6px',
            letterSpacing: '-0.3px',
          }}>
            MedApp
          </h1>
          <p style={{ fontSize: '13px', color: '#888780', margin: 0 }}>
            Back-office · Accès restreint
          </p>
        </div>

        {/* Carte */}
        <div style={{
          background:   '#ffffff',
          borderRadius: '18px',
          padding:      '32px',
          boxShadow:    '0 2px 24px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.08)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Champ mot de passe */}
            <div>
              <label style={{
                display:      'block',
                fontSize:     '12px',
                fontWeight:   500,
                color:        '#5f5e5a',
                marginBottom: '7px',
              }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••••••"
                  autoFocus
                  style={{
                    width:        '100%',
                    background:   '#f4f3ef',
                    color:        '#1a1a18',
                    border:       `0.5px solid ${error ? 'rgba(121,31,31,0.5)' : 'rgba(0,0,0,0.18)'}`,
                    borderRadius: '10px',
                    padding:      '11px 44px 11px 14px',
                    fontSize:     '15px',
                    letterSpacing: showPwd ? 'normal' : '0.15em',
                    outline:      'none',
                    boxSizing:    'border-box',
                    transition:   'border 0.15s',
                  }}
                />
                {/* Bouton œil */}
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{
                    position:   'absolute',
                    right:      '12px',
                    top:        '50%',
                    transform:  'translateY(-50%)',
                    background: 'none',
                    border:     'none',
                    cursor:     'pointer',
                    padding:    '4px',
                    color:      '#888780',
                    display:    'flex',
                    alignItems: 'center',
                  }}
                  tabIndex={-1}
                >
                  {showPwd ? (
                    /* Œil barré */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    /* Œil normal */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Message d'erreur */}
              {error && (
                <p style={{ fontSize: '12px', color: '#791f1f', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>⚠</span> {error}
                </p>
              )}
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading || !password}
              style={{
                background:    loading || !password ? 'rgba(55,138,221,0.5)' : '#378ADD',
                color:         'white',
                border:        'none',
                borderRadius:  '10px',
                padding:       '12px',
                fontSize:      '14px',
                fontWeight:    600,
                cursor:        loading || !password ? 'not-allowed' : 'pointer',
                letterSpacing: '0.01em',
                transition:    'all 0.15s',
                marginTop:     '4px',
              }}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#b8b7b2', marginTop: '24px' }}>
          MedApp © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

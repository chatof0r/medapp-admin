export default function UnderConstruction({ title }: { title: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '1rem',
      textAlign: 'center',
    }}>
      <div style={{fontSize: '3rem'}}>🚧</div>
      <h1 style={{fontSize: '1.5rem', fontWeight: 600, color: '#1a1a18'}}>{title}</h1>
      <p style={{color: '#888780', fontSize: '0.875rem'}}>Cette section est en cours de construction.</p>
    </div>
  )
}

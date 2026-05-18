import React, { useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css'
import App from './App'
import './styles/globals.css'

const RPC = 'https://devnet.helius-rpc.com/?api-key=f538e5d6-9fbb-4a76-8939-9eaa615d875e'

function Root() {
  // Empty array = auto-detect all installed wallet extensions (Phantom, Solflare, Backpack, etc.)
  const wallets = useMemo(() => [], [])

  return (
    <ConnectionProvider endpoint={RPC} config={{ commitment: 'confirmed' }}>
      <WalletProvider
        wallets={wallets}
        autoConnect
        onError={(error) => {
          // Suppress WalletNotReadyError — happens when wallet extension not installed
          if (error.name !== 'WalletNotReadyError') {
            console.warn('Wallet error:', error.name, error.message)
          }
        }}
      >
        <WalletModalProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)

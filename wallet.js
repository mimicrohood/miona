(() => {
  const TARGET = {
    chainId: '0x1237',
    chainName: 'Robinhood Chain',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.mainnet.chain.robinhood.com'],
    blockExplorerUrls: ['https://robinhoodchain.blockscout.com']
  };

  const discovered = new Map();
  let activeProvider = null;
  let activeAddress = '';
  let busy = false;

  const short = address => `${address.slice(0, 6)}…${address.slice(-4)}`;
  const buttons = () => [...document.querySelectorAll('[data-connect]')];

  function toast(message) {
    const el = document.querySelector('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function render() {
    buttons().forEach(button => {
      button.disabled = busy;
      button.classList.toggle('connected', Boolean(activeAddress));
      button.textContent = busy ? 'CONNECTING…' : activeAddress ? short(activeAddress) : button.classList.contains('mini') ? 'CONNECT' : 'CONNECT WALLET';
      button.title = activeAddress ? `Connected: ${activeAddress}` : 'Connect an EVM wallet';
    });
  }

  function rememberProvider(provider, info = {}) {
    if (!provider || typeof provider.request !== 'function') return;
    const key = info.uuid || info.rdns || info.name || `wallet-${discovered.size}`;
    if (![...discovered.values()].some(item => item.provider === provider)) {
      discovered.set(key, { provider, info: { name: info.name || provider.name || 'Browser Wallet', icon: info.icon || '' } });
    }
  }

  window.addEventListener('eip6963:announceProvider', event => {
    rememberProvider(event.detail.provider, event.detail.info);
  });
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  if (window.ethereum?.providers?.length) {
    window.ethereum.providers.forEach((provider, index) => rememberProvider(provider, { name: provider.isRabby ? 'Rabby' : provider.isMetaMask ? 'MetaMask' : `Browser Wallet ${index + 1}` }));
  } else if (window.ethereum) {
    rememberProvider(window.ethereum, { name: window.ethereum.isRabby ? 'Rabby' : window.ethereum.isMetaMask ? 'MetaMask' : 'Browser Wallet' });
  }

  function closeChooser() {
    document.querySelector('#walletChooser')?.remove();
  }

  function chooseProvider() {
    const options = [...discovered.values()];
    if (!options.length) {
      showChooser([]);
      return Promise.resolve(null);
    }
    if (options.length === 1) return Promise.resolve(options[0].provider);
    return new Promise(resolve => showChooser(options, resolve));
  }

  function showChooser(options, resolve = () => {}) {
    closeChooser();
    const modal = document.createElement('div');
    modal.id = 'walletChooser';
    modal.className = 'wallet-chooser';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Choose wallet');
    modal.innerHTML = `<div class="wallet-dialog">
      <div class="wallet-dialog-head"><span>CONNECT WALLET</span><button type="button" data-wallet-close aria-label="Close">×</button></div>
      <div class="wallet-network"><i></i><div><b>ROBINHOOD CHAIN</b><span>CHAIN ID 4663</span></div></div>
      <div class="wallet-options"></div>
      <p class="wallet-note">MIONA never asks for your seed phrase or private key.</p>
    </div>`;
    const list = modal.querySelector('.wallet-options');
    if (!options.length) {
      list.innerHTML = `<div class="wallet-missing"><b>NO EVM WALLET DETECTED</b><span>Install or open Robinhood Wallet, MetaMask, Rabby, or Coinbase Wallet, then refresh this page.</span></div>`;
    } else {
      options.forEach(({ provider, info }) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'wallet-option';
        if (info.icon && /^(data:|https?:)/.test(info.icon)) {
          const image = document.createElement('img');
          image.src = info.icon;
          image.alt = '';
          button.appendChild(image);
        } else {
          const pixel = document.createElement('span');
          pixel.className = 'wallet-pixel';
          pixel.textContent = '◆';
          button.appendChild(pixel);
        }
        const name = document.createElement('b');
        name.textContent = info.name;
        const action = document.createElement('span');
        action.textContent = 'CONNECT ↗';
        button.append(name, action);
        button.addEventListener('click', () => { closeChooser(); resolve(provider); });
        list.appendChild(button);
      });
    }
    modal.querySelector('[data-wallet-close]').addEventListener('click', () => { closeChooser(); resolve(null); });
    modal.addEventListener('click', event => { if (event.target === modal) { closeChooser(); resolve(null); } });
    document.body.appendChild(modal);
  }

  async function ensureRobinhood(provider) {
    const chainId = await provider.request({ method: 'eth_chainId' });
    if (chainId.toLowerCase() === TARGET.chainId) return;
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: TARGET.chainId }] });
    } catch (error) {
      if (error.code !== 4902 && error.code !== -32603) throw error;
      await provider.request({ method: 'wallet_addEthereumChain', params: [TARGET] });
    }
  }

  function bindProvider(provider) {
    if (activeProvider === provider) return;
    activeProvider = provider;
    provider.on?.('accountsChanged', accounts => {
      activeAddress = accounts?.[0] || '';
      render();
      toast(activeAddress ? `WALLET CONNECTED // ${short(activeAddress)}` : 'WALLET DISCONNECTED');
    });
    provider.on?.('chainChanged', chainId => {
      toast(chainId.toLowerCase() === TARGET.chainId ? 'ROBINHOOD CHAIN CONNECTED' : 'NETWORK CHANGED');
    });
    provider.on?.('disconnect', () => { activeAddress = ''; render(); });
  }

  async function connect() {
    if (busy) return;
    if (activeAddress) {
      await navigator.clipboard?.writeText(activeAddress).catch(() => {});
      toast('WALLET ADDRESS COPIED');
      return;
    }
    const provider = await chooseProvider();
    if (!provider) return;
    busy = true;
    render();
    try {
      bindProvider(provider);
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts?.[0]) throw new Error('No account returned');
      await ensureRobinhood(provider);
      activeAddress = accounts[0];
      render();
      toast(`CONNECTED TO ROBINHOOD CHAIN // ${short(activeAddress)}`);
      window.dispatchEvent(new CustomEvent('miona:wallet-connected', { detail: { address: activeAddress, provider } }));
    } catch (error) {
      activeAddress = '';
      const rejected = error?.code === 4001;
      toast(rejected ? 'CONNECTION CANCELLED' : `WALLET ERROR // ${error?.message || 'TRY AGAIN'}`);
    } finally {
      busy = false;
      render();
    }
  }

  async function restore() {
    const first = [...discovered.values()][0]?.provider;
    if (!first) return;
    try {
      const accounts = await first.request({ method: 'eth_accounts' });
      if (accounts?.[0]) {
        bindProvider(first);
        activeAddress = accounts[0];
        render();
      }
    } catch (_) {}
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-connect]');
    if (!button) return;
    event.preventDefault();
    connect();
  });

  render();
  setTimeout(restore, 250);
  window.MionaWallet = { connect, targetChain: TARGET, get address() { return activeAddress; }, get provider() { return activeProvider; } };
})();


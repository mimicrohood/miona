# MIONA

An interactive pixel-life collective prototype for Robinhood Chain.

Each NFT is a MIONA node: an individual organism with a role, state, and memory. Nodes exchange pulses and temporarily coordinate into visible Constellations.

## Run locally

```powershell
python -m http.server 4174 --bind 127.0.0.1
```

Open `http://127.0.0.1:4174/`.

## Pages

- `index.html` — public mint and living swarm
- `nodes.html` — holder-owned lives and activation tiers
- `field.html` — public collection explorer
- `docs.html` — full protocol documentation and risks
- `verify.html` — seed, genome, and art commitment checks
- `ranks.html` — cluster and organism leaderboards
- `terminal.html` — interactive swarm terminal
- `buy.html` — $MIONA access and token distribution

Wallet, mint, verification, ranking, and swap actions are simulated until production contracts are connected.

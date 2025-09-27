# IND EVM Pack

This folder contains two tracks:

1) ERC-20 IND on an existing EVM chain (Sepolia/mainnet)
2) Your own EVM chain (Geth) with IND as native currency

---

## 1) ERC-20 IND (Sepolia)

Setup:

1. Copy env and fill values

```
cp .env.example .env
```

Set in `.env`:

- INFURA_KEY=your_infura_project_id
- PRIVATE_KEY=0xYourDeployerPrivateKey (test wallet for Sepolia)

2. Install and compile

```
npm install
npx hardhat compile
```

3. Deploy token

```
npx hardhat run scripts/deploy.js --network sepolia
```

4. Use the printed contract address in your frontend wallet page (ERC-20 section)
- Network: Sepolia
- Token Contract: <printed address>
- Decimals: 18

---

## 2) Own EVM Chain (Geth) with IND native

Files in `geth/`:
- `genesis.json` – sample genesis
- `geth.service` – systemd unit template
- `nginx.conf.example` – reverse proxy with TLS for RPC endpoint
- `add-network.json` – MetaMask "Add Network" template

Steps (Ubuntu 22.04 suggested):

1. Install geth

```
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt update && sudo apt install -y geth
```

2. Create a data dir and init

```
mkdir -p /var/lib/ind-geth
sudo chown -R $USER:$USER /var/lib/ind-geth
geth init --datadir /var/lib/ind-geth geth/genesis.json
```

3. Create a systemd service

- Copy `geth/geth.service` to `/etc/systemd/system/ind-geth.service`
- Edit ExecStart RPC domain and ports

```
sudo systemctl daemon-reload
sudo systemctl enable ind-geth
sudo systemctl start ind-geth
sudo systemctl status ind-geth
```

4. Set up Nginx TLS reverse proxy

- Copy `geth/nginx.conf.example` into your Nginx sites-available and enable it
- Ensure valid TLS certs (Let's Encrypt)

5. Add network to MetaMask

- Open `geth/add-network.json`, fill your RPC URL and Block Explorer URL
- In MetaMask → Add Network → Add manually

Notes:
- Tune chainId in `genesis.json` (13579 by default)
- You may want to run multiple validators/peers and expose bootnodes
- Consider a block explorer like blockscout for a full experience

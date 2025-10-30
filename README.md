# Shallot - Decentralized Forum Voting System

A blockchain-based decentralized forum voting system built on the Sui blockchain. This project demonstrates a complete implementation of programmatic governance with pluggable verification systems and anonymous voting mechanisms.

## Projects Overview

* **Smart Contracts**: 6 Move modules handling forum governance, membership, and voting
* **Frontend Application**: React-based web interface for seamless user interaction

## 🚀 Getting Started

### Prerequisites

* Sui CLI (latest version)
* Node.js (v16 or higher)
* Sui Wallet extension

### Installation & Build

1. **Install Sui CLI**
```bash
# Follow official guide: https://docs.sui.io/guides/developer/getting-started/sui-install
```

2. **Clone the repository**
```bash
git clone [your-repository-url]
cd shallot
```

3. **Configure Sui Network**
```bash
# Switch to testnet
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
sui client switch --env testnet

# Get testnet tokens from https://faucet.sui.io/
```

4. **Build and Deploy**
```bash
sui move build
sui move test
sui client publish --gas-budget 100000000
```

5. **Setup Frontend**
```bash
cd app
pnpm install
pnpm dev
```

## 🏛️ Smart Contracts



This project implements a decentralized governance system where founders have no special privileges. Forums use pluggable verification (password, NFT, token holding) for membership control. The system ensures one active poll per forum to avoid decision conflicts.

**How it Works**: We built 6 Move modules - forum governance, pluggable verifier, NFT-based membership, poll lifecycle management, anonymous ballot system, and event emitters. Founders must pass verification like any member, and all metadata changes require democratic voting.

## 🗳️ Frontend Application



Building on the smart contracts, we've created a React-based interface with TypeScript for type safety. The frontend uses custom hooks (useForum, useMembership, usePoll) to interact with the blockchain, implementing the complete user flow from forum creation to poll execution.

**Key Features**: Real-time wallet connection, forum browsing and creation, membership verification interface, anonymous voting UI, and poll result visualization. All blockchain interactions are handled through Sui TypeScript SDK with proper error handling and loading states.
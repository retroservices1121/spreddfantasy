### 15. src/lib/blockchain/contracts.ts
```typescript
import { ethers } from 'ethers';
import { useContract, useProvider, useSigner } from 'wagmi';
import SpreadMarketsABI from './abis/SpreadMarkets.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

export function useSpreadMarketsContract() {
  const provider = useProvider();
  const { data: signer } = useSigner();

  const contract = useContract({
    address: CONTRACT_ADDRESS,
    abi: SpreadMarketsABI,
    signerOrProvider: signer || provider,
  });

  return contract;
}

export class SpreadMarketsContract {
  private contract: ethers.Contract;

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      SpreadMarketsABI,
      signer || provider
    );
  }

  async createLeague(
    name: string,
    leagueType: string,
    entryFee: string,
    maxParticipants: number,
    duration: number
  ) {
    const tx = await this.contract.createLeague(
      name,
      leagueType,
      ethers.parseEther(entryFee),
      maxParticipants,
      duration
    );
    return await tx.wait();
  }

  async joinLeague(leagueId: number, selectedMarkets: number[], entryFee: string) {
    const tx = await this.contract.joinLeague(
      leagueId,
      selectedMarkets,
      { value: ethers.parseEther(entryFee) }
    );
    return await tx.wait();
  }

  async createMarket(title: string, category: string, points: number, kalshiId: string) {
    const tx = await this.contract.createMarket(title, category, points, kalshiId);
    return await tx.wait();
  }

  async makePrediction(leagueId: number, marketId: number, prediction: boolean) {
    const tx = await this.contract.makePrediction(leagueId, marketId, prediction);
    return await tx.wait();
  }

  async resolveMarket(marketId: number, outcome: boolean) {
    const tx = await this.contract.resolveMarket(marketId, outcome);
    return await tx.wait();
  }

  async calculateLeaguePoints(leagueId: number) {
    const tx = await this.contract.calculateLeaguePoints(leagueId);
    return await tx.wait();
  }

  async resolveLeague(leagueId: number) {
    const tx = await this.contract.resolveLeague(leagueId);
    return await tx.wait();
  }

  async getLeague(leagueId: number) {
    return await this.contract.leagues(leagueId);
  }

  async getMarket(marketId: number) {
    return await this.contract.markets(marketId);
  }

  async getUserPortfolio(leagueId: number, userAddress: string) {
    return await this.contract.getUserPortfolio(leagueId, userAddress);
  }

  async getLeagueLeaderboard(leagueId: number) {
    return await this.contract.getLeagueLeaderboard(leagueId);
  }
}

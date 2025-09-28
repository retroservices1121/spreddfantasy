const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying SpreadMarkets contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the contract
  const SpreadMarkets = await ethers.getContractFactory("SpreadMarkets");
  const spreadMarkets = await SpreadMarkets.deploy();

  await spreadMarkets.deployed();

  console.log("SpreadMarkets deployed to:", spreadMarkets.address);
  console.log("Transaction hash:", spreadMarkets.deployTransaction.hash);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await spreadMarkets.deployTransaction.wait(5);

  // Verify contract on Etherscan (Base)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: spreadMarkets.address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  // Save contract address and ABI
  const fs = require("fs");
  const contractsDir = "../src/lib/blockchain/abis";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    `${contractsDir}/SpreadMarkets.json`,
    JSON.stringify({
      address: spreadMarkets.address,
      abi: JSON.parse(spreadMarkets.interface.format('json'))
    }, null, 2)
  );

  console.log("Contract ABI saved to:", `${contractsDir}/SpreadMarkets.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

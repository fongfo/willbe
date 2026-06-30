import { ethers, network } from 'hardhat';

// Deploys ProofOfPlan with the deployer as the initial owner (the custodial
// anchoring operator). Run against Amoy with:
//   npm run deploy:amoy
// which requires AMOY_RPC_URL + a funded DEPLOYER_PRIVATE_KEY in the environment.
async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      'No deployer account configured. Set DEPLOYER_PRIVATE_KEY in the environment.'
    );
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  // eslint-disable-next-line no-console
  console.log(
    `Deploying ProofOfPlan to "${network.name}" from ${deployer.address} (balance ${ethers.formatEther(balance)} MATIC)`
  );

  const factory = await ethers.getContractFactory('ProofOfPlan');
  const contract = await factory.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  // eslint-disable-next-line no-console
  console.log(`ProofOfPlan deployed at: ${address}`);
  // eslint-disable-next-line no-console
  console.log(
    `Verify with: npx hardhat verify --network ${network.name} ${address} ${deployer.address}`
  );
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});

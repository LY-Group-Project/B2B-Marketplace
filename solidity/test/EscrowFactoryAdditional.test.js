const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowFactory additional unit tests", function () {
  let KooshCoin, kooshCoin, EscrowFactory, escrowFactory;
  let owner, buyer, seller, arbitrator, stranger;
  const amount = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, buyer, seller, arbitrator, stranger] = await ethers.getSigners();
    KooshCoin = await ethers.getContractFactory("KooshCoin");
    kooshCoin = await KooshCoin.deploy(owner.address);
    await kooshCoin.waitForDeployment();

    EscrowFactory = await ethers.getContractFactory("EscrowFactory");
  });

  async function deployFactory() {
    escrowFactory = await EscrowFactory.deploy(kooshCoin.target);
    await escrowFactory.waitForDeployment();
    // grant minter role to factory
    await kooshCoin.grantRole(
      await kooshCoin.MINTER_ROLE(),
      escrowFactory.target
    );
  }

  async function getEscrowInstance(address) {
    const Escrow = await ethers.getContractFactory("Escrow");
    return Escrow.attach(address);
  }

  it("factory constructor rejects zero token address", async function () {
    await expect(EscrowFactory.deploy(ethers.ZeroAddress)).to.be.revertedWith(
      "Invalid token address"
    );
  });

  it("getEscrowCount increments when creating escrows", async function () {
    await deployFactory();
    expect(await escrowFactory.getEscrowCount()).to.equal(0);
    const tx = await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbitrator.address,
      amount
    );
    await tx.wait();
    expect(await escrowFactory.getEscrowCount()).to.equal(1);
  });

  it("getPaginatedEscrows reverts when page is out of bounds", async function () {
    await deployFactory();
    await expect(escrowFactory.getPaginatedEscrows(0, 1)).to.be.revertedWith(
      "Page is out of bounds."
    );
    // create one and then request out-of-bounds page
    await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbitrator.address,
      amount
    );
    await expect(escrowFactory.getPaginatedEscrows(1, 1)).to.be.revertedWith(
      "Page is out of bounds."
    );
  });

  it("confirmDelivery cannot be called twice and enforces locked state", async function () {
    await deployFactory();
    const tx = await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbitrator.address,
      amount
    );
    const receipt = await tx.wait();
    const escrowAddress = receipt.logs.find(
      (l) => l.fragment && l.fragment.name === "NewEscrowCreated"
    ).args.escrowContractAddress;
    const escrow = await getEscrowInstance(escrowAddress);

    // first confirmation succeeds
    await expect(escrow.connect(buyer).confirmDelivery()).to.emit(
      escrow,
      "DeliveryConfirmed"
    );
    // second confirmation should revert because state is not Locked
    await expect(escrow.connect(buyer).confirmDelivery()).to.be.revertedWith(
      "Escrow not locked."
    );
  });

  it("releaseFunds cannot be called before buyer confirms", async function () {
    await deployFactory();
    const tx = await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbitrator.address,
      amount
    );
    const receipt = await tx.wait();
    const escrowAddress = receipt.logs.find(
      (l) => l.fragment && l.fragment.name === "NewEscrowCreated"
    ).args.escrowContractAddress;
    const escrow = await getEscrowInstance(escrowAddress);

    await expect(escrow.connect(seller).releaseFunds()).to.be.revertedWith(
      "Release not pending."
    );
  });

  it("resolveDispute rejects invalid winner addresses", async function () {
    await deployFactory();
    const tx = await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbitrator.address,
      amount
    );
    const receipt = await tx.wait();
    const escrowAddress = receipt.logs.find(
      (l) => l.fragment && l.fragment.name === "NewEscrowCreated"
    ).args.escrowContractAddress;
    const escrow = await getEscrowInstance(escrowAddress);

    await expect(escrow.connect(buyer).raiseDispute()).to.emit(
      escrow,
      "DisputeRaised"
    );
    // arbitrator tries to resolve in favor of a stranger -> should revert
    await expect(
      escrow.connect(arbitrator).resolveDispute(stranger.address)
    ).to.be.revertedWith("Winner must be buyer or seller.");
  });

  it("claimFundsAfterTimeout reverts before timeout", async function () {
    await deployFactory();
    const tx = await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbitrator.address,
      amount
    );
    const receipt = await tx.wait();
    const escrowAddress = receipt.logs.find(
      (l) => l.fragment && l.fragment.name === "NewEscrowCreated"
    ).args.escrowContractAddress;
    const escrow = await getEscrowInstance(escrowAddress);

    await expect(
      escrow.connect(seller).claimFundsAfterTimeout()
    ).to.be.revertedWith("Timeout period has not passed.");
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowFactory & Escrow Combined Flow", function () {
  let KooshCoin, kooshCoin, EscrowFactory, escrowFactory;
  let owner, buyer, seller, arbitrator;
  const amount = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, buyer, seller, arbitrator] = await ethers.getSigners();
    KooshCoin = await ethers.getContractFactory("KooshCoin");
    kooshCoin = await KooshCoin.deploy(owner.address);
    await kooshCoin.waitForDeployment();

    EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    escrowFactory = await EscrowFactory.deploy(kooshCoin.target);
    await escrowFactory.waitForDeployment();

    // Grant MINTER_ROLE on the token to the factory so it can mint into escrows
    await kooshCoin.grantRole(
      await kooshCoin.MINTER_ROLE(),
      escrowFactory.target
    );
  });

  async function getEscrowInstance(address) {
    const Escrow = await ethers.getContractFactory("Escrow");
    return Escrow.attach(address);
  }

  it("should only allow owner to create escrow", async function () {
    await expect(
      escrowFactory
        .connect(buyer)
        .createEscrow(buyer.address, seller.address, arbitrator.address, amount)
    ).to.be.reverted; // Accept generic revert (owner check may use custom error)
  });

  it("should revert on invalid addresses or zero amount", async function () {
    await expect(
      escrowFactory.createEscrow(
        ethers.ZeroAddress,
        seller.address,
        arbitrator.address,
        amount
      )
    ).to.be.revertedWith("Factory: Invalid buyer address.");

    await expect(
      escrowFactory.createEscrow(
        buyer.address,
        ethers.ZeroAddress,
        arbitrator.address,
        amount
      )
    ).to.be.revertedWith("Factory: Invalid seller address.");

    await expect(
      escrowFactory.createEscrow(
        buyer.address,
        seller.address,
        ethers.ZeroAddress,
        amount
      )
    ).to.be.revertedWith("Factory: Invalid arbitrator address.");

    await expect(
      escrowFactory.createEscrow(
        buyer.address,
        seller.address,
        arbitrator.address,
        0
      )
    ).to.be.revertedWith("Factory: Amount must be greater than 0.");
  });

  it("should create an escrow and initialize correctly", async function () {
    const tx = await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbitrator.address,
      amount
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (l) => l.fragment && l.fragment.name === "NewEscrowCreated"
    );
    const escrowAddress = event.args.escrowContractAddress;
    const escrow = await getEscrowInstance(escrowAddress);

    expect(await escrow.buyer()).to.equal(buyer.address);
    expect(await escrow.seller()).to.equal(seller.address);
    expect(await escrow.arbitrator()).to.equal(arbitrator.address);
    expect(await escrow.amount()).to.equal(amount);
    expect(await escrow.currentState()).to.equal(0); // Locked
    expect(await kooshCoin.balanceOf(escrowAddress)).to.equal(amount);
  });

  it("only buyer can confirm delivery", async function () {
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

    await expect(escrow.connect(seller).confirmDelivery()).to.be.revertedWith(
      "Only buyer can call."
    );
    await expect(
      escrow.connect(arbitrator).confirmDelivery()
    ).to.be.revertedWith("Only buyer can call.");

    await expect(escrow.connect(buyer).confirmDelivery())
      .to.emit(escrow, "DeliveryConfirmed")
      .withArgs(buyer.address);

    expect(await escrow.buyerConfirmedDelivery()).to.be.true;
    expect(await escrow.currentState()).to.equal(1); // ReleasePending
  });

  it("only seller can release funds after delivery confirmed", async function () {
    const txRelease = await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbitrator.address,
      amount
    );
    const receiptRelease = await txRelease.wait();
    const escrowAddressRelease = receiptRelease.logs.find(
      (l) => l.fragment && l.fragment.name === "NewEscrowCreated"
    ).args.escrowContractAddress;
    const escrowRelease = await getEscrowInstance(escrowAddressRelease);

    await escrowRelease.connect(buyer).confirmDelivery();
    await expect(
      escrowRelease.connect(buyer).releaseFunds()
    ).to.be.revertedWith("Only seller can call.");
    await expect(
      escrowRelease.connect(arbitrator).releaseFunds()
    ).to.be.revertedWith("Only seller can call.");

    await expect(escrowRelease.connect(seller).releaseFunds())
      .to.emit(escrowRelease, "FundsReleased")
      .withArgs(seller.address, amount);

    expect(await escrowRelease.currentState()).to.equal(3); // Complete
  });

  it("only buyer or seller can raise dispute", async function () {
    // Buyer raises dispute
    const txBuyer = await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbitrator.address,
      amount
    );
    const receiptBuyer = await txBuyer.wait();
    const escrowAddressBuyer = receiptBuyer.logs.find(
      (l) => l.fragment && l.fragment.name === "NewEscrowCreated"
    ).args.escrowContractAddress;
    const escrowBuyer = await getEscrowInstance(escrowAddressBuyer);

    await expect(
      escrowBuyer.connect(arbitrator).raiseDispute()
    ).to.be.revertedWith("Only participants can dispute.");
    await expect(escrowBuyer.connect(buyer).raiseDispute())
      .to.emit(escrowBuyer, "DisputeRaised")
      .withArgs(buyer.address);

    expect(await escrowBuyer.currentState()).to.equal(2); // Disputed

    // Seller raises dispute
    const txSeller = await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbitrator.address,
      amount
    );
    const receiptSeller = await txSeller.wait();
    const escrowAddressSeller = receiptSeller.logs.find(
      (l) => l.fragment && l.fragment.name === "NewEscrowCreated"
    ).args.escrowContractAddress;
    const escrowSeller = await getEscrowInstance(escrowAddressSeller);

    await expect(escrowSeller.connect(seller).raiseDispute())
      .to.emit(escrowSeller, "DisputeRaised")
      .withArgs(seller.address);

    expect(await escrowSeller.currentState()).to.equal(2); // Disputed
  });

  it("only arbitrator can resolve dispute in favor of seller", async function () {
    const txResolveSeller = await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbitrator.address,
      amount
    );
    const receiptResolveSeller = await txResolveSeller.wait();
    const escrowAddressResolveSeller = receiptResolveSeller.logs.find(
      (l) => l.fragment && l.fragment.name === "NewEscrowCreated"
    ).args.escrowContractAddress;
    const escrowResolveSeller = await getEscrowInstance(
      escrowAddressResolveSeller
    );

    await escrowResolveSeller.connect(buyer).raiseDispute();
    await expect(
      escrowResolveSeller.connect(seller).resolveDispute(seller.address)
    ).to.be.revertedWith("Only arbitrator can resolve.");
    await expect(
      escrowResolveSeller.connect(buyer).resolveDispute(seller.address)
    ).to.be.revertedWith("Only arbitrator can resolve.");

    await expect(
      escrowResolveSeller.connect(arbitrator).resolveDispute(seller.address)
    )
      .to.emit(escrowResolveSeller, "DisputeResolved")
      .withArgs(arbitrator.address, seller.address, amount);

    expect(await escrowResolveSeller.currentState()).to.equal(3); // Complete
  });

  it("only arbitrator can resolve dispute in favor of buyer", async function () {
    const txResolveBuyer = await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbitrator.address,
      amount
    );
    const receiptResolveBuyer = await txResolveBuyer.wait();
    const escrowAddressResolveBuyer = receiptResolveBuyer.logs.find(
      (l) => l.fragment && l.fragment.name === "NewEscrowCreated"
    ).args.escrowContractAddress;
    const escrowResolveBuyer = await getEscrowInstance(
      escrowAddressResolveBuyer
    );

    await escrowResolveBuyer.connect(buyer).raiseDispute();
    await expect(
      escrowResolveBuyer.connect(seller).resolveDispute(buyer.address)
    ).to.be.revertedWith("Only arbitrator can resolve.");
    await expect(
      escrowResolveBuyer.connect(buyer).resolveDispute(buyer.address)
    ).to.be.revertedWith("Only arbitrator can resolve.");

    await expect(
      escrowResolveBuyer.connect(arbitrator).resolveDispute(buyer.address)
    )
      .to.emit(escrowResolveBuyer, "DisputeResolved")
      .withArgs(arbitrator.address, buyer.address, amount);

    expect(await escrowResolveBuyer.currentState()).to.equal(4); // Refunded
  });

  it("only seller can claim funds after timeout", async function () {
    const txTimeout = await escrowFactory.createEscrow(
      buyer.address,
      seller.address,
      arbitrator.address,
      amount
    );
    const receiptTimeout = await txTimeout.wait();
    const escrowAddressTimeout = receiptTimeout.logs.find(
      (l) => l.fragment && l.fragment.name === "NewEscrowCreated"
    ).args.escrowContractAddress;
    const escrowTimeout = await getEscrowInstance(escrowAddressTimeout);

    // fast-forward 30 days
    await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      escrowTimeout.connect(buyer).claimFundsAfterTimeout()
    ).to.be.revertedWith("Only seller can call.");
    await expect(
      escrowTimeout.connect(arbitrator).claimFundsAfterTimeout()
    ).to.be.revertedWith("Only seller can call.");

    await expect(escrowTimeout.connect(seller).claimFundsAfterTimeout())
      .to.emit(escrowTimeout, "FundsReleased")
      .withArgs(seller.address, amount);

    expect(await escrowTimeout.currentState()).to.equal(3); // Complete
  });

  it("getBalance returns correct value after factory mint", async function () {
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
    expect(await escrow.getBalance()).to.equal(amount);
  });

  it("should track escrows for buyer and seller and paginate", async function () {
    for (let i = 0; i < 3; i++) {
      await escrowFactory.createEscrow(
        buyer.address,
        seller.address,
        arbitrator.address,
        amount
      );
    }
    const buyerEscrows = await escrowFactory.getEscrowsForBuyer(buyer.address);
    expect(buyerEscrows.length).to.equal(3);
    const sellerEscrows = await escrowFactory.getEscrowsForSeller(
      seller.address
    );
    expect(sellerEscrows.length).to.equal(3);
    const page = await escrowFactory.getPaginatedEscrows(0, 2);
    expect(page.length).to.equal(2);
    const page2 = await escrowFactory.getPaginatedEscrows(1, 2);
    expect(page2.length).to.equal(1);
  });
});

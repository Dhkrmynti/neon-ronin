import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

const BASE = "https://example.test/metadata/";
const PROVENANCE = "0x" + "ab".repeat(32);
const PRICE = ethers.parseEther("0.01");

async function deploy({ supply = 20, price = PRICE, perWallet = 10, perTx = 5, open = true } = {}) {
  const [owner, alice, bob, treasury] = await ethers.getSigners();
  const ronin = await ethers.deployContract("NeonRonin", [BASE, supply, price, perWallet, perTx, PROVENANCE, treasury.address, 500]);
  if (open) await ronin.setMintOpen(true);
  return { ronin, owner, alice, bob, treasury };
}

describe("NeonRonin", function () {
  it("keeps the terms it was deployed with", async function () {
    const { ronin, owner, treasury } = await deploy({ open: false });
    expect(await ronin.name()).to.equal("Neon Ronin");
    expect(await ronin.symbol()).to.equal("RONIN");
    expect(await ronin.maxSupply()).to.equal(20n);
    expect(await ronin.price()).to.equal(PRICE);
    expect(await ronin.maxPerWallet()).to.equal(10n);
    expect(await ronin.maxPerTx()).to.equal(5n);
    expect(await ronin.provenance()).to.equal(PROVENANCE);
    expect(await ronin.owner()).to.equal(owner.address);
    expect(await ronin.mintOpen()).to.equal(false);
    const [receiver, amount] = await ronin.royaltyInfo(1n, ethers.parseEther("1"));
    expect(receiver).to.equal(treasury.address);
    expect(amount).to.equal(ethers.parseEther("0.05"));
  });

  it("refuses terms nobody could mint under", async function () {
    const [, , , treasury] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("NeonRonin");
    const bad = (s: number, w: number, t: number) => ethers.deployContract("NeonRonin", [BASE, s, PRICE, w, t, PROVENANCE, treasury.address, 500]);
    await expect(bad(0, 10, 5)).to.be.revertedWithCustomError(factory, "BadTerms");
    await expect(bad(10, 0, 0)).to.be.revertedWithCustomError(factory, "BadTerms");
    await expect(bad(10, 10, 0)).to.be.revertedWithCustomError(factory, "BadTerms");
    await expect(bad(10, 3, 5)).to.be.revertedWithCustomError(factory, "BadTerms");
  });

  it("stays shut until the owner opens it", async function () {
    const { ronin, alice } = await deploy({ open: false });
    await expect(ronin.connect(alice).mint(1, { value: PRICE })).to.be.revertedWithCustomError(ronin, "MintClosed");
    expect(await ronin.mintableBy(alice.address)).to.equal(0n);
    await expect(ronin.connect(alice).setMintOpen(true)).to.be.revertedWithCustomError(ronin, "OwnableUnauthorizedAccount");
  });

  it("mints a batch in order, starting at #1", async function () {
    const { ronin, alice, bob } = await deploy();
    await ronin.connect(alice).mint(3, { value: PRICE * 3n });
    await ronin.connect(bob).mint(1, { value: PRICE });
    for (const id of [1n, 2n, 3n]) expect(await ronin.ownerOf(id)).to.equal(alice.address);
    expect(await ronin.ownerOf(4n)).to.equal(bob.address);
    expect(await ronin.totalSupply()).to.equal(4n);
    expect(await ronin.mintedBy(alice.address)).to.equal(3n);
    expect(await ronin.tokenURI(4n)).to.equal(`${BASE}4.json`);
    await expect(ronin.tokenURI(5n)).to.be.revertedWithCustomError(ronin, "ERC721NonexistentToken");
  });

  it("checks quantity, payment, wallet limit and supply", async function () {
    const { ronin, alice, bob } = await deploy({ supply: 8, perWallet: 6, perTx: 5 });
    await expect(ronin.connect(alice).mint(0)).to.be.revertedWithCustomError(ronin, "BadQuantity").withArgs(5n);
    await expect(ronin.connect(alice).mint(6, { value: PRICE * 6n })).to.be.revertedWithCustomError(ronin, "BadQuantity");
    await expect(ronin.connect(alice).mint(2, { value: PRICE })).to.be.revertedWithCustomError(ronin, "WrongPayment").withArgs(PRICE * 2n);
    await expect(ronin.connect(alice).mint(1, { value: PRICE * 2n })).to.be.revertedWithCustomError(ronin, "WrongPayment");

    await ronin.connect(alice).mint(5, { value: PRICE * 5n });
    expect(await ronin.mintableBy(alice.address)).to.equal(1n);
    await expect(ronin.connect(alice).mint(2, { value: PRICE * 2n })).to.be.revertedWithCustomError(ronin, "WalletLimitReached").withArgs(1n);

    await expect(ronin.connect(bob).mint(4, { value: PRICE * 4n })).to.be.revertedWithCustomError(ronin, "SoldOut").withArgs(3n);
    await ronin.connect(bob).mint(3, { value: PRICE * 3n });
    expect(await ronin.mintableBy(bob.address)).to.equal(0n);
  });

  it("cannot be re-entered past the wallet limit", async function () {
    const { ronin } = await deploy({ price: 0n, perWallet: 1, perTx: 1 });
    const greedy = await ethers.deployContract("GreedyMinter", [await ronin.getAddress()]);
    await expect(greedy.start(1)).to.be.revertedWithCustomError(ronin, "WalletLimitReached");
    expect(await ronin.totalSupply()).to.equal(0n);
  });

  it("lets the owner reserve only before the mint opens", async function () {
    const { ronin, treasury } = await deploy({ open: false });
    await ronin.reserve(treasury.address, 4);
    expect(await ronin.balanceOf(treasury.address)).to.equal(4n);
    expect(await ronin.mintedBy(treasury.address)).to.equal(0n);
    await ronin.setMintOpen(true);
    await expect(ronin.reserve(treasury.address, 1)).to.be.revertedWithCustomError(ronin, "ReserveAfterOpen");
  });

  it("moves metadata until frozen, then never again", async function () {
    const { ronin, alice } = await deploy();
    await ronin.connect(alice).mint(1, { value: PRICE });
    await expect(ronin.setBaseURI("ipfs://cid/")).to.emit(ronin, "BaseURIChanged").withArgs("ipfs://cid/");
    expect(await ronin.tokenURI(1n)).to.equal("ipfs://cid/1.json");
    await ronin.freezeMetadata();
    await expect(ronin.setBaseURI("ipfs://other/")).to.be.revertedWithCustomError(ronin, "MetadataIsFrozen");
    await expect(ronin.connect(alice).setBaseURI("x")).to.be.revertedWithCustomError(ronin, "OwnableUnauthorizedAccount");
  });

  it("pays out to the owner only", async function () {
    const { ronin, owner, alice } = await deploy();
    await ronin.connect(alice).mint(5, { value: PRICE * 5n });
    await expect(ronin.connect(alice).withdraw()).to.be.revertedWithCustomError(ronin, "OwnableUnauthorizedAccount");
    await expect(ronin.withdraw()).to.changeEtherBalances(ethers, [ronin, owner], [-(PRICE * 5n), PRICE * 5n]);
  });

  it("reports ERC-721 and ERC-2981 support", async function () {
    const { ronin } = await deploy();
    expect(await ronin.supportsInterface("0x80ac58cd")).to.equal(true);
    expect(await ronin.supportsInterface("0x2a55205a")).to.equal(true);
  });
});

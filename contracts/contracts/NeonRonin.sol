// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title Neon Ronin
/// @notice 8,888 masterless robot samurai. Ronin are minted in order, #1 first, up to five per
/// transaction. Supply, price, limits and the provenance hash are fixed at deployment and can
/// never change. The owner can open and close the mint, reserve a few for the team before the
/// mint opens, move the metadata location until it is frozen, and withdraw what minting paid in.
contract NeonRonin is ERC721, ERC2981, Ownable {
    using Strings for uint256;

    uint256 public immutable maxSupply;
    uint256 public immutable price;
    uint256 public immutable maxPerWallet;
    uint256 public immutable maxPerTx;
    /// @notice keccak256 of the generated collection (see scripts/provenance.mjs), published before
    /// minting so anyone can check later that the art was not reshuffled after the fact.
    bytes32 public immutable provenance;

    uint256 public totalSupply;
    bool public mintOpen;
    bool public metadataFrozen;
    mapping(address => uint256) public mintedBy;

    string private _base;

    error BadTerms();
    error MintClosed();
    error BadQuantity(uint256 max);
    error SoldOut(uint256 left);
    error WalletLimitReached(uint256 left);
    error WrongPayment(uint256 expected);
    error ReserveAfterOpen();
    error MetadataIsFrozen();
    error WithdrawFailed();

    event MintOpenChanged(bool open);
    event BaseURIChanged(string uri);
    event MetadataFrozen();

    constructor(
        string memory baseURI_,
        uint256 maxSupply_,
        uint256 price_,
        uint256 maxPerWallet_,
        uint256 maxPerTx_,
        bytes32 provenance_,
        address royaltyReceiver,
        uint96 royaltyBps
    ) ERC721("Neon Ronin", "RONIN") Ownable(msg.sender) {
        // These can never be corrected afterwards, so a deployment nobody could mint from is refused.
        if (maxSupply_ == 0 || maxPerWallet_ == 0 || maxPerTx_ == 0 || maxPerTx_ > maxPerWallet_) revert BadTerms();
        _base = baseURI_;
        maxSupply = maxSupply_;
        price = price_;
        maxPerWallet = maxPerWallet_;
        maxPerTx = maxPerTx_;
        provenance = provenance_;
        _setDefaultRoyalty(royaltyReceiver, royaltyBps);
    }

    /// @notice Mints the next `qty` ronin in line to the caller. Pay exactly `price * qty`.
    function mint(uint256 qty) external payable {
        if (!mintOpen) revert MintClosed();
        if (qty == 0 || qty > maxPerTx) revert BadQuantity(maxPerTx);
        if (totalSupply + qty > maxSupply) revert SoldOut(maxSupply - totalSupply);
        if (mintedBy[msg.sender] + qty > maxPerWallet) revert WalletLimitReached(maxPerWallet - mintedBy[msg.sender]);
        if (msg.value != price * qty) revert WrongPayment(price * qty);

        // Counted before the tokens are handed over, so a receiving contract cannot mint its way past the limits.
        mintedBy[msg.sender] += qty;
        _mintBatch(msg.sender, qty);
    }

    /// @notice Team reserve. Only before the public mint has ever opened, so holders know the split up front.
    function reserve(address to, uint256 qty) external onlyOwner {
        if (mintOpen) revert ReserveAfterOpen();
        if (totalSupply + qty > maxSupply) revert SoldOut(maxSupply - totalSupply);
        _mintBatch(to, qty);
    }

    function _mintBatch(address to, uint256 qty) private {
        uint256 first = totalSupply + 1;
        totalSupply += qty;
        for (uint256 i; i < qty; ++i) _safeMint(to, first + i);
    }

    function setMintOpen(bool open) external onlyOwner {
        mintOpen = open;
        emit MintOpenChanged(open);
    }

    /// @notice How many more this wallet may mint right now (0 when closed or sold out).
    function mintableBy(address wallet) external view returns (uint256) {
        if (!mintOpen) return 0;
        uint256 left = maxSupply - totalSupply;
        uint256 own = maxPerWallet - mintedBy[wallet];
        return left < own ? left : own;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string.concat(_base, tokenId.toString(), ".json");
    }

    function setBaseURI(string calldata uri) external onlyOwner {
        if (metadataFrozen) revert MetadataIsFrozen();
        _base = uri;
        emit BaseURIChanged(uri);
    }

    /// @notice One way. After this the metadata location can never be changed again.
    function freezeMetadata() external onlyOwner {
        metadataFrozen = true;
        emit MetadataFrozen();
    }

    function withdraw() external onlyOwner {
        (bool sent, ) = owner().call{value: address(this).balance}("");
        if (!sent) revert WithdrawFailed();
    }

    function supportsInterface(bytes4 id) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(id);
    }
}

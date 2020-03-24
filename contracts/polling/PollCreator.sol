pragma solidity ^0.5.11;

import "./Poll.sol";
import "../token/ILivepeerToken.sol";


contract PollCreator {
    // TODO: Update these values
    uint256 public constant QUORUM = 20;
    uint256 public constant THRESHOLD = 50;
    uint256 public constant POLL_PERIOD = 10 * 5760;

    ILivepeerToken public token;
    uint256 public pollCreationCost;

    event PollCreated(
        address indexed poll,
        bytes proposal,
        uint256 endBlock,
        uint256 quorum,
        uint256 threshold
    );

    constructor(address _tokenAddr, uint256 _pollCreationCost) public {
        token = ILivepeerToken(_tokenAddr);
        pollCreationCost = _pollCreationCost;
    }

    function createPoll(bytes calldata _proposal) external {
        uint256 endBlock = block.number + POLL_PERIOD;
        Poll poll = new Poll(endBlock);

        require(
            token.transferFrom(msg.sender, address(this), pollCreationCost),
            "LivepeerToken transferFrom failed"
        );

        token.burn(pollCreationCost);

        emit PollCreated(
            address(poll),
            _proposal,
            endBlock,
            QUORUM,
            THRESHOLD
        );
    }
}
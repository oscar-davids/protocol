pragma solidity ^0.5.11;


contract Poll {
    // The block at which the poll ends and votes can no longer be submitted.
    uint256 public endBlock;

    // Emitted when an account submits a yes vote.
    // This event can be indexed to tally all yes votes.
    event Yes(address indexed voter);
    // Emitted when an account submits a no vote.
    // This event can be indexed to tally all no votes.
    event No(address indexed voter);

    modifier isActive() {
        require(
            block.number < endBlock,
            "poll is over"
        );
        _;
    }

    constructor(uint256 _endBlock) public {
        endBlock = _endBlock;
    }

    /**
     * @dev Vote yes for the poll's proposal.
     *      Reverts if the poll period is over.
     */
    function yes() external isActive {
        emit Yes(msg.sender);
    }

    /**
     * @dev Vote no for the poll's proposal.
     *      Reverts if the poll period is over.
     */
    function no() external isActive {
        emit No(msg.sender);
    }
}
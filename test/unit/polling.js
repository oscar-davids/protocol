import truffleAssert from "truffle-assertions"

import Fixture from "./helpers/Fixture"
import expectRevertWithReason from "../helpers/expectFail"
import {functionSig} from "../../utils/helpers"

const Poll = artifacts.require("Poll")
const PollCreator = artifacts.require("PollCreator")
const GenericMock = artifacts.require("GenericMock")

const QUORUM = 20
const THRESHOLD = 50
const POLL_PERIOD = 10 * 5760
const CREATION_COST = 500

contract("PollCreator", accounts => {
    let fixture
    let token
    let pollCreator

    before(async () => {
        fixture = new Fixture(web3)
        token = await GenericMock.new("LivepeerToken")
    })

    beforeEach(async () => {
        await fixture.setUp()
    })

    afterEach(async () => {
        await fixture.tearDown()
    })

    describe("constructor", () => {
        before(async () => {
            pollCreator = await PollCreator.new(token.address, CREATION_COST)
        })

        it("initialize state: token", async () => {
            assert.equal(await pollCreator.token(), token.address)
        })

        it("initialize state: pollCreationCost", async () => {
            assert.equal((await pollCreator.pollCreationCost()).toNumber(), CREATION_COST)
        })
    })

    describe("createPoll", () => {
        const hash = "0x1230000000000000000000000000000000000000"

        before(async () => {
            pollCreator = await PollCreator.new(token.address, CREATION_COST)
        })

        it("revert when not enough tokens approved", async () => {
            await expectRevertWithReason(pollCreator.createPoll(hash), "LivepeerToken transferFrom failed")
        })

        it("creates a poll", async () => {
            await token.setMockBool(functionSig("transferFrom(address,address,uint256)"), true)
            let start = await fixture.rpc.getBlockNumberAsync()
            let end = start + POLL_PERIOD + 1 // + 1 because createPoll tx will mine a new block
            let tx = await pollCreator.createPoll(hash)
            truffleAssert.eventEmitted(
                tx,
                "PollCreated",
                e => e.proposal == hash
                && e.endBlock.toNumber() == end
                && e.quorum.toNumber() == QUORUM
                && e.threshold.toNumber() == THRESHOLD
                ,
                "PollCreated event not emitted correctly"
            )
        })
    })
})

contract("Poll", accounts => {
    let fixture
    let poll
    let startBlock
    let endBlock

    before(() => {
        fixture = new Fixture(web3)
    })

    beforeEach(async () => {
        await fixture.setUp()
        startBlock = await fixture.rpc.getBlockNumberAsync()
        endBlock = startBlock + 10
        poll = await Poll.new(endBlock)
    })

    afterEach(async () => {
        await fixture.tearDown()
    })

    describe("constructor", () => {
        it("initialize state: endBlock", async () => {
            assert.equal((await poll.endBlock()).toNumber(), endBlock)
        })
    })

    describe("yes", () => {
        it("emit \"Yes\" event when poll is active", async () => {
            let tx = await poll.yes()
            truffleAssert.eventEmitted(tx, "Yes", null, "Yes event not emitted correctly")
        })

        it("revert when poll is inactive", async () => {
            await fixture.rpc.waitUntilBlock(endBlock + 1)
            await expectRevertWithReason(poll.yes(), "poll is over")
        })
    })

    describe("no", () => {
        it("emit \"No\" event when poll is active", async () => {
            let tx = await poll.no()
            truffleAssert.eventEmitted(tx, "No", null, "No event not emitted correctly")
        })

        it("revert when poll is inactive", async () => {
            await fixture.rpc.waitUntilBlock(endBlock + 1)
            await expectRevertWithReason(poll.no(), "poll is over")
        })
    })

    describe("destroy", () => {
        it("revert when poll is active", async () => {
            await expectRevertWithReason(poll.destroy(), "poll is active")
        })

        it("destroy the contract when poll has ended", async () => {
            await fixture.rpc.waitUntilBlock(endBlock + 1)
            let tx = await poll.destroy()
            assert.equal(tx.receipt.status, true)
        })
    })
})

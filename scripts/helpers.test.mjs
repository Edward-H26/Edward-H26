// @ts-check
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { mix, shade } from "./color.mjs"
import { abbreviate, compact, round } from "./numbers.mjs"

describe("numbers", () => {
  it("rounds to two decimals", () => {
    assert.equal(round(3.14159), 3.14)
    assert.equal(round(1.2345), 1.23)
    assert.equal(round(2), 2)
  })

  it("compacts thousands and leaves smaller numbers alone", () => {
    assert.equal(compact(999), "999")
    assert.equal(compact(1000), "1k")
    assert.equal(compact(1234), "1.23k")
  })

  it("abbreviates millions and thousands", () => {
    assert.equal(abbreviate(12), "12")
    assert.equal(abbreviate(2500), "2.5k")
    assert.equal(abbreviate(1500000), "1.5M")
  })
})

describe("color", () => {
  it("shades toward white, toward black, and not at all", () => {
    assert.equal(shade("#000000", 1), "#ffffff")
    assert.equal(shade("#ffffff", -1), "#000000")
    assert.equal(shade("#808080", 0), "#808080")
    assert.equal(shade("#000000", 0.5), "#808080")
  })

  it("mixes two colours by the given fraction", () => {
    assert.equal(mix("#000000", "#ffffff", 0), "#000000")
    assert.equal(mix("#000000", "#ffffff", 1), "#ffffff")
    assert.equal(mix("#000000", "#ffffff", 0.5), "#808080")
    assert.equal(mix("#ff0000", "#0000ff", 0.5), "#800080")
  })
})

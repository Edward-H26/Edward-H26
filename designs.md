# Design Options for Right-Aligned Date

Here are the possible ways to align the date to the right. Please preview this file to see how they render.

## Option 1: Flexbox (Modern, Clean)
Uses HTML `div` with `display: flex`. **Note:** GitHub sometimes strips this style, so check if it works in your preview.

<div style="display: flex; justify-content: space-between;">
  <strong>Undergraduate Researcher</strong>
  <em>May 2024 - Present</em>
</div>

## Option 2: HTML Table (Robust, but may have borders)
Uses HTML `table` tags. GitHub often adds borders to tables.

<table width="100%" style="border: none;">
  <tr style="border: none;">
    <td align="left" style="border: none;"><strong>Undergraduate Researcher</strong></td>
    <td align="right" style="border: none;"><em>May 2024 - Present</em></td>
  </tr>
</table>

## Option 3: Float Image/Badge (Reliable Alignment)
Uses an image aligned to the right. The date is rendered as a "badge".

<strong>Undergraduate Researcher</strong> <img align="right" src="https://img.shields.io/badge/May%202024%20--%20Present-white?style=social&logo=none" alt="Date" />

<br clear="all" />

## Option 4: Non-breaking Spaces (Fragile)
Uses `&nbsp;` spaces. This breaks on mobile or different screen sizes.

<strong>Undergraduate Researcher</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <em>May 2024 - Present</em>

# Data Governance & Horticultural Integrity

Garden Deck is not just a gardening tool; it is a **Grounded Knowledge System**. This document outlines how we ensure any AI-driven suggestions or agronomic data remains accurate, verifiable, and transparent.

## 1. The Principle of Grounding

Every piece of data in the **Catalog** must be linked to an **Authoritative Source**. We do not use "hallucinated" or unverified plant data.

### Authoritative Sources (Initial Set):
- **RHS (Royal Horticultural Society)**: For gold-standard botanical descriptors.
- **UC Davis / Cornell Extension**: For agricultural and pest management guidance.
- **Aggregator Consensus**: Scientific consensus across multiple research institutions.

## 2. Confidence Scoring

All plant species and recommendations carry a `confidence_score` (0.0 to 1.0).

- **High (0.9 - 1.0)**: Peer-reviewed data or Extension guidelines. Actionable without hesitation.
- **Medium (0.4 - 0.8)**: Community-reported or experimental data. Shown with a warning.
- **Low (< 0.4)**: Insufficient data. For informational purposes only.

## 3. Explainability (The "Why")

When the system blocks an action (like planting out of season) or suggests an intervention (like watering), it must provide an **Explanation Payload**.

### Structure of an Explanation:
- **Summary**: Human-readable instruction.
- **Detailed Reasoning**: The steps taken to reach the decision.
- **Technical Evidence**: The specific facts used (e.g., "Current month is October") and the rules applied (e.g., "Tomato Sowing Window: Mar-June").
- **Source Verification**: Direct links/IDs to the sources in the `sources` collection.

## 4. Local-First Sovereignty

Data Governance in Garden Deck also extends to **User Privacy**:
- **Zero Cloud**: No user data is sent to a central server.
- **Local Persistence**: Data migrations and schema updates are handled purely on-device.
- **Portability**: Users own their database. It can be exported/imported as JSON without losing relationships or history.

---
name: AI System Instruction: Garden Deck Implementation
description: Brief description of what this Skill does and when to use it
---

# Ext

## Instructions

🤖 AI System Instruction: Garden Deck Implementation (V2)
Context: You are building the "Garden Deck", a high-fidelity virtual twin of a physical garden. You must implement a three-stage pipeline (Shop → Purchased → Grid) using an AI-agent architecture that balances simulation with manual user overrides.

🛠 1. The "Shop" Module (Universal Encyclopedia)

Data Source: Interface with the plant_knowledgebase.json (200+ species).

Functionality: * Render a scrollable list of all plant entries.

Implement a DetailModal triggered on click: fetch and display growth stages, soil/water needs, and companion logic.

Procurement Action: On "Buy," move a deep copy of the plant object to the Purchased_Inventory state.

[Logic Condition]: * IF Current_Date is outside the Optimal_Sowing_Window defined in the knowledgebase for Dresden (Zone 7b), THEN display a WarningBadge ("Risky Timing") on the UI.

🎒 2. The "Purchased" Module (Inventory Management)

Data State: Manage the Purchased_Inventory array.

Functionality:

Render an overview of acquired seeds with "Plant" and "Delete" actions.

Planting Workflow: On "Plant," trigger a CoordinatePicker or GridPlacementMode.

[Logic Condition]: * IF Garden_Grid_Capacity is full (Total Cells == Occupied Cells), THEN disable the "Plant" button and display UserToast ("Expand Grid to Plant").

🌱 3. The "Garden Grid" Module (Virtual Twin)

Structural CRUD: Implement addRow() and addColumn() functions that dynamically update the CSS grid dimensions.

Seed Deployment:

Support Drag-and-Drop from the PurchasedFooterBar.

Support Direct Placement from the Purchased window via coordinate assignment.

Simulation Engine: On placement, initialize a Forecast_Object using Dresden's GDD (Growing Degree Days) logic.

[Logic Conditions & Overrides]:

Manual Overwrite (User Observation): If a user updates status to "Pest Infestation," "Overwatered," or "Dead," the AI must pause the simulation and switch to "Recovery" or "Void" state.

Contagion Logic: IF user logs "Pest Infestation" AND neighbors are "Symptom Carriers," THEN flag neighbors with a DiseaseRiskOverlay.

Synergy Check: IF a seed is placed adjacent to a "Companion," THEN apply SynergyBuff (Glow Effect + 10% Growth Multiplier).

Death Logic: IF status == "Dead," THEN freeze all counters and change the icon to Compost_Icon.

🧪 4. State Management Requirements (The "If-Then" Matrix)

Trigger EventEvaluation LogicResultant AI ActionGrid DeletionIF cell is not NULLPrompt: "This will delete [Plant Name]. Proceed?"Time Travel ScrubIF scrub > 0Re-calculate stages using Dresden Forecast Data.Observation: DeadIF status set to "Dead"Flag slot for "Clear CRUD" before new planting is allowed.PlacementIF neighbor is "Antagonist"Trigger UI alert: "Conflict Detected: Nutrient Competition."

🎨 5. GUI Layout Architecture (Compartmentalized)

Main View: Toggle between CalendarView, ShopView, and GardenGridView.

The Grid: High-contrast CSS Grid with interactive SlotComponents.

The Footer: Persistent InventoryBar containing only Purchased seeds, draggable to the grid.

The Observation Menu: Contextual popup for the grid with options: [Healthy, Pest, Dead, Harvested, Overwatered].
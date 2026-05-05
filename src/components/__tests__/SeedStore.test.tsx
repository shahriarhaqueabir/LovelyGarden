import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SeedStore } from "../SeedStore";
import { PlantSpecies } from "../../schema/knowledge-graph";

// Mock the database module
vi.mock("../../db", () => ({
  getDatabase: vi.fn().mockResolvedValue({
    inventory: {
      insert: vi.fn(),
    },
  }),
}));

// Mock the queries module
vi.mock("../../db/queries", () => ({
  logSeedPurchase: vi.fn().mockResolvedValue(undefined),
}));

// Mock the lazy-loaded GrowthGraph component
vi.mock("../GrowthGraph", () => ({
  default: ({ stages }: { stages: any[] }) => (
    <div data-testid="growth-graph">
      Growth Graph with {stages?.length || 0} stages
    </div>
  ),
  GrowthGraph: ({ stages }: { stages: any[] }) => (
    <div data-testid="growth-graph">
      Growth Graph with {stages?.length || 0} stages
    </div>
  ),
}));

// Mock fetch for knowledge base
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockCatalog: PlantSpecies[] = [
  {
    id: "plant_tomato",
    name: "Tomato",
    scientificName: "Solanum lycopersicum",
    description: "A red fruit vegetable",
    categories: ["vegetable"],
    life_cycle: "annual",
    growth_habit: ["bushy"],
    photosynthesis_type: "C3",
    edible_parts: ["fruit"],
    toxic_parts: [],
    pollination_type: "insect",
    sowingSeason: ["Spring", "Summer"],
    sowingMethod: "Transplant",
    stages: [
      {
        id: "seed",
        name: "Seed",
        durationDays: 0,
        waterFrequencyDays: 1,
        imageAssetId: "seed",
      },
      {
        id: "seedling",
        name: "Seedling",
        durationDays: 14,
        waterFrequencyDays: 2,
        imageAssetId: "seedling",
      },
    ],
    companions: ["plant_basil"],
    antagonists: ["plant_corn"],
    confidence_score: 0.9,
    sources: ["source_1"],
  },
  {
    id: "plant_basil",
    name: "Basil",
    scientificName: "Ocimum basilicum",
    description: "Aromatic herb",
    categories: ["herb"],
    life_cycle: "annual",
    growth_habit: ["upright"],
    photosynthesis_type: "C3",
    edible_parts: ["leaves"],
    toxic_parts: [],
    pollination_type: "insect",
    sowingSeason: ["Spring"],
    sowingMethod: "Direct",
    stages: [
      {
        id: "seed",
        name: "Seed",
        durationDays: 0,
        waterFrequencyDays: 1,
        imageAssetId: "seed",
      },
      {
        id: "seedling",
        name: "Seedling",
        durationDays: 10,
        waterFrequencyDays: 2,
        imageAssetId: "seedling",
      },
    ],
    companions: ["plant_tomato"],
    antagonists: [],
    confidence_score: 0.85,
    sources: ["source_2"],
  },
];

describe("SeedStore", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful KB fetch
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve([]),
    });
  });

  it("should render the seed store with catalog items", async () => {
    render(<SeedStore catalog={mockCatalog} onClose={mockOnClose} />);

    // Wait for lazy-loaded component
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getAllByText("Seed Store").length).toBeGreaterThan(0);
    expect(screen.getByText("Tomato")).toBeTruthy();
    expect(screen.getByText("Basil")).toBeTruthy();
  });

  it("should display correct count of species", () => {
    render(<SeedStore catalog={mockCatalog} onClose={mockOnClose} />);

    const countTexts = screen.getAllByText(/Showing 2\/2/);
    expect(countTexts.length).toBeGreaterThan(0);
  });

  it("should filter catalog based on search query", async () => {
    render(<SeedStore catalog={mockCatalog} onClose={mockOnClose} />);

    // Verify initial count shows all items
    expect(screen.getByText(/Showing 2\/2/)).toBeInTheDocument();

    const searchInput = document.querySelector(
      'input[placeholder*="Search"]',
    ) as HTMLInputElement;
    expect(searchInput).toBeTruthy();
    fireEvent.change(searchInput, { target: { value: "tomato" } });

    // Wait for debounce + filtered count to change to 1/2
    await waitFor(
      () => {
        expect(screen.getByText(/Showing 1\/2/)).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    // Check that Tomato is visible and Basil is not
    expect(screen.getByText("Tomato")).toBeInTheDocument();
    expect(screen.queryByText("Basil")).not.toBeInTheDocument();
  });

  it("should show no results message when search matches nothing", async () => {
    render(<SeedStore catalog={mockCatalog} onClose={mockOnClose} />);

    const searchInput = document.querySelector(
      'input[placeholder*="Search"]',
    ) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    // Wait for debounce + re-render
    await waitFor(
      () => {
        expect(
          screen.getByText(/No species match your search/i),
        ).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it("should call onClose when close button is clicked", async () => {
    render(<SeedStore catalog={mockCatalog} onClose={mockOnClose} />);

    const closeButtons = screen.getAllByTitle("Close");
    expect(closeButtons.length).toBeGreaterThan(0);
    await fireEvent.click(closeButtons[0]);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should open detail modal when info button is clicked", async () => {
    render(<SeedStore catalog={mockCatalog} onClose={mockOnClose} />);

    const infoButtons = screen.getAllByTitle("View Details");
    expect(infoButtons.length).toBeGreaterThan(0);

    await fireEvent.click(infoButtons[0]);
    expect(screen.getByText(/Knowledge Base/i)).toBeTruthy();
  });

  it("should display plant categories as badges", () => {
    render(<SeedStore catalog={mockCatalog} onClose={mockOnClose} />);

    const vegetableBadges = screen.getAllByText("vegetable");
    expect(vegetableBadges.length).toBeGreaterThan(0);

    const herbBadges = screen.getAllByText("herb");
    expect(herbBadges.length).toBeGreaterThan(0);
  });

  it("should render with currentDay prop", () => {
    render(
      <SeedStore catalog={mockCatalog} onClose={mockOnClose} currentDay={50} />,
    );

    const headings = screen.getAllByText("Seed Store");
    expect(headings.length).toBeGreaterThan(0);
  });

  it("should show empty state when catalog is empty", () => {
    render(<SeedStore catalog={[]} onClose={mockOnClose} />);

    expect(screen.getByText(/No species match/i)).toBeTruthy();
  });
});

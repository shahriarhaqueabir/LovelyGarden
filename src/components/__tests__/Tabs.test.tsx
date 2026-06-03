import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs, TabPanel } from "../Tabs";

describe("Tabs", () => {
  it("renders all 9 tab buttons with labels", () => {
    render(
      <Tabs>
        <TabPanel id="virtual-garden">Garden Content</TabPanel>
        <TabPanel id="profile">Profile Content</TabPanel>
        <TabPanel id="sowing-calendar">Sowing Content</TabPanel>
        <TabPanel id="plant-knowledgebase">Plants Content</TabPanel>
        <TabPanel id="seed-inventory">Seeds Content</TabPanel>
        <TabPanel id="weather-forecast">Weather Content</TabPanel>
        <TabPanel id="logbook">Logbook Content</TabPanel>
        <TabPanel id="harvest">Harvest Content</TabPanel>
        <TabPanel id="settings">Settings Content</TabPanel>
      </Tabs>,
    );

    const tabs = screen.getAllByRole("tab");
    const labels = tabs.map((tab) =>
      tab.textContent?.replace(/\s+/g, " ").trim(),
    );
    // In jsdom, responsive classes don't apply, so both short + full labels appear
    expect(labels.some((l) => l?.includes("Virtual Garden"))).toBe(true);
    expect(labels.some((l) => l?.includes("Profile"))).toBe(true);
    expect(labels.some((l) => l?.includes("Sowing Calendar"))).toBe(true);
    expect(labels.some((l) => l?.includes("Knowledgebase"))).toBe(true);
    expect(labels.some((l) => l?.includes("Seed Vault"))).toBe(true);
    expect(labels.some((l) => l?.includes("Weather"))).toBe(true);
    expect(labels.some((l) => l?.includes("Logbook"))).toBe(true);
    expect(labels.some((l) => l?.includes("Harvest"))).toBe(true);
    expect(labels.some((l) => l?.includes("Settings"))).toBe(true);
  });

  it("shows content of the first tab by default", () => {
    render(
      <Tabs>
        <TabPanel id="virtual-garden">Garden Content</TabPanel>
        <TabPanel id="profile">Profile Content</TabPanel>
      </Tabs>,
    );

    expect(screen.getByText("Garden Content")).toBeTruthy();
    // First tab is marked as selected
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });

  it("switches active tab when a tab is clicked", () => {
    render(
      <Tabs>
        <TabPanel id="virtual-garden">Garden Content</TabPanel>
        <TabPanel id="profile">Profile Content</TabPanel>
        <TabPanel id="sowing-calendar">Sowing Content</TabPanel>
      </Tabs>,
    );

    const tabs = screen.getAllByRole("tab");
    // First tab is selected by default
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");

    fireEvent.click(tabs[1]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");

    fireEvent.click(tabs[2]);
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
  });

  it("respects controlled selectedIndex prop", () => {
    const { rerender } = render(
      <Tabs selectedIndex={0}>
        <TabPanel id="virtual-garden">Garden Content</TabPanel>
        <TabPanel id="profile">Profile Content</TabPanel>
      </Tabs>,
    );

    expect(screen.getByText("Garden Content")).toBeTruthy();
    expect(screen.getAllByRole("tab")[0]).toHaveAttribute(
      "aria-selected",
      "true",
    );

    rerender(
      <Tabs selectedIndex={1}>
        <TabPanel id="virtual-garden">Garden Content</TabPanel>
        <TabPanel id="profile">Profile Content</TabPanel>
      </Tabs>,
    );

    expect(screen.getByText("Profile Content")).toBeTruthy();
    expect(screen.getAllByRole("tab")[1]).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("calls onTabChange when a tab is clicked in controlled mode", () => {
    const onTabChange = vi.fn();

    render(
      <Tabs selectedIndex={0} onTabChange={onTabChange}>
        <TabPanel id="virtual-garden">Garden Content</TabPanel>
        <TabPanel id="profile">Profile Content</TabPanel>
        <TabPanel id="sowing-calendar">Sowing Content</TabPanel>
      </Tabs>,
    );

    fireEvent.click(screen.getAllByRole("tab")[1]);
    expect(onTabChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getAllByRole("tab")[2]);
    expect(onTabChange).toHaveBeenCalledWith(2);
  });
});

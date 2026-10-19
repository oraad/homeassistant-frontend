import { describe, expect, it } from "vitest";
import {
  getCalendarColors,
  normalizeSubscriptionEventData,
} from "../../src/data/calendar";
import type {
  AlternateDate,
  Calendar,
  CalendarEventApiData,
} from "../../src/data/calendar";

const style = {
  getPropertyValue: (prop: string) => (prop === "--color-1" ? "#4269d0" : ""),
} as CSSStyleDeclaration;

describe("getCalendarColors", () => {
  it("picks dark text for a light background", () => {
    expect(getCalendarColors("#ffe066", 0, style)).toEqual({
      backgroundColor: "#ffe066",
      textColor: "#000000",
    });
  });

  it("picks light text for a dark background", () => {
    expect(getCalendarColors("#00679e", 0, style)).toEqual({
      backgroundColor: "#00679e",
      textColor: "#ffffff",
    });
  });

  it("falls back to the color for the index", () => {
    expect(getCalendarColors(undefined, 0, style)).toEqual({
      backgroundColor: "#4269d0",
      textColor: "#ffffff",
    });
    expect(getCalendarColors("not a color", 0, style).backgroundColor).toBe(
      "#4269d0"
    );
  });

  it("reads a theme color from the element it is rendered on", () => {
    const themed = {
      getPropertyValue: (prop: string) =>
        prop === "--blue-color" ? "#ffe066" : "",
    } as CSSStyleDeclaration;
    // Resolving against the document instead would read the named color blue
    expect(getCalendarColors("blue", 0, themed)).toEqual({
      backgroundColor: "var(--blue-color)",
      textColor: "#000000",
    });
  });

  it("leaves the text color unset for a background it cannot measure", () => {
    const empty = {
      getPropertyValue: () => "",
    } as unknown as CSSStyleDeclaration;
    expect(getCalendarColors(undefined, 0, empty).textColor).toBeUndefined();
    expect(
      getCalendarColors("color-mix(in srgb, white 90%, black)", 0, style)
        .textColor
    ).toBeUndefined();
    expect(
      getCalendarColors("rgba(255, 255, 255, 0.1)", 0, style).textColor
    ).toBeUndefined();
  });
});

describe("normalizeSubscriptionEventData", () => {
  const calendar: Calendar = { entity_id: "calendar.test" };

  const baseEvent: CalendarEventApiData = {
    summary: "Eid al-Fitr",
    start: "2025-04-01T00:00:00",
    end: "2025-04-01T01:00:00",
  };

  const alternateDates: AlternateDate[] = [
    {
      calendar_type: "hijri",
      display_name: "Hijri",
      date_str: "1446-10-01",
      metadata: { year: 1446, month: 10, day: 1 },
    },
    {
      calendar_type: "hebrew",
      display_name: "Hebrew",
      date_str: "5785-13-03",
    },
  ];

  it("carries alternate_dates from the API data onto the event data", () => {
    const event = normalizeSubscriptionEventData(
      { ...baseEvent, alternate_dates: alternateDates },
      calendar
    );

    expect(event?.eventData.alternate_dates).toEqual(alternateDates);
  });

  it.each([undefined, null])(
    "normalizes %s alternate_dates to undefined",
    (alternateDatesValue) => {
      const event = normalizeSubscriptionEventData(
        { ...baseEvent, alternate_dates: alternateDatesValue },
        calendar
      );

      expect(event?.eventData.alternate_dates).toBeUndefined();
    }
  );

  it("preserves an empty alternate_dates array", () => {
    const event = normalizeSubscriptionEventData(
      { ...baseEvent, alternate_dates: [] },
      calendar
    );

    expect(event?.eventData.alternate_dates).toEqual([]);
  });
});

/**
 * Time Slot Utilities for Service Booking
 * Generates 30-minute slots, handles selection logic, and overlap detection.
 */

export interface TimeSlot {
  id: string;        // "09:00", "09:30"... (24hr start time)
  label: string;     // "9:00 AM", "9:30 AM"... (12hr display)
  startTime: string; // "09:00" (24hr)
  endTime: string;   // "09:30" (24hr)
  status: 'available' | 'selected' | 'booked' | 'blocked' | 'past';
}

export interface SlotSelection {
  startSlotId: string;  // "10:00"
  endSlotId: string;    // "11:30" (start of last selected slot)
  startTime: string;    // "10:00" (24hr)
  endTime: string;      // "12:00" (end of last slot, 24hr)
  count: number;        // number of slots selected
  duration: number;     // total minutes
}

export interface TimeRange {
  start: string; // "10:00" (24hr)
  end: string;   // "12:00" (24hr)
}

const SLOT_DURATION = 30; // minutes

/**
 * Convert 24hr time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  // Handle 12hr format ("08:00 AM", "01:00 PM")
  if (time.includes('AM') || time.includes('PM')) {
    return time12ToMinutes(time);
  }
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert 12hr format to minutes since midnight
 */
function time12ToMinutes(time12: string): number {
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

/**
 * Convert minutes since midnight to 24hr time string
 */
export function minutesToTime24(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Convert 24hr time to 12hr display format
 */
export function formatTime24to12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Check if two time ranges overlap
 * Ranges are [start, end) — start inclusive, end exclusive
 */
export function isSlotOverlapping(
  slotStart: string,
  slotEnd: string,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  const s1 = timeToMinutes(slotStart);
  const e1 = timeToMinutes(slotEnd);
  const s2 = timeToMinutes(rangeStart);
  const e2 = timeToMinutes(rangeEnd);
  return s1 < e2 && e1 > s2;
}

/**
 * Generate all 30-minute time slots for a given opening/closing time
 */
export function generateSlots(
  openingTime: string,
  closingTime: string,
  bookedRanges: TimeRange[],
  blockedRanges: TimeRange[],
  selectedDate: string,
  selectedSlots?: SlotSelection | null,
): TimeSlot[] {
  const openMin = timeToMinutes(openingTime);
  const closeMin = timeToMinutes(closingTime);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = selectedDate === todayStr;

  const slots: TimeSlot[] = [];

  for (let min = openMin; min < closeMin; min += SLOT_DURATION) {
    const startTime = minutesToTime24(min);
    const endTime = minutesToTime24(min + SLOT_DURATION);
    const id = startTime;

    let status: TimeSlot['status'] = 'available';

    // Check if past (for today)
    if (isToday && min < currentMinutes) {
      status = 'past';
    }
    // Check if booked
    else if (bookedRanges.some(r => isSlotOverlapping(startTime, endTime, r.start, r.end))) {
      status = 'booked';
    }
    // Check if blocked
    else if (blockedRanges.some(r => isSlotOverlapping(startTime, endTime, r.start, r.end))) {
      status = 'blocked';
    }
    // Check if selected
    else if (selectedSlots) {
      const selStart = timeToMinutes(selectedSlots.startTime);
      const selEnd = timeToMinutes(selectedSlots.endTime);
      if (min >= selStart && min < selEnd) {
        status = 'selected';
      }
    }

    slots.push({
      id,
      label: formatTime24to12(startTime),
      startTime,
      endTime,
      status,
    });
  }

  return slots;
}

/**
 * Handle a slot tap — returns new selection or null
 */
export function handleSlotTap(
  tappedSlotId: string,
  currentSelection: SlotSelection | null,
  maxSlots: number,
  allSlots: TimeSlot[],
): SlotSelection | null {
  const tappedSlot = allSlots.find(s => s.id === tappedSlotId);
  if (!tappedSlot) return currentSelection;

  // Can't tap disabled slots
  if (tappedSlot.status === 'booked' || tappedSlot.status === 'blocked' || tappedSlot.status === 'past') {
    return currentSelection;
  }

  const tappedMin = timeToMinutes(tappedSlotId);

  // No current selection — start new
  if (!currentSelection) {
    return createSelection(tappedSlotId, 1);
  }

  const selStartMin = timeToMinutes(currentSelection.startTime);
  const selEndMin = timeToMinutes(currentSelection.endTime);

  // Tap on already selected slot — shrink or deselect
  if (tappedMin >= selStartMin && tappedMin < selEndMin) {
    // If it's the only slot, deselect
    if (currentSelection.count === 1) return null;
    // If tapping the first slot, shrink from start
    if (tappedMin === selStartMin) {
      return createSelection(minutesToTime24(selStartMin + SLOT_DURATION), currentSelection.count - 1);
    }
    // Otherwise, shrink to end at tapped slot
    const newCount = (tappedMin - selStartMin) / SLOT_DURATION;
    return createSelection(currentSelection.startSlotId, newCount);
  }

  // Tap immediately after selection — extend forward
  if (tappedMin === selEndMin && currentSelection.count < maxSlots) {
    // Check if the next slot is available
    const nextSlot = allSlots.find(s => s.id === tappedSlotId);
    if (nextSlot && (nextSlot.status === 'available' || nextSlot.status === 'selected')) {
      return createSelection(currentSelection.startSlotId, currentSelection.count + 1);
    }
  }

  // Tap immediately before selection — extend backward
  if (tappedMin === selStartMin - SLOT_DURATION && currentSelection.count < maxSlots) {
    const prevSlot = allSlots.find(s => s.id === tappedSlotId);
    if (prevSlot && (prevSlot.status === 'available' || prevSlot.status === 'selected')) {
      return createSelection(tappedSlotId, currentSelection.count + 1);
    }
  }

  // Non-adjacent tap — start new selection
  return createSelection(tappedSlotId, 1);
}

/**
 * Create a SlotSelection from a start slot and count
 */
function createSelection(startSlotId: string, count: number): SlotSelection {
  const startMin = timeToMinutes(startSlotId);
  const endMin = startMin + (count * SLOT_DURATION);
  return {
    startSlotId,
    endSlotId: minutesToTime24(startMin + ((count - 1) * SLOT_DURATION)),
    startTime: startSlotId,
    endTime: minutesToTime24(endMin),
    count,
    duration: count * SLOT_DURATION,
  };
}

/**
 * Get a human-readable summary of the selection
 */
export function getSelectionSummary(selection: SlotSelection): { startLabel: string; endLabel: string; durationLabel: string } {
  const startLabel = formatTime24to12(selection.startTime);
  const endLabel = formatTime24to12(selection.endTime);
  const hours = Math.floor(selection.duration / 60);
  const mins = selection.duration % 60;
  let durationLabel = '';
  if (hours > 0 && mins > 0) durationLabel = `${hours}h ${mins}m`;
  else if (hours > 0) durationLabel = `${hours} hour${hours > 1 ? 's' : ''}`;
  else durationLabel = `${mins} min`;
  return { startLabel, endLabel, durationLabel };
}

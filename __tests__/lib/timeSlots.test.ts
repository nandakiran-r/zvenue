import {
  generateSlots,
  handleSlotTap,
  formatTime24to12,
  isSlotOverlapping,
  timeToMinutes,
  minutesToTime24,
  getSelectionSummary,
  type TimeSlot,
  type SlotSelection,
} from '@/lib/timeSlots';

describe('timeSlots utilities', () => {
  describe('formatTime24to12', () => {
    it('converts morning times', () => {
      expect(formatTime24to12('09:00')).toBe('9:00 AM');
      expect(formatTime24to12('09:30')).toBe('9:30 AM');
    });

    it('converts noon', () => {
      expect(formatTime24to12('12:00')).toBe('12:00 PM');
      expect(formatTime24to12('12:30')).toBe('12:30 PM');
    });

    it('converts afternoon times', () => {
      expect(formatTime24to12('13:00')).toBe('1:00 PM');
      expect(formatTime24to12('18:30')).toBe('6:30 PM');
    });

    it('converts midnight', () => {
      expect(formatTime24to12('00:00')).toBe('12:00 AM');
    });
  });

  describe('timeToMinutes', () => {
    it('converts 24hr format', () => {
      expect(timeToMinutes('09:00')).toBe(540);
      expect(timeToMinutes('13:30')).toBe(810);
      expect(timeToMinutes('00:00')).toBe(0);
    });

    it('converts 12hr format (old booking format)', () => {
      expect(timeToMinutes('08:00 AM')).toBe(480);
      expect(timeToMinutes('01:00 PM')).toBe(780);
      expect(timeToMinutes('12:00 PM')).toBe(720);
      expect(timeToMinutes('12:00 AM')).toBe(0);
    });
  });

  describe('minutesToTime24', () => {
    it('converts correctly', () => {
      expect(minutesToTime24(540)).toBe('09:00');
      expect(minutesToTime24(810)).toBe('13:30');
      expect(minutesToTime24(0)).toBe('00:00');
    });
  });

  describe('isSlotOverlapping', () => {
    it('detects overlap', () => {
      expect(isSlotOverlapping('10:00', '10:30', '10:00', '11:00')).toBe(true);
      expect(isSlotOverlapping('10:00', '10:30', '09:30', '10:30')).toBe(true);
    });

    it('detects no overlap (adjacent)', () => {
      expect(isSlotOverlapping('10:00', '10:30', '10:30', '11:00')).toBe(false);
      expect(isSlotOverlapping('10:30', '11:00', '10:00', '10:30')).toBe(false);
    });

    it('detects no overlap (separate)', () => {
      expect(isSlotOverlapping('10:00', '10:30', '14:00', '15:00')).toBe(false);
    });

    it('handles old 12hr format', () => {
      expect(isSlotOverlapping('10:00', '10:30', '08:00 AM', '12:00 PM')).toBe(true);
      expect(isSlotOverlapping('14:00', '14:30', '08:00 AM', '12:00 PM')).toBe(false);
    });
  });

  describe('generateSlots', () => {
    it('generates correct number of slots for 09:00-18:00', () => {
      const slots = generateSlots('09:00', '18:00', [], [], '2026-12-01');
      // 9 hours × 2 slots/hour = 18 slots
      expect(slots).toHaveLength(18);
      expect(slots[0].id).toBe('09:00');
      expect(slots[0].label).toBe('9:00 AM');
      expect(slots[17].id).toBe('17:30');
    });

    it('generates correct number for default 00:00-23:30', () => {
      const slots = generateSlots('00:00', '23:30', [], [], '2026-12-01');
      // 23.5 hours × 2 = 47 slots
      expect(slots).toHaveLength(47);
    });

    it('marks booked slots correctly', () => {
      const booked = [{ start: '10:00', end: '11:00' }];
      const slots = generateSlots('09:00', '18:00', booked, [], '2026-12-01');
      const slot1000 = slots.find(s => s.id === '10:00');
      const slot1030 = slots.find(s => s.id === '10:30');
      const slot1100 = slots.find(s => s.id === '11:00');
      expect(slot1000?.status).toBe('booked');
      expect(slot1030?.status).toBe('booked');
      expect(slot1100?.status).toBe('available');
    });

    it('marks blocked slots correctly', () => {
      const blocked = [{ start: '12:00', end: '13:00' }];
      const slots = generateSlots('09:00', '18:00', [], blocked, '2026-12-01');
      const slot1200 = slots.find(s => s.id === '12:00');
      const slot1230 = slots.find(s => s.id === '12:30');
      expect(slot1200?.status).toBe('blocked');
      expect(slot1230?.status).toBe('blocked');
    });

    it('marks selected slots correctly', () => {
      const selection: SlotSelection = { startSlotId: '10:00', endSlotId: '10:30', startTime: '10:00', endTime: '11:00', count: 2, duration: 60 };
      const slots = generateSlots('09:00', '18:00', [], [], '2026-12-01', selection);
      expect(slots.find(s => s.id === '10:00')?.status).toBe('selected');
      expect(slots.find(s => s.id === '10:30')?.status).toBe('selected');
      expect(slots.find(s => s.id === '11:00')?.status).toBe('available');
    });

    it('handles old 12hr format bookings', () => {
      const booked = [{ start: '08:00 AM', end: '12:00 PM' }];
      const slots = generateSlots('00:00', '23:30', booked, [], '2026-12-01');
      expect(slots.find(s => s.id === '08:00')?.status).toBe('booked');
      expect(slots.find(s => s.id === '11:30')?.status).toBe('booked');
      expect(slots.find(s => s.id === '12:00')?.status).toBe('available');
    });
  });

  describe('handleSlotTap', () => {
    const makeSlots = (count: number, startHour: number = 9): TimeSlot[] => {
      const slots: TimeSlot[] = [];
      for (let i = 0; i < count; i++) {
        const min = startHour * 60 + i * 30;
        const id = minutesToTime24(min);
        slots.push({ id, label: formatTime24to12(id), startTime: id, endTime: minutesToTime24(min + 30), status: 'available' });
      }
      return slots;
    };

    it('starts new selection on first tap', () => {
      const slots = makeSlots(10);
      const result = handleSlotTap('10:00', null, 4, slots);
      expect(result).not.toBeNull();
      expect(result!.startTime).toBe('10:00');
      expect(result!.endTime).toBe('10:30');
      expect(result!.count).toBe(1);
      expect(result!.duration).toBe(30);
    });

    it('extends selection on adjacent forward tap', () => {
      const slots = makeSlots(10);
      const current: SlotSelection = { startSlotId: '10:00', endSlotId: '10:00', startTime: '10:00', endTime: '10:30', count: 1, duration: 30 };
      const result = handleSlotTap('10:30', current, 4, slots);
      expect(result!.count).toBe(2);
      expect(result!.endTime).toBe('11:00');
      expect(result!.duration).toBe(60);
    });

    it('extends selection backward', () => {
      const slots = makeSlots(10);
      const current: SlotSelection = { startSlotId: '10:00', endSlotId: '10:00', startTime: '10:00', endTime: '10:30', count: 1, duration: 30 };
      const result = handleSlotTap('09:30', current, 4, slots);
      expect(result!.startTime).toBe('09:30');
      expect(result!.count).toBe(2);
      expect(result!.duration).toBe(60);
    });

    it('resets on non-adjacent tap', () => {
      const slots = makeSlots(10);
      const current: SlotSelection = { startSlotId: '10:00', endSlotId: '10:00', startTime: '10:00', endTime: '10:30', count: 1, duration: 30 };
      const result = handleSlotTap('12:00', current, 4, slots);
      expect(result!.startTime).toBe('12:00');
      expect(result!.count).toBe(1);
    });

    it('respects max slot limit', () => {
      const slots = makeSlots(10);
      const current: SlotSelection = { startSlotId: '10:00', endSlotId: '11:00', startTime: '10:00', endTime: '11:30', count: 3, duration: 90 };
      // Max is 3 slots, try to extend
      const result = handleSlotTap('11:30', current, 3, slots);
      // Should start new selection since can't extend
      expect(result!.startTime).toBe('11:30');
      expect(result!.count).toBe(1);
    });

    it('deselects when tapping only selected slot', () => {
      const slots = makeSlots(10);
      const current: SlotSelection = { startSlotId: '10:00', endSlotId: '10:00', startTime: '10:00', endTime: '10:30', count: 1, duration: 30 };
      const result = handleSlotTap('10:00', current, 4, slots);
      expect(result).toBeNull();
    });

    it('does not select booked slots', () => {
      const slots = makeSlots(10);
      slots[2].status = 'booked'; // 10:00 is booked
      const result = handleSlotTap('10:00', null, 4, slots);
      expect(result).toBeNull();
    });
  });

  describe('getSelectionSummary', () => {
    it('formats 30 min correctly', () => {
      const sel: SlotSelection = { startSlotId: '10:00', endSlotId: '10:00', startTime: '10:00', endTime: '10:30', count: 1, duration: 30 };
      const summary = getSelectionSummary(sel);
      expect(summary.startLabel).toBe('10:00 AM');
      expect(summary.endLabel).toBe('10:30 AM');
      expect(summary.durationLabel).toBe('30 min');
    });

    it('formats 2 hours correctly', () => {
      const sel: SlotSelection = { startSlotId: '10:00', endSlotId: '11:30', startTime: '10:00', endTime: '12:00', count: 4, duration: 120 };
      const summary = getSelectionSummary(sel);
      expect(summary.startLabel).toBe('10:00 AM');
      expect(summary.endLabel).toBe('12:00 PM');
      expect(summary.durationLabel).toBe('2 hours');
    });

    it('formats 1.5 hours correctly', () => {
      const sel: SlotSelection = { startSlotId: '14:00', endSlotId: '15:00', startTime: '14:00', endTime: '15:30', count: 3, duration: 90 };
      const summary = getSelectionSummary(sel);
      expect(summary.startLabel).toBe('2:00 PM');
      expect(summary.endLabel).toBe('3:30 PM');
      expect(summary.durationLabel).toBe('1h 30m');
    });
  });
});
